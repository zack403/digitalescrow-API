import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { Matches, MinLength, MaxLength, IsNotEmpty } from "class-validator";

export class UserBankDetails {
    
    bankName: string;
    accountName: string;
    bankCode: string;

    @Matches(/^[0-9]*$/, {message: "Account Number should be of type number"})
    @MinLength(10, {message: 'Account Number should be minimum 10 digits'})
    @MaxLength(10, {message: 'Account Number should be maximum 10 digits'})  
    @Expose()
    @ApiProperty()
    @IsNotEmpty({message: 'Account Number is required'})
    accountNumber: string;
}