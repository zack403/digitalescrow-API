import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsArray, IsEnum, IsBoolean } from "class-validator";
import { PaymentStatus } from "src/enum/enum";

export class CreatePaymentDto {

    @Expose()
    @IsNumber()
    @ApiProperty()
    @IsNotEmpty({message: 'Amount cannot be empty'})
    amountSent: number;

    @Expose()
    @IsNumber()
    @ApiProperty()
    @IsNotEmpty({message: 'Amount cannot be empty'})
    amountRecieved: number;

    status: PaymentStatus;

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

    @Expose()
    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Transaction Id cannot be empty'})
    transactionId: string;

    
    @Expose()
    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'User Id cannot be empty'})
    userId: string;

}
