
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

export const logger = new (winston as any).createLogger({
    format: winston.format.json(),
    transports: [
        new (winston.transports.Console as any)({
            timestamp: true,
            colorize: true,
        })
   ]
});

if (process.env.NODE_ENV === 'production') {
    const cloudwatchConfig = {
        logGroupName: process.env.CLOUDWATCH_GROUP_NAME,
        logStreamName: `${process.env.CLOUDWATCH_GROUP_NAME}-${process.env.NODE_ENV}`,
        awsAccessKeyId: process.env.CLOUDWATCH_ACCESS_KEY,
        awsSecretKey: process.env.CLOUDWATCH_SECRET_ACCESS_KEY,
        awsRegion: process.env.CLOUDWATCH_REGION,
        messageFormatter: ({ level, message, additionalInfo }: any) =>    `[${level}] : ${message} \nAdditional Info: ${JSON.stringify(additionalInfo)}}`
    }
        logger.add(new WinstonCloudWatch(cloudwatchConfig))
}
