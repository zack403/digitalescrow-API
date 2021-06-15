import { HttpException, HttpService, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { plainToClass, plainToClassFromExist } from 'class-transformer';
import { UserEntity } from 'src/users/entities/user.entity';
import { ResponseSuccess } from 'src/_common/response-success';
import { Filter } from 'src/_utility/filter.util';
import { Brackets, Connection, DeleteResult } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { PaymentRepository } from './payments.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentRO } from './interfaces/payment.interface';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { WovenCeateCustomerPayload } from './interfaces/woven-create-customer.interface';
import { WovenCreateCustomerResponse } from './interfaces/woven-create-customer-response.interface';
import { ConfigService } from '@nestjs/config';
import { TransactionRepository } from 'src/transactions/transaction.repository';
import { PaymentStatus, TransactionStatus, TransactionType } from 'src/enum/enum';
import { TransactionEntity } from 'src/transactions/entities/transaction.entity';
import { UserRO } from 'src/users/interfaces/user.interface';
import SendGridService from 'src/_common/sendgrid/sendgrid.service';


@Injectable()
export class PaymentsService {
  private paymentRepo: PaymentRepository;
  private transRepo: TransactionRepository;
  
  requestHeaders = {
    'Content-Type' : 'application/json',
    'Accept': 'application/json',
    'api_secret': `${this.configService.get('WOVEN_API_SECRET')}`
  };

  constructor(
    private readonly connection: Connection,
    private httpService: HttpService,
    private configService: ConfigService,
    private readonly sendGridSvc: SendGridService,
    private readonly userSvc: UsersService ) {
    this.paymentRepo = this.connection.getCustomRepository(PaymentRepository);
    this.transRepo = this.connection.getCustomRepository(TransactionRepository);
    

  }

  async generateTransactionVirtualAccount(customerHasVirtualAcctNo: boolean, payload: WovenCeateCustomerPayload): Promise<WovenCreateCustomerResponse> {
      
      try {
        const response = await this.httpService.post(
                        customerHasVirtualAcctNo ? `${this.configService.get("WOVEN_BASE_URL")}/vnubans` : 
                        `${this.configService.get("WOVEN_BASE_URL")}/vnubans/create_customer`, 
                        JSON.stringify(payload), 
                        {headers: this.requestHeaders})
                        .toPromise();
        
        const {data} = response.data;
        if(data.vnuban) {
          const returnObj : WovenCreateCustomerResponse = {
            accountNumber: data.vnuban,
            bankName: data.bank_name,
            bankCode: data.bank_code,
            expiresOn: new Date(data.expires_on)
          }
          
          return returnObj;
        }
      } catch ({response}) {
        const {message} = response.data;
        Logger.error(`Woven.generateVa: ${message}`);
        throw new HttpException(`Error while trying to create customer vnuban: Error: ${message}`, response.status === 400 ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }

  async releasePayment(transactionId: string, req: any): Promise<ResponseSuccess>  {
    if(!transactionId) {
      throw new HttpException('Transaction id cannot be empty', HttpStatus.BAD_REQUEST);
    }

    const transaction = await this.transRepo.findOne(transactionId);
    if(transaction) {
       if(transaction.type != TransactionType.BUY) {
         throw new HttpException('You can only release a payment as a buyer', HttpStatus.BAD_REQUEST);
       }

       const userPayingTo = await this.userSvc.findUserByEmail(transaction.counterPartyInfo.email);
       if(userPayingTo) {
          if (!userPayingTo.userBankDetails?.accountNumber || !userPayingTo.userBankDetails?.bankCode) {
              throw new HttpException('The seller you want to release payment to have not updated there bank information yet', HttpStatus.NOT_ACCEPTABLE)
          }
       } else {
         throw new HttpException('The seller you are trying to release payment to does not exist', HttpStatus.NOT_FOUND);
       }


       //check if vNuban generated for the transaction has money in it
        if(!transaction.escrowBankDetails.hasMoney) {
          throw new HttpException('Operation failed, Escrow account to debit does not have money in it', HttpStatus.BAD_REQUEST);
        }

        await this.initiatePayout(transaction, userPayingTo);

    }
    throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
  }

  async requestPayment(transactionId: string, req: any): Promise<ResponseSuccess>  {
    if(!transactionId) {
      throw new HttpException('Transaction id cannot be empty', HttpStatus.BAD_REQUEST);
    }

    const transaction = await this.transRepo.findOne(transactionId);
    if(transaction) {
       if(transaction.type != TransactionType.SELL) {
         throw new HttpException('You can only request a payment as a seller', HttpStatus.BAD_REQUEST);
       }

       const userRequestingPayout = await this.userSvc.findOne(transaction.userId);
       if(userRequestingPayout) {
          if (!userRequestingPayout.userBankDetails?.accountNumber || !userRequestingPayout.userBankDetails?.bankCode) {
              throw new HttpException('Please update your bank information before requesting for payout', HttpStatus.NOT_ACCEPTABLE)
          }
       } else {
         throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
       }

       await this.initiatePayout(transaction, userRequestingPayout);

    }
    throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
  }

  async triggerPayment(transactionId: string, host: string): Promise<ResponseSuccess> {
    if(!transactionId) {
      throw new HttpException('Transaction id cannot be empty', HttpStatus.BAD_REQUEST);
    }

    const transaction = await this.transRepo.findOne(transactionId);
    if(transaction) {
      if(transaction.type != TransactionType.SELL) {
        throw new HttpException('You can only trigger payment into escrow as a seller', HttpStatus.BAD_REQUEST);
      }

      if(transaction.status != TransactionStatus.ACCEPTED) {
        throw new HttpException('Unable to trigger payment: Buyer has not accepted this transaction.', HttpStatus.BAD_REQUEST);
      }

      const mailOptions = {
        to: transaction.counterPartyInfo.email,
        from: this.configService.get('SENDGRID_FROM_EMAIL'),
        subject: 'Make Payment',
        text: 'Hi there, You accepted an escrow transaction and you are due to make payment.\n\n' +
        'Kindly login to your account to complete the process:\n\n' +
        host +'/login',
        templateId: ''
      }
     
        try {
            const sent = await this.sendGridSvc.sendMailAsync(mailOptions);
            if(sent) {
              return {
                status: HttpStatus.OK,
                data: "The buyer has been notified about the payment."
              }
            }
        } catch (error) {
            return error.message;
        }
    } 
    throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);

  }

  async create(payload: CreatePaymentDto, req: any): Promise<ResponseSuccess> {

    const newPayment = plainToClass(PaymentEntity, payload);
    newPayment.createdBy = req.user.name;
    newPayment.userId = req.user.id;

    try {
      await this.paymentRepo.save(newPayment);
      return {
        status: HttpStatus.OK,
        data: `Payment created` 
      };
    } catch (error) {
      throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll({search, page} : Filter): Promise<PaymentRO[]> {
    if(search) {
      const payments = await this.paymentRepo.createQueryBuilder("payment")
              .where(new Brackets(qb => {
                  qb.where("payment.virtualAccountNumber ILike :van", { van: `%${search}%` })                  
              }))
              .orderBy("payment.createdAt", "DESC")
              .skip(15 * (page ? page - 1 : 0))
              .take(15)
              .getMany();

      return payments;
    }
      return await this.paymentRepo.find({ order: {createdAt: 'DESC'}, take: 15, skip: page ? 15 * (page - 1) : 0});
  }

  async findOne(id: string): Promise<PaymentRO> {
    try {
      const payment = await this.paymentRepo.findOne(id);
      if(payment) {
          return payment;
      }
      throw new HttpException(`The payment with ID ${id} cannot be found`, HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(`${error.message} `, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, payload: UpdatePaymentDto, userObj: UserEntity): Promise<ResponseSuccess> {
    try {
      const payment = await this.paymentRepo.findOne(id);
      if(payment) {
    
        payment.updatedAt = new Date();
        payment.updatedBy = userObj.updatedBy || userObj.createdBy;
  
         const updated = plainToClassFromExist(payment, payload);
   
         await this.paymentRepo.save(updated);
         return {
           status: HttpStatus.OK,
           data: "Payment successfully updated"
         } 
        
      }
      throw new HttpException(`The Payment with ID ${id} cannot be found`, HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(`${error.message} `, HttpStatus.INTERNAL_SERVER_ERROR);
    }
   
  }


  async remove(id: string): Promise<DeleteResult> {
    try {
      return await this.paymentRepo.delete(id);
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  public async initiatePayout(transaction: TransactionEntity, userPayingTo: UserRO) {
        const payload = {
          beneficiary_nuban : userPayingTo.userBankDetails.accountNumber,
          amount : transaction.amount,
          source_account : this.configService.get("DESTINATION_NUBAN"),
          beneficiary_bank_code : userPayingTo.userBankDetails.bankCode,
          PIN : this.configService.get('WOVEN_PIN')
        }

        try {
          // release payment here
          const response = await this.httpService.post(`${this.configService.get("WOVEN_BASE_URL")}/payouts/request?command=initiate`, 
          JSON.stringify(payload), 
          {headers: this.requestHeaders})
          .toPromise(); 

          console.log({response});

          Logger.log("returnValue", JSON.stringify(response));

          const returnValue = response.data;
          console.log({returnValue});
          if(returnValue.status === 'success') {
            //payout completed
            transaction.escrowBankDetails.payoutComplete = true;
            transaction.escrowBankDetails.payoutReference = returnValue.data.payout_reference;
            await this.transRepo.save(transaction);

            // if(transaction.type === TransactionType.BUY) {
            //   const request = [];
            //   // save buyer payment sent and seller payment recieved on payment table
            //   const paymentSentPayload: CreatePaymentDto = {
            //     userId: transaction.userId,
            //     amountSent: transaction.amount,
            //     amountRecieved: 0,
            //     status: PaymentStatus.COMPLETED,
            //     transactionId: transaction.id,
            //     paymentDate: new Date(),
            //     virtualAccountNumber: transaction.escrowBankDetails.accountNumber
            //   } 

            //   request.push(paymentSentPayload);

            //   const paymentRecievedPayload: CreatePaymentDto = {
            //     userId: userPayingTo.id,
            //     amountSent: 0,
            //     amountRecieved: transaction.amount,
            //     status: PaymentStatus.COMPLETED,
            //     transactionId: transaction.id,
            //     paymentDate: new Date(),
            //     virtualAccountNumber: transaction.escrowBankDetails.accountNumber
            //   }

            //   request.push(paymentRecievedPayload);
            //   await this.paymentRepo.save(request);

            // }
            // else if (transaction.type === TransactionType.SELL) {
            //     // save buyer payment sent and seller payment recieved on payment table;
            //   const request = [];
            //   const paymentRecievedPayload: CreatePaymentDto = {
            //     userId: transaction.userId,
            //     amountSent: 0,
            //     amountRecieved: transaction.amount,
            //     status: PaymentStatus.COMPLETED,
            //     transactionId: transaction.id,
            //     paymentDate: new Date(),
            //     virtualAccountNumber: transaction.escrowBankDetails.accountNumber
            //   } 

            //   request.push(paymentRecievedPayload);

            //   const paymentSentPayload: CreatePaymentDto = {
            //     userId: userPayingTo.id,
            //     amountSent: transaction.amount,
            //     amountRecieved: 0,
            //     status: PaymentStatus.COMPLETED,
            //     transactionId: transaction.id,
            //     paymentDate: new Date(),
            //     virtualAccountNumber: transaction.escrowBankDetails.accountNumber
            //   } 

            //   request.push(paymentSentPayload);
            //   await this.paymentRepo.save(request);
            // }
            return {
              status: 200,
              data: 'Payout transaction successful'
            }
          } else if (returnValue.status === 'failed') {
            return {
              status: 500,
              data: 'Payout transaction failed'
            }
          } else {
            return {
              status: 200,
              data: 'Payout transaction initiated and its pending'
            }
          }
      } catch (error) {
        if(error.code === 'ENOTFOUND') {
          throw new HttpException(`Please make sure you are connected to the internet`, HttpStatus.NOT_ACCEPTABLE);
        }
        console.log("error", error);
        Logger.error(`Woven.releasePayment: ${error}`);

        //const {message} = error.response.data;
        //Logger.error(`Woven.releasePayment: ${message}`);
        throw new HttpException(`Error while trying to release payment: Error: ${error}`,  HttpStatus.BAD_REQUEST );
      }
  }

  async GetBanks() {
    const {data: data} = await this.httpService.get(`${this.configService.get("WOVEN_BASE_URL")}/banks`, {headers: this.requestHeaders}).toPromise();
    return data;
  }

  async VerifyNuban(payload: any) {
    try {
      const {data: data} = await this.httpService.post(`${this.configService.get("WOVEN_BASE_URL")}/nuban/enquiry`, JSON.stringify(payload), {headers: this.requestHeaders}).toPromise();
      return data;
    } catch (error) {
      console.log("verify.nuban", error);
      Logger.log("verify.nuban", error);
    }
  }

}
