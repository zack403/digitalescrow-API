import { HttpException, HttpStatus, Injectable, PayloadTooLargeException } from '@nestjs/common';
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
import { TransactionStatus } from 'src/enum/enum';
import { UsersService } from 'src/users/users.service';
import { NewTermsDto } from './dto/new-terms.dto';
import { RejectionDto } from './dto/rejection.dto';
import { WovenCeateCustomerPayload } from 'src/payments/interfaces/woven-create-customer.interface';
import { PaymentsService } from 'src/payments/payments.service';


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

    const newTransaction = plainToClass(TransactionEntity, createTransactionDto);
    newTransaction.createdBy = req.user.name;
    newTransaction.userId = req.user.id;

    // tie an escrow transaction with a virtual account Number here;
    const today = new Date();
    const expires_on = new Date(today.setDate(today.getDate() + 1));
    
    const wovenPayload : WovenCeateCustomerPayload = {
      customer_reference: req.user.id,
      name: req.user.name,
      email: req.user.email,
      mobile_number: newTransaction.phoneNumber,
      expires_on
    }

    let customerHasVirtualAcctNo: boolean = false;
    const customerTransaction = await this.transRepo.findOne({where: {userId: req.user.id}});
    if(customerTransaction && customerTransaction.escrowBankDetails.accountNumber) {
      customerHasVirtualAcctNo = true;
    } else {
      customerHasVirtualAcctNo = false;
    }


    const resultFromWovenApi = await this.paymentSvc.generateTransactionVirtualAccount(customerHasVirtualAcctNo, wovenPayload);
    newTransaction.escrowBankDetails = resultFromWovenApi;

    try {
      const saved = await this.transRepo.save(newTransaction);
      if(await this.notifyCounterParty(saved, req)) {
        return {
          status: HttpStatus.OK,
          header: 'Escrow Created.',
          data: `Your request has been sent to the ${saved.type === 'buying' ? 'Seller' : 'buyer' } and we’d notify you when he accepts it` 
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
                  .orWhere("transaction.counterPartyInfo.email ILike :email", { email: `%${search}%` })
                  .orWhere("transaction.commodityName :commodityName", { commodityName: `%${search}%` })
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
          templateId: transactionToAccept.type === 'buying' ? this.configService.get('SENDGRID_SELLER_ACCEPT_TEMPLATE_ID') : this.configService.get('SENDGRID_BUYER_ACCEPT_TEMPLATE_ID'),
          dynamicTemplateData: {
              name: otherPartyInfo.name,
              link: req.headers.origin +'/transaction-payment/' + transactionToAccept.id + '/' + otherPartyInfo.name + '/' + otherPartyInfo.email
          }
        }

        const acceptanceNotificationSent = await this.sendGridSvc.sendMailAsync(msg);
        if(acceptanceNotificationSent) {
          let data;
          if(transactionToAccept.type === 'buying') {
            data = 'We’ll let the buyer know about this and inform you when payment has been made';
          } else {
            data = 'We’ll let the Seller know about this and then you can proceed to make payments';
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
              type: transactionToReject.type === 'buying' ? 'Seller' : 'Buyer',
              reason: data.reason
          }
        }

        const rejectionNotificationSent = await this.sendGridSvc.sendMailAsync(msg);
        if(rejectionNotificationSent) {
          return  {
            status: HttpStatus.OK,
            header: 'Offer Rejected!',
            data: 'Oh my! We’re sad that this doesn’t suit what you would like. Maybe next time.'
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
              subject: transaction.type === 'buying' ? 'Seller suggested changes to the escrow transaction' : 'Buyer suggested changes to the escrow transaction',
              sellerName: otherPartyInfo.name,
              buyerName: req.user.name,
              productName: patched.commodityName,
              description: patched.description,
              price: formatter.format(patched.amount),
              conditions: data.conditions.join(),
              message: data.message,
              link: req.headers.origin +'/escrow-review/'+ patched.id
          }
        }

        const sent = await this.sendGridSvc.sendMailAsync(msg);
        if(sent) {
          let data;
          if(transaction.type === 'buying') {
            data = 'We’ll inform the buyer about this and let you know if he agrees to the new terms.';
          } else {
            data = 'We’ll inform the seller about this and let you know if he agrees to the new terms.';
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
            link: req.headers.origin +'/escrow-review/'+ payload.id
        }
    }

    const notified = await this.sendGridSvc.sendMailAsync(msg);
    if(notified) {
      return true;
    }
  }

}
