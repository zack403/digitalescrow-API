import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsNotEmpty, IsEmail, Matches, MinLength, IsEnum, IsString, IsOptional, IsDateString } from "class-validator";

export class RegisterDto {
    
    @Expose()
    @IsEmail()
    @ApiProperty()
    @IsNotEmpty({message: 'Email is required'})
    email: string;

    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak' })
    @IsNotEmpty({message: 'Password is required'}) 
    @MinLength(8) 
    @ApiProperty() 
    password: string;

    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak' })
    @IsNotEmpty({message: 'Password is required'}) 
    @MinLength(8) 
    @ApiProperty() 
    confirmPassword: string;

    @Expose()
    @ApiProperty()
    @IsNotEmpty({message: 'Account Number is required'})
    accountNumber: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Name is required'})
    name: string;

    @IsString()
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
    avatar: string;

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
