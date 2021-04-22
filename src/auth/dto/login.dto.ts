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
    password: string;
}
