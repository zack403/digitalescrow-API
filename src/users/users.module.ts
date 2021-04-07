import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { EmailVerificationEntity } from 'src/auth/entities/email-verification.entity';
import { PasswordResetEntity } from 'src/auth/entities/password-reset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, EmailVerificationEntity, PasswordResetEntity])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService]
})
export class UsersModule {}
