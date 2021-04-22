import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsArray, IsEnum } from "class-validator";

export class CreatePaymentDto {

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
