import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query, HttpException, HttpStatus, Put, Logger } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionRO } from './interfaces/transaction.interface';
import { Filter } from 'src/_utility/filter.util';
import { DeleteResult } from 'typeorm';
import { RejectionDto } from './dto/rejection.dto';
import { ResponseSuccess } from 'src/_common/response-success';
import { NewTermsDto } from './dto/new-terms.dto';


@ApiTags('Transaction')
@Controller('transaction')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @ApiOperation({summary: 'Create a new Descrow transaction'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 201, description: 'Transaction Successfully created' })
  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto, @Req() req: any): Promise<ResponseSuccess> {
    return await this.transactionsService.create(createTransactionDto, req);
  }

  
  @Post('on_woven_events')
  async onWovenEvents(@Body() payload: any, @Req() req: any): Promise<any> {
    Logger.log("woven-events", req);
    Logger.log("woven-events", payload);
    return await this.transactionsService.onWovenEvents(payload);
  }


  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiResponse({ status: 200, description: 'Return all transactions' })
  @Get()
  async findAll(@Query() filter: Filter): Promise<TransactionRO[]> {
    return await this.transactionsService.findAll(filter);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction' })
  @ApiResponse({ status: 200, description: 'Return a transaction' })
  async findOne(@Param('id') id: string) : Promise<TransactionRO> {
    return await this.transactionsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Put(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiResponse({ status: 200, description: 'Return transaction successfully updated' })
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto, @Req() req: any): Promise<ResponseSuccess> {
    return this.transactionsService.update(id, updateTransactionDto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Put('accept/:id')
  @ApiOperation({ summary: 'Accept an escrow transaction' })
  @ApiResponse({ status: 200, description: 'Return transaction successfully accepted' })
  accept(@Param('id') id: string, @Req() req: any): Promise<ResponseSuccess> {
    return this.transactionsService.accept(id, req);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Put('reject/:id')
  @ApiOperation({ summary: 'Reject an escrow transaction' })
  @ApiResponse({ status: 200, description: 'Return transaction successfully rejected' })
  reject(@Param('id') id: string,@Body() data: RejectionDto, @Req() req: any): Promise<ResponseSuccess> {
    return this.transactionsService.reject(id, data, req);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Put('new_terms/:id')
  @ApiOperation({ summary: 'Sends new terms for an escrow transaction' })
  @ApiResponse({ status: 200, description: 'Return transaction successfully updated' })
  newTerms(@Param('id') id: string, @Body() data: NewTermsDto, @Req() req: any): Promise<ResponseSuccess> {
    return this.transactionsService.newTerms(id, data, req);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @Delete(':id')
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiResponse({ status: 200, description: 'Transaction successfully deleted' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<DeleteResult> {
    const {isAdmin} = req.user;
    if(!isAdmin) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return await this.transactionsService.remove(id);
  }
}
