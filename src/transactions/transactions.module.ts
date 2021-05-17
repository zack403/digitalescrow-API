import {  HttpModule, Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionEntity } from './entities/transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import SendGridService from 'src/_common/sendgrid/sendgrid.service';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { PaymentsService } from 'src/payments/payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity]),
  HttpModule,
  PassportModule.register({ defaultStrategy: 'jwt' }), ConfigModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, SendGridService, PaymentsService, UsersService]
})
export class TransactionsModule {}
