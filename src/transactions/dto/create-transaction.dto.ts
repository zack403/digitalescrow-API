import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsObject, IsArray, IsEnum, Matches } from "class-validator";
import { TransactionType } from "src/enum/enum";
import { CounterPartyInfo } from "../interfaces/counter-party-info.interface";

export class CreateTransactionDto {
    @Expose()
    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Name cannot be empty'})
    commodityName: string;

    @Expose()
    @IsString()
    @ApiProperty()
    @IsOptional()
    @ApiPropertyOptional()
    description: string;

    @IsString()
    @Matches(/^[0-9]*$/, {message: 'Phone Number should be of type number'})
    @ApiProperty()
    @IsNotEmpty({message: 'Phone Number is required'})
    phoneNumber: string;

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
    @IsDateString()
    @ApiProperty()
    @IsNotEmpty({message: 'Expiry Date cannot be empty'})
    expiryDate: Date;

    @Expose()
    @IsObject()
    @IsNotEmpty({message: 'Counter Party Info cannot be empty'})
    counterPartyInfo: CounterPartyInfo;

    // @Expose()
    // @ApiPropertyOptional()
    // @IsArray()
    // images: string[];

    @Expose()
    @ApiPropertyOptional()
    @IsArray()
    conditions: string[];
    
    @Expose()
    @IsNotEmpty()
    @IsEnum(TransactionType)
    type: TransactionType

}
