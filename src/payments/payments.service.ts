import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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


@Injectable()
export class PaymentsService {
  private paymentRepo: PaymentRepository
  
  constructor(
    private readonly connection: Connection, 
    private readonly userSvc: UsersService ) {
    this.paymentRepo = this.connection.getCustomRepository(PaymentRepository);
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
