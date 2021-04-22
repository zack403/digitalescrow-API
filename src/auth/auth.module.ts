import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { UsersRepository } from 'src/users/users.repository';
import { EmailVerificationRepository } from './repositories/email-verification.repository';
import { UsersService } from 'src/users/users.service';
import SendGridService from 'src/_common/sendgrid/sendgrid.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, SendGridService, JwtStrategy, UsersService, UsersRepository, EmailVerificationRepository],
  exports: [ AuthService]
})
export class AuthModule {}
