import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength, Matches } from "class-validator";

export class ResetPasswordDto {
    
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    resetToken: string

    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Password is required'}) 
    @MinLength(8)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak' })
    password: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Confirm Password is required'}) 
    @MinLength(8)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Confirm Password too weak' })
    confirmPassword: string;
}
