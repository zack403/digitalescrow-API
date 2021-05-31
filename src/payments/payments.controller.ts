import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query, HttpException, HttpStatus, Put, } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Filter } from 'src/_utility/filter.util';
import { DeleteResult } from 'typeorm';
import { ResponseSuccess } from 'src/_common/response-success';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentRO } from './interfaces/payment.interface';
import { UpdatePaymentDto } from './dto/update-payment.dto';



@ApiTags('Payment')
@ApiBearerAuth()
@UseGuards(AuthGuard())
@Controller('payment')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @ApiOperation({summary: 'Create a new payment transaction'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 201, description: 'Payment Successfully created' })
  @Post()
  async create(@Body() payload: CreatePaymentDto, @Req() req: any): Promise<ResponseSuccess> {
    return await this.paymentService.create(payload, req);
  }

  @ApiOperation({summary: 'Request payment for an escrow transaction'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 201, description: 'Payment Successfully requested' })
  @Post('request-payment/:transactionId')
  async requestPayment(@Param('transactionId') transactionId: string, @Req() req: any): Promise<ResponseSuccess> {
    return await this.paymentService.requestPayment(transactionId, req);
  }

  @ApiOperation({summary: 'Request payment for an escrow transaction'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 201, description: 'Payment Successfully requested' })
  @Post('trigger-payment/:transactionId')
  async triggerPayment(@Param('transactionId') transactionId: string, @Req() req: any): Promise<ResponseSuccess> {
    return await this.paymentService.triggerPayment(transactionId, req.headers.origin);
  }

  @ApiOperation({summary: 'Release payment for an escrow transaction'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 201, description: 'Payment Successfully requested' })
  @Post('release-payment/:transactionId')
  async releasePayment(@Param('transactionId') transactionId: string, @Req() req: any): Promise<ResponseSuccess> {
    return await this.paymentService.releasePayment(transactionId, req);
  }

  // @ApiOperation({summary: 'Refuse payment for an escrow transaction'})
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // @ApiResponse({ status: 201, description: 'Payment Successfully refused' })
  // @Post('refuse-payment/:transactionId')
  // async refusePayment(@Param('transactionId') transactionId: string, @Req() req: any): Promise<ResponseSuccess> {
  //   return await this.paymentService.refusePayment(transactionId, req);
  // }

  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Return all payments' })
  @Get()
  async findAll(@Query() filter: Filter): Promise<PaymentRO[]> {
    return await this.paymentService.findAll(filter);
  }

  @Get('banks')
  @ApiOperation({ summary: 'Get all banks' })
  @ApiResponse({ status: 200, description: 'Return all banks' })
  async GetBanks(): Promise<any> {
    return await this.paymentService.GetBanks();
  }

  @Post('nuban/enquiry')
  @ApiOperation({ summary: 'Verify a nuban' })
  @ApiResponse({ status: 200, description: 'Return verified' })
  async VerifyNuban(@Body() payload: any,): Promise<any> {
    return await this.paymentService.VerifyNuban(payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment' })
  @ApiResponse({ status: 200, description: 'Return a payment' })
  async findOne(@Param('id') id: string) : Promise<PaymentRO> {
    return await this.paymentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiResponse({ status: 200, description: 'Return payment successfully updated' })
  update(@Param('id') id: string, @Body() payload: UpdatePaymentDto, @Req() req: any): Promise<ResponseSuccess> {
    return this.paymentService.update(id, payload, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment' })
  @ApiResponse({ status: 200, description: 'Payment successfully deleted' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<DeleteResult> {
    const {isAdmin} = req.user;
    if(!isAdmin) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return await this.paymentService.remove(id);
  }
}
