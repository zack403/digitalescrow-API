import { Module } from '@nestjs/common';
import { TransactionRepository } from 'src/transactions/transaction.repository';
import { CancelTransactionService } from './cancel-transaction.service';

@Module({
  providers: [CancelTransactionService, TransactionRepository],
})
export class CancelTransactionModule {}