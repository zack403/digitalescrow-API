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


@Injectable()
export class PaymentsService {
  private paymentRepo: PaymentRepository
  
  constructor(
    private readonly connection: Connection,
    private httpService: HttpService,
    private configService: ConfigService,
    private readonly userSvc: UsersService ) {
    this.paymentRepo = this.connection.getCustomRepository(PaymentRepository);
  }

  async generateTransactionVirtualAccount(customerHasVirtualAcctNo: boolean, payload: WovenCeateCustomerPayload): Promise<WovenCreateCustomerResponse> {
      
      const requestHeaders = {
        'Content-Type' : 'application/json',
        'Accept': 'application/json',
        'api_secret': `${this.configService.get('WOVEN_API_SECRET')}`
      };

      try {
        const response = await this.httpService.post(
                        customerHasVirtualAcctNo ? `${this.configService.get("WOVEN_BASE_URL")}/vnubans` : 
                        `${this.configService.get("WOVEN_BASE_URL")}/vnubans/create_customer`, 
                        JSON.stringify(payload), 
                        {headers: requestHeaders})
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

  async create(payload: CreatePaymentDto, req: any): Promise<ResponseSuccess> {

    const newPayment = plainToClass(PaymentEntity, payload);
    newPayment.createdBy = req.user.name;
    newPayment.userId = req.user.id;

    try {
      const saved = await this.paymentRepo.save(newPayment);
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
      const transactions = await this.paymentRepo.createQueryBuilder("payment")
              .where(new Brackets(qb => {
                  qb.where("payment.completed ILike :query", { query: `%${true}%` })
                  .orWhere("transaction.virtualAccountNumber ILike :van", { van: `%${search}%` })
                  
              }))
              .orderBy("payment.createdAt", "DESC")
              .skip(15 * (page ? page - 1 : 0))
              .take(15)
              .getMany();

      return transactions;
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

}
