import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from "@sendgrid/mail";
import { SendgridData } from './sendgrid.interface';

@Injectable()
export default class SendGridService {
  constructor(private readonly configService: ConfigService) {
    SendGrid.setApiKey(this.configService.get('SENDGRID_API_KEY'));
  }

  async sendMailAsync(payload: SendgridData): Promise<boolean> {
    try {
        const sent = await SendGrid.send(payload);
        if(sent) {
          return true;
        }
    } catch (error) {
      const sendErr = [];
      for (const err of error.response.body.errors) {
        sendErr.push(err.message);
      }
      Logger.error(`SendGridService.sendMailAsync: ${sendErr}`);
      throw new HttpException(`An error occurred while trying to send email, try again. ${sendErr}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
