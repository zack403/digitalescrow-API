import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsNotEmpty, MinLength, Matches } from "class-validator";

export class LoginDto {
    
    @IsEmail()
    @ApiProperty()
    @IsNotEmpty({message: 'Email is required'})
    email: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Password is required'}) 
    @MinLength(8, {message: 'Password should be minimum 8 character long'})
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak. Should contain uppercase letter, special character and alphanumeric characters' })
    password: string;
}
