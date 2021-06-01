
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression  } from '@nestjs/schedule';
import { Connection } from 'typeorm';
import { TransactionRepository } from 'src/transactions/transaction.repository';
import { TransactionStatus, TransactionType } from 'src/enum/enum';


@Injectable()
export class CancelTransactionService {
    
    private readonly logger = new Logger(CancelTransactionService.name);
    private  transRepo: TransactionRepository;


    constructor(private readonly connection: Connection) {
      this.transRepo = this.connection.getCustomRepository(TransactionRepository);
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCancelTransaction() {
      this.logger.log("Background service started");
      
      const currentDate = new Date();

      const transactionsToCancel = await this.transRepo.createQueryBuilder('t')
                          .select('*')
                          .where(`DATE_TRUNC('day', "paymentGracePeriodDate") < :date`, {date: `${currentDate.toISOString().split("T")[0]}`})
                          .andWhere('t.escrowBankDetails ::jsonb @> :escrowBankDetails', {
                            escrowBankDetails: {
                              hasMoney: false
                            }})
                            .andWhere("t.status <> :status", { status: TransactionStatus.CANCELLED})
                            .getRawMany();

      if(transactionsToCancel.length > 0) {
        for (const p of transactionsToCancel) {
            p.status = TransactionStatus.CANCELLED;
            await this.transRepo.save(p);
        } 
      }
    }
}