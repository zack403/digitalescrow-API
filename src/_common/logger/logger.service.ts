import {Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';


@Injectable()
export default class LoggerService {
  constructor(private readonly configService: ConfigService) {
  }

  Logger() {
    const logger = new (winston as any).createLogger({
        format: winston.format.json(),
        transports: [
            new (winston.transports.Console as any)({
                timestamp: true,
                colorize: true,
            })
       ]
    });

    if (this.configService.get('NODE_ENV') === 'production') {
      const cloudwatchConfig = {
          logGroupName: this.configService.get('CLOUDWATCH_GROUP_NAME'),
          logStreamName: `${this.configService.get('CLOUDWATCH_GROUP_NAME')}-${this.configService.get('NODE_ENV')}`,
          awsAccessKeyId: this.configService.get('CLOUDWATCH_ACCESS_KEY'),
          awsSecretKey:  this.configService.get('CLOUDWATCH_SECRET_ACCESS_KEY'),
          awsRegion: this.configService.get('CLOUDWATCH_REGION'),
          messageFormatter: ({ level, message, additionalInfo }: any) =>    `[${level}] : ${message} \nAdditional Info: ${JSON.stringify(additionalInfo)}}`
      }
          logger.add(new WinstonCloudWatch(cloudwatchConfig))
      }
  }

  

  
}
