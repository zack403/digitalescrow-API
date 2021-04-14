import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEmail, Matches, MaxLength, MinLength } from 'class-validator';
export class UpdateUserDto  {

    @Expose()
    @IsEmail()
    @ApiProperty()
    @IsNotEmpty({message: 'Email is required'})
    email: string;
    
    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Name is required'})
    name: string;
    
    @Matches(/^[0-9]*$/, {message: "Account Number should be of type number"})
    @MinLength(10, {message: 'Account Number should be minimum 10 digits'})
    @MaxLength(10, {message: 'Account Number should be maximum 10 digits'})  
    @Expose()
    @ApiProperty()
    @IsNotEmpty({message: 'Account Number is required'})
    accountNumber: string;

    @IsString()
    @Matches(/^[0-9]*$/, {message: 'Phone Number should be of type number'})
    @ApiProperty()
    @IsNotEmpty({message: 'Phone Number is required'})
    phoneNumber: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Address is required'})
    address: string;

    @IsString()
    @ApiProperty()
    @IsOptional()
    @ApiPropertyOptional()
    profileImage: string;

    @IsDateString()
    @ApiProperty()
    @IsOptional()
    @ApiPropertyOptional()
    dateOfBirth: Date;

    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Gender is required'})
    gender: string;
}
