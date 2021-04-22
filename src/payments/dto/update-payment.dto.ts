import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsNotEmpty, IsDateString, IsString } from 'class-validator';

export class UpdatePaymentDto {
    @Expose()
    @IsNumber()
    @ApiProperty()
    @IsNotEmpty({message: 'Amount cannot be empty'})
    amount: number;

    @Expose()
    @IsDateString()
    @ApiProperty()
    @IsNotEmpty({message: 'Payment Date cannot be empty'})
    paymentDate: Date;

    @Expose()
    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Virtual account number cannot be empty'})
    virtualAccountNumber: string;

}
