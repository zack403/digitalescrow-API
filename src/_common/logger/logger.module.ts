import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import  LoggerService from './logger.service';

@Module({
    imports: [ConfigModule],
  providers: [LoggerService]
})
export class LoggerModule {}