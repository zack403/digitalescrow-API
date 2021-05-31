import { Module } from '@nestjs/common';
import { TransactionRepository } from 'src/transactions/transaction.repository';
import { PayOutService } from './pay-out.service';


@Module({
  providers: [PayOutService, TransactionRepository],
})
export class PayOutModule {}