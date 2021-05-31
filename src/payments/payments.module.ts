import { HttpModule, Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';
import { ConfigModule } from '@nestjs/config';
import SendGridService from 'src/_common/sendgrid/sendgrid.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity]),
  HttpModule,
  ConfigModule,
  PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [PaymentsController],
  providers: [PaymentsService, UsersService, SendGridService]
})
export class PaymentsModule {}
