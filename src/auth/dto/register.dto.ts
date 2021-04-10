import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsNotEmpty, IsEmail, Matches, MinLength, IsEnum, IsString, IsOptional, IsDateString, MaxLength } from "class-validator";
import { MustMatch } from "../decorators/match.decorator";

export class RegisterDto {
    
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
    @IsNotEmpty({message: 'Account Type is required'})
    accountType: string;

    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak. Should contain uppercase letter, one special character and alphanumeric characters' })
    @IsNotEmpty({message: 'Password is required'}) 
    @MinLength(8, {message: 'Password should be minimum 8 characters long'}) 
    @ApiProperty() 
    password: string;

    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Confirm Password too weak. Should contain uppercase letter, special character and alphanumeric characters' })
    @IsNotEmpty({message: 'Confirm Password is required'})
    @MustMatch('password') 
    @MinLength(8, {message: 'Confirm Password should be minimum 8 characters long'})  
    @ApiProperty() 
    confirmPassword: string;
        
}
