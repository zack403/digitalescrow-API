import { CacheInterceptor, CacheModule, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransactionsModule } from './transactions/transactions.module';
import { SendgridModule } from './_common/sendgrid/sendgrid.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 10
    }),
    ConfigModule.forRoot(), 
    DatabaseModule, 
    AuthModule, 
    UsersModule, TransactionsModule, SendgridModule, PaymentsModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    AppService],
})
export class AppModule{}
