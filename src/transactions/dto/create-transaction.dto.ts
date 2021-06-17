import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsObject, IsArray, IsEnum, Matches, MinLength, MaxLength, Min } from "class-validator";
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
    @MinLength(11, {message: 'Phone Number should be minimum 11 digits'})
    @MaxLength(11, {message: 'Phone Number should be maximum 11 digits'}) 
    @ApiProperty()
    @IsNotEmpty({message: 'Phone Number is required'})
    phoneNumber: string;

    @Expose()
    @IsNumber()
    @ApiProperty()
    @Min(1)
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
    @ApiProperty()
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
    @ApiProperty({enum: TransactionType, description: "Value can either be 'buying' or 'selling'"})
    @IsEnum(TransactionType)
    type: TransactionType

}
