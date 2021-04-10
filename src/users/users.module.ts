import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { EmailVerificationEntity } from 'src/auth/entities/email-verification.entity';
import { PasswordResetEntity } from 'src/auth/entities/password-reset.entity';
import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, EmailVerificationEntity, PasswordResetEntity]),
  PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService]
})export class UsersModule {}
