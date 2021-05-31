import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { plainToClassFromExist } from 'class-transformer';
import { LoginDto } from 'src/auth/dto/login.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt.interface';
import { ResponseSuccess } from 'src/_common/response-success';
import { Filter } from 'src/_utility/filter.util';
import { Connection, DeleteResult, ILike } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UserRO } from './interfaces/user.interface';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private  userRepo: UsersRepository;


  constructor(private readonly connection: Connection 
  ) {
    this.userRepo = this.connection.getCustomRepository(UsersRepository);

   }

   async findAll(filter : Filter) : Promise<UserRO[]>{
      return await this.userRepo.findAll(filter);
   }

   
  async findOne(id: string) : Promise<UserRO>{
    
    try {
      const user = await this.userRepo.createQueryBuilder("user")
        .leftJoinAndSelect('user.transactions', 'transactions')
        .leftJoinAndSelect('user.payments', 'payments')
        .where("user.id = :userId", { userId: id })
        .orderBy('user.createdAt', 'DESC')
        .addOrderBy('transactions.createdAt', 'DESC')
        .addOrderBy('payments.createdAt', 'DESC')
        .getOne();
      //findOne(id,  {relations: ['transactions', 'payments'],  order: {createdAt: 'DESC'}});
   
      if(user) {
          return user;
      }
      throw new HttpException(`The user with ID ${id} cannot be found`, HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(`${error.message} `, HttpStatus.INTERNAL_SERVER_ERROR);
    }
   
  }

  async update(id: string, payload: UpdateUserDto, userObj: UserEntity) : Promise<ResponseSuccess> {
    try {
      const user = await this.userRepo.findOne(id);
      if(user) {
        if( user.email != payload.email) {
            const emailExist = await this.userRepo.findOne({where: {email: ILike(`%${payload.email}%`)}});
            if(emailExist){
                throw new HttpException( `Email with ${payload.email} is already in use`, HttpStatus.BAD_REQUEST);
            }
         }

         if( user.userBankDetails?.accountNumber != payload.userBankDetails?.accountNumber) {
          const acctNoExist = await this.userRepo.createQueryBuilder("user")
                                .where('user.userBankDetails ::jsonb @> :userBankDetails', {
                                  userBankDetails: {
                                    accountNumber: payload.userBankDetails.accountNumber
                                  }
                                }).getMany();
          if(acctNoExist.length > 0){
              throw new HttpException( `Account number with ${payload.userBankDetails.accountNumber} is already in use`, HttpStatus.BAD_REQUEST);
          }
       }
  
         user.updatedAt = new Date();
         user.updatedBy = userObj.updatedBy || userObj.createdBy;
  
         const updated = plainToClassFromExist(user, payload);
   
         await this.userRepo.save(updated);
         
         return {
            status: HttpStatus.OK,
            data: "Profile successfully updated"
         } 
        
      }
      throw new HttpException(`The user with ID ${id} cannot be found`, HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(`${error.message} `, error.status);
    }
   
    
  }

  async remove(id: string) : Promise<DeleteResult>{
    try {
      return await this.userRepo.delete(id);
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validateUser(payload: JwtPayload): Promise<UserRO> {
    if(!payload.email) {
      throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
    }

    return await this.userRepo.validateUser(payload);
  }

  async findByEmail(email: string): Promise<boolean> {
    const isExist = await this.userRepo.findByEmail(email);
    if(isExist) {
      return true;
    }
     return false;
  }

  async findUserByEmail(email: string): Promise<UserRO> {
    return await this.userRepo.findUserByEmail(email);
  }

  async register(request: RegisterDto): Promise<UserRO> {
    return await this.userRepo.register(request);
  }

  async authenticateUser({email}: LoginDto) {
    return await this.userRepo.authenticate(email);
  }

}
