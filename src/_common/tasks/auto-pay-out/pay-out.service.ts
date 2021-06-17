
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression  } from '@nestjs/schedule';
import { Connection } from 'typeorm';
import { TransactionRepository } from 'src/transactions/transaction.repository';
import { PaymentsService } from 'src/payments/payments.service';
import { TransactionType } from 'src/enum/enum';
import { UsersService } from 'src/users/users.service';


@Injectable()
export class PayOutService {
    
    private readonly logger = new Logger(PayOutService.name);
    private  transRepo: TransactionRepository;


    constructor(
        private readonly connection: Connection, 
        private paymentSvc: PaymentsService,
        private userSvc: UsersService) {
      this.transRepo = this.connection.getCustomRepository(TransactionRepository);
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handlePayOut() {
      this.logger.log("Background service started");

      const currentDate = new Date();

      const payOuts = await this.transRepo.createQueryBuilder('t')
                          .where(`DATE_TRUNC('day', "expiryGracePeriodDate") < :date`, {date: `${currentDate.toISOString().split("T")[0]}`})
                          .andWhere('t.escrowBankDetails ::jsonb @> :escrowBankDetails', {
                            escrowBankDetails: {
                                payoutComplete: false
                            }})
                          .getRawMany();

      if(payOuts.length > 0) {
        for (const p of payOuts) {
            let userPayingTo;
            if(p.type === TransactionType.BUY) {
                userPayingTo = await this.userSvc.findUserByEmail(p.counterPartyInfo.email);
            } else {
                userPayingTo = await this.userSvc.findOne(p.userId);
            }
           const result =  await this.paymentSvc.initiatePayout(p, userPayingTo);
           return result;
        } 
      }
    }
}