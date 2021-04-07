import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginDto } from 'src/auth/dto/login.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt.interface';
import { Connection } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { LoginRO } from './interfaces/login-ro.interface';
import { UserRO } from './interfaces/user.interface';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private  userRepo: UsersRepository;


  constructor(private readonly connection: Connection 
  ) {
    this.userRepo = this.connection.getCustomRepository(UsersRepository);

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

  async register(request: RegisterDto): Promise<UserRO> {
    return await this.userRepo.register(request);
  }

  async authenticateUser({email}: LoginDto) {
    return await this.userRepo.authenticate(email);
  }

}
