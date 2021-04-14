import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsObject, IsArray, IsEnum } from "class-validator";
import { TransactionType } from "src/enum/enum";
import { SellerInfo } from "../interfaces/seller-info.interface";

export class CreateTransactionDto {
    @Expose()
    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Name cannot be empty'})
    name: string;

    @Expose()
    @IsString()
    @ApiProperty()
    @IsOptional()
    @ApiPropertyOptional()
    description: string;

    @Expose()
    @IsNumber()
    @ApiProperty()
    @ApiPropertyOptional()
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
    @IsNotEmpty()
    sellerInfo: SellerInfo;

    @Expose()
    @ApiPropertyOptional()
    @IsArray()
    images: string[];

    @Expose()
    @ApiPropertyOptional()
    @IsArray()
    conditions: string[];
    
    @Expose()
    @IsNotEmpty()
    @IsEnum(TransactionType)
    type: TransactionType

}
