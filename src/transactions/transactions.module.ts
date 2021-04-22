import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionEntity } from './entities/transaction.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import SendGridService from 'src/_common/sendgrid/sendgrid.service';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity]),
  PassportModule.register({ defaultStrategy: 'jwt' }), ConfigModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, SendGridService, UsersService]
})
export class TransactionsModule {}
