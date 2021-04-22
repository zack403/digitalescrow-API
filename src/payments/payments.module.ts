import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity]),
  PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [PaymentsController],
  providers: [PaymentsService, UsersService]
})
export class PaymentsModule {}
