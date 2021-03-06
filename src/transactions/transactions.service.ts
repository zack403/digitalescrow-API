import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { plainToClass, plainToClassFromExist } from 'class-transformer';
import { UserEntity } from 'src/users/entities/user.entity';
import { ResponseSuccess } from 'src/_common/response-success';
import { Filter } from 'src/_utility/filter.util';
import { Brackets, Connection, DeleteResult } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionRO } from './interfaces/transaction.interface';
import { TransactionRepository } from './transaction.repository';
import SendGridService from 'src/_common/sendgrid/sendgrid.service';
import { SendgridData } from 'src/_common/sendgrid/sendgrid.interface';
import { ConfigService } from '@nestjs/config';
import {formatter} from '../_utility/currency-formatter.util';
import { TransactionStatus, TransactionType } from 'src/enum/enum';
import { UsersService } from 'src/users/users.service';
import { NewTermsDto } from './dto/new-terms.dto';
import { RejectionDto } from './dto/rejection.dto';
import { WovenCeateCustomerPayload } from 'src/payments/interfaces/woven-create-customer.interface';
import { PaymentsService } from 'src/payments/payments.service';
import { isNotValidDate } from 'src/_utility/date-validator.util';


@Injectable()
export class TransactionsService {
  private transRepo: TransactionRepository
  
  constructor(
    private readonly connection: Connection, 
    private readonly configService: ConfigService, 
    private readonly sendGridSvc: SendGridService,
    private readonly paymentSvc: PaymentsService,
    private readonly userSvc: UsersService ) {
    this.transRepo = this.connection.getCustomRepository(TransactionRepository);
  }

  async create(createTransactionDto: CreateTransactionDto, req: any): Promise<ResponseSuccess> {

    // const userTransaction = await this.transRepo.findOne({where: {userId: req.user.id }, order: {createdAt: 'DESC'}});
    
    // if(userTransaction && createTransactionDto.type === TransactionType.BUY) {
    //   if(userTransaction.type === TransactionType.BUY && !userTransaction.escrowBankDetails?.hasMoney){
    //    throw new HttpException('Looks like you have a previous transaction that is awaiting your payment, please proceed to make payment', HttpStatus.BAD_REQUEST);
    //   }
    // } else if (userTransaction && createTransactionDto.type === TransactionType.SELL) {
    //   if(userTransaction.type === TransactionType.SELL && !userTransaction.escrowBankDetails?.hasMoney){
    //     throw new HttpException('Looks like you have a previous transaction that is awaiting your buyers payment', HttpStatus.BAD_REQUEST);
    //    }
    // }

    if(!createTransactionDto.counterPartyInfo.name || !createTransactionDto.counterPartyInfo.email) {
      throw new HttpException("The counter party info name and email cannot be empty.", HttpStatus.BAD_REQUEST);
    }

    if(!(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(createTransactionDto.counterPartyInfo.email))) {
      throw new HttpException("The counter party info email you entered is not valid.", HttpStatus.BAD_REQUEST);
    }

    if(isNotValidDate(createTransactionDto.paymentDate)) {
      throw new HttpException("Payment date of transaction cannot be lesser than the current date.", HttpStatus.BAD_REQUEST);
    }

    if(isNotValidDate(createTransactionDto.expiryDate)) {
      throw new HttpException("Expiry date of transaction cannot be lesser than the current date.", HttpStatus.BAD_REQUEST);
    }

    if(new Date(createTransactionDto.paymentDate).setHours(0,0,0,0) > new Date(createTransactionDto.expiryDate).setHours(0,0,0,0)) {
      throw new HttpException('Payment date of transaction cannot be greater than Expiry date', HttpStatus.BAD_REQUEST);
    }

    const newTransaction = plainToClass(TransactionEntity, createTransactionDto);
    newTransaction.createdBy = req.user.name;
    newTransaction.userId = req.user.id;
    
    newTransaction.expiryGracePeriodDate = new Date(newTransaction.expiryDate);
    newTransaction.expiryGracePeriodDate.setDate(new Date(newTransaction.expiryDate).getDate() + 2);
    newTransaction.paymentGracePeriodDate = new Date(newTransaction.paymentDate);
    newTransaction.paymentGracePeriodDate.setDate(new Date(newTransaction.paymentDate).getDate() + 1);

    const userInfo = await this.userSvc.findOne(newTransaction.userId);
    newTransaction.initiatorInfo = {name: userInfo.name, email: userInfo.email};

    // tie an escrow transaction with a virtual account Number here;
    const today = new Date();
    const expires_on = new Date(today.setDate(today.getDate() + 1));
    
    const wovenPayload : WovenCeateCustomerPayload = {
      customer_reference: req.user.id,
      name: req.user.name,
      email: req.user.email,
      mobile_number: newTransaction.phoneNumber,
      expires_on,
      min_amount: newTransaction.amount,
      max_amount: newTransaction.amount,
      destination_nuban: this.configService.get('DESTINATION_NUBAN')
    }

    let customerHasVirtualAcctNo = false;
    const userTransaction = await this.transRepo.findOne({where: {userId: req.user.id }, order: {createdAt: 'DESC'}});

    if(userTransaction && userTransaction.escrowBankDetails?.accountNumber) {
      customerHasVirtualAcctNo = true;
    } else {
      customerHasVirtualAcctNo = false;
    }


    const resultFromWovenApi = await this.paymentSvc.generateTransactionVirtualAccount(customerHasVirtualAcctNo, wovenPayload);
    newTransaction.escrowBankDetails = resultFromWovenApi;
    newTransaction.escrowBankDetails.hasMoney = false;
    newTransaction.escrowBankDetails.payoutComplete = false;
    newTransaction.escrowBankDetails.payoutReference = "";

    try {
      const saved = await this.transRepo.save(newTransaction);
      if(await this.notifyCounterParty(saved, req)) {
        return {
          status: HttpStatus.OK,
          header: 'Escrow Created.',
          data: `Your request has been sent to the ${saved.type === TransactionType.BUY ? 'Seller' : 'buyer' } and we???d notify you when he accepts it` 
        };
      }
    } catch (error) {
      throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll({search, page} : Filter): Promise<TransactionRO[]> {
    if(search) {
      const transactions = await this.transRepo.createQueryBuilder("transaction")
              .where(new Brackets(qb => {
                  qb.where("transaction.status ILike :status", { status: `%${search}%` })
                  .orWhere('transaction.counterPartyInfo ::jsonb @> :counterPartyInfo', {
                    counterPartyInfo: {
                      email: search
                    }
                  })
                  .orWhere("transaction.commodityName ILike :commodityName", { commodityName: `%${search}%` })
              }))
              .orderBy("transaction.createdAt", "DESC")
              .skip(15 * (page ? page - 1 : 0))
              .take(15)
              .getMany();

      return transactions;
    }
      return await this.transRepo.find({ order: {createdAt: 'DESC'}, take: 15, skip: page ? 15 * (page - 1) : 0});
  }

  async findOne(id: string): Promise<TransactionRO> {
    try {
      const transaction = await this.transRepo.findOne(id);
      if(transaction) {
          return transaction;
      }
      throw new HttpException(`The transaction with ID ${id} cannot be found`, HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(`${error.message} `, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto, userObj: UserEntity): Promise<ResponseSuccess> {
    try {
      const transaction = await this.transRepo.findOne(id);
      if(transaction) {
    
        transaction.updatedAt = new Date();
        transaction.updatedBy = userObj.updatedBy || userObj.createdBy;
  
         const updated = plainToClassFromExist(transaction, updateTransactionDto);
   
         await this.transRepo.save(updated);
         return {
           status: HttpStatus.OK,
           data: "Transaction successfully updated"
         } 
        
      }
      throw new HttpException(`The Transaction with ID ${id} cannot be found`, HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(`${error.message} `, HttpStatus.INTERNAL_SERVER_ERROR);
    }
   
  }

  async accept(id: string, req: any): Promise<ResponseSuccess> {
    const transactionToAccept = await this.transRepo.findOne(id);

    if(!transactionToAccept) {
      throw new HttpException('The transaction you are trying to accept does not exist', HttpStatus.NOT_FOUND);
    }

    if(transactionToAccept.status === TransactionStatus.ACCEPTED) {
      throw new HttpException('This transaction has been accepted already.', HttpStatus.BAD_REQUEST);
    }

    transactionToAccept.status = TransactionStatus.ACCEPTED;
    transactionToAccept.updatedAt = new Date();
    transactionToAccept.updatedBy = req.user.name;

    const patched = await this.transRepo.save(transactionToAccept);
    if(patched) {
      // send an email notifying the other party that counter party accepted
      const otherPartyInfo = await this.userSvc.findOne(patched.userId);
      
      if(otherPartyInfo) {
        const msg: SendgridData = {
          to: otherPartyInfo.email,
          from: this.configService.get('SENDGRID_FROM_EMAIL'),
          templateId: transactionToAccept.type === TransactionType.BUY ? this.configService.get('SENDGRID_SELLER_ACCEPT_TEMPLATE_ID') : this.configService.get('SENDGRID_BUYER_ACCEPT_TEMPLATE_ID'),
          dynamicTemplateData: {
              name: otherPartyInfo.name,
              link: this.configService.get("host") +'/transaction-payment/' + transactionToAccept.id + '/' + otherPartyInfo.name + '/' + otherPartyInfo.email
          }
        }

        const acceptanceNotificationSent = await this.sendGridSvc.sendMailAsync(msg);
        if(acceptanceNotificationSent) {
          let data;
          if(transactionToAccept.type === TransactionType.BUY) {
            data = 'We???ll let the buyer know about this and inform you when payment has been made';
          } else {
            data = 'We???ll let the Seller know about this and then you can proceed to make payments';
          }
          return  {
            status: HttpStatus.OK,
            header: 'Offer Accepted!',
            data
          }
        } 
      }
    } else {
      throw new HttpException('Error while accepting transaction, try again', HttpStatus.INTERNAL_SERVER_ERROR)
    }

  }

  async reject(id: string, data: RejectionDto, req: any): Promise<ResponseSuccess> {
    
    if(!data.reason) {
      throw new HttpException('Rejection Reason cannot be empty', HttpStatus.BAD_REQUEST);
    }

    const transactionToReject = await this.transRepo.findOne(id);

    if(!transactionToReject) {
      throw new HttpException('The transaction you are trying to reject does not exist', HttpStatus.NOT_FOUND);
    }

    if(transactionToReject.status === TransactionStatus.REJECTED) {
      throw new HttpException('This transaction has been rejected already.', HttpStatus.BAD_REQUEST);
    }

    transactionToReject.status = TransactionStatus.REJECTED;
    transactionToReject.rejectionReason = data.reason;
    transactionToReject.updatedAt = new Date();
    transactionToReject.updatedBy = req.user.name;

    const patched = await this.transRepo.save(transactionToReject);
    if(patched) {
      // send an email notifying the
      const otherPartyInfo = await this.userSvc.findOne(patched.userId);
      
      if(otherPartyInfo) {
        
        const msg: SendgridData = {
          to: otherPartyInfo.email,
          from: this.configService.get('SENDGRID_FROM_EMAIL'),
          templateId: this.configService.get('SENDGRID_ESCROW_REJECTED_TEMPLATE_ID'),
          dynamicTemplateData: {
              name: otherPartyInfo.name,
              type: transactionToReject.type === TransactionType.BUY ? 'Seller' : 'Buyer',
              reason: data.reason
          }
        }

        const rejectionNotificationSent = await this.sendGridSvc.sendMailAsync(msg);
        if(rejectionNotificationSent) {
          return  {
            status: HttpStatus.OK,
            header: 'Offer Rejected!',
            data: 'Oh my! We???re sad that this doesn???t suit what you would like. Maybe next time.'
          }
        } 
      }
    } else {
      throw new HttpException('Error while rejecting transaction, try again', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async newTerms(id: string, data: NewTermsDto, req: any): Promise<ResponseSuccess> {

    if(!data.conditions) {
      throw new HttpException('Conditions cannot be empty', HttpStatus.BAD_REQUEST);
    }

    const transaction = await this.transRepo.findOne(id);
    if(!transaction) {
      throw new HttpException('The transaction you are trying to send new terms for does not exist', HttpStatus.NOT_FOUND);
    }

    transaction.conditions = data.conditions;
    transaction.otherMessage = data.message;
    transaction.updatedAt = new Date();
    transaction.updatedBy = req.user.name;
    transaction.hasChanges = true;

    const patched = await this.transRepo.save(transaction);
    if(patched) {
      // send an email notifying the
      const otherPartyInfo = await this.userSvc.findOne(patched.userId);
      
      if(otherPartyInfo) {
        
        const msg: SendgridData = {
            to: otherPartyInfo.email,
            from: this.configService.get('SENDGRID_FROM_EMAIL'),
            templateId: this.configService.get('SENDGRID_ESCROW_CHANGE_TEMPLATE_ID'),
            dynamicTemplateData: {
              subject: transaction.type === TransactionType.BUY ? 'Seller suggested changes to the escrow transaction' : 'Buyer suggested changes to the escrow transaction',
              sellerName: otherPartyInfo.name,
              buyerName: req.user.name,
              productName: patched.commodityName,
              description: patched.description,
              price: formatter.format(patched.amount),
              conditions: data.conditions.join(),
              message: data.message,
              link: this.configService.get("host") +'/escrow-review/'+ patched.id
          }
        }

        const sent = await this.sendGridSvc.sendMailAsync(msg);
        if(sent) {
          let data;
          if(transaction.type === TransactionType.BUY) {
            data = 'We???ll inform the buyer about this and let you know if he agrees to the new terms.';
          } else {
            data = 'We???ll inform the seller about this and let you know if he agrees to the new terms.';
          }
          return  {
            status: HttpStatus.OK,
            header: 'Changes Made!',
            data
          }
        } 
      }
    } else {
      throw new HttpException('Error while making changes to transaction, try again', HttpStatus.INTERNAL_SERVER_ERROR)
    }


  }

  async remove(id: string): Promise<DeleteResult> {
    try {
      return await this.transRepo.delete(id);
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async notifyCounterParty(payload: TransactionEntity, req: any): Promise<boolean> {

    const msg: SendgridData = {
        to: payload.counterPartyInfo.email,
        from: this.configService.get('SENDGRID_FROM_EMAIL'),
        templateId: this.configService.get('SENDGRID_SELLER_JOIN_TEMPLATE_ID'),
        dynamicTemplateData: {
            sellerName: payload.counterPartyInfo.name,
            buyerName: req.user.name,
            productName: payload.commodityName,
            description: payload.description,
            price: formatter.format(payload.amount),
            conditions: payload.conditions.join(),
            link: this.configService.get("host") +'/escrow-review/'+ payload.id
        }
    }

    const notified = await this.sendGridSvc.sendMailAsync(msg);
    if(notified) {
      return true;
    }
  }

  async onWovenEvents(payload: any): Promise<any> {
    if(!payload) {
      Logger.log("woven-events", "no payload");
      return {
        status: 400,
        data: "No data"
      }
    }

    if(payload.unique_reference) { // means a successful payment has been made into the escrow acct so update necessary table and notify both parties
      const transaction = await this.transRepo.createQueryBuilder("trans")
                          .where('trans.escrowBankDetails ::jsonb @> :escrowBankDetails', {
                            escrowBankDetails: {
                              accountNumber: payload.nuban
                            }
                        }).getOne();

      if(transaction){
        transaction.escrowBankDetails.hasMoney = true;
        await this.transRepo.save(transaction);

        //notify both parties of the transaction that payment has been made into the escrow account
        if(transaction.type === TransactionType.BUY) {
          // get the initiator info info
          const mails = [];
          const buyerMailOptions = {
            to: transaction.initiatorInfo.email,
            from: this.configService.get('SENDGRID_FROM_EMAIL'),
            subject: 'Payment made into escrow',
            text:   `<p> Hi ${transaction.initiatorInfo.name}, </p>
                    <p> Your payment into the escrow account ${transaction.escrowBankDetails.accountNumber}-${transaction.escrowBankDetails.bankName} was successful.</p>
                    <p> Thank you for choosing <strong> Descrow. </strong></p>`
          }

          mails.push(buyerMailOptions);

          const sellerMailOptions = {
            to: transaction.counterPartyInfo.email,
            from: this.configService.get('SENDGRID_FROM_EMAIL'),
            subject: 'Payment made into escrow',
            text:   `<p> Hi ${transaction.counterPartyInfo.name}, </p>
                    <p> We are sending you this message to notify you,</p>
                    <p> that the buyer has made payment for transaction ${transaction.commodityName} into the escrow account</p>
                    <p> Thank you for choosing <strong> Descrow. </strong></p>`
          }

          mails.push(sellerMailOptions);
         
          try {
              const sent = await this.sendGridSvc.sendMailAsync(mails as SendgridData[]);
              if(sent) {
                return HttpStatus.OK;
              }
          } catch (error) {
              Logger.log("on_woven_events_send_mail", error)
              return HttpStatus.OK;
          }
          
        } else if (transaction.type === TransactionType.SELL) {
          const mails = [];
          
          const buyerMailOptions = {
            to: transaction.initiatorInfo.email,
            from: this.configService.get('SENDGRID_FROM_EMAIL'),
            subject: 'Payout successful',
            text: `<p> Hi ${transaction.initiatorInfo.name}, </p>
                  <p> Your payout to ${transaction.counterPartyInfo.name} was successful.</p>
                  <p> Thank you for choosing <strong> Descrow. </strong></p>`
          }

          mails.push(buyerMailOptions);

          const sellerMailOptions = {
            to: transaction.counterPartyInfo.email,
            from: this.configService.get('SENDGRID_FROM_EMAIL'),
            subject: 'Payout successful',
            text:   `<p> Hi ${transaction.counterPartyInfo.name}, </p>
                    <p> The buyer has paid for your goods and services,</p>
                    <p> Please confirm that you have recieved payment.</p>
                    <p> Thank you for choosing <strong> Descrow. </strong></p>`  
          }

          mails.push(sellerMailOptions);
         
          try {
              const sent = await this.sendGridSvc.sendMailAsync(mails as SendgridData[]);
              if(sent) {
                return HttpStatus.OK;
              }
          } catch (error) {
              Logger.log("on_woven_events_send_mail", error)
              return HttpStatus.OK;
          }
        }
        return HttpStatus.OK;

      } else {
        Logger.log("woven_events_unique refernece", JSON.stringify(transaction));
        return HttpStatus.OK;
      }
    } else if (payload.payout_reference) {
      const transaction = await this.transRepo.createQueryBuilder("trans")
                          .where('trans.escrowBankDetails ::jsonb @> :escrowBankDetails', {
                            escrowBankDetails: {
                              payoutReference: payload.payout_reference
                            }
                        }).getOne();

      if(transaction){
        transaction.escrowBankDetails.payoutComplete = true;
        transaction.escrowBankDetails.payoutReference = payload.payout_reference
        await this.transRepo.save(transaction);
        return HttpStatus.OK;

      } else {
        Logger.log("woven_events_payout refernece", JSON.stringify(transaction));
        return HttpStatus.OK;

      }
    }
  }
}
