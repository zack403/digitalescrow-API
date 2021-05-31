import {  HttpModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsModule } from 'src/payments/payments.module';
import { PaymentsService } from 'src/payments/payments.service';
import { TransactionRepository } from 'src/transactions/transaction.repository';
import { UsersService } from 'src/users/users.service';
import SendGridService from 'src/_common/sendgrid/sendgrid.service';
import { PayOutService } from './pay-out.service';


@Module({
    imports: [HttpModule],
  providers: [PayOutService, UsersService, ConfigService, SendGridService, PaymentsService, TransactionRepository],
})
export class PayOutModule {}