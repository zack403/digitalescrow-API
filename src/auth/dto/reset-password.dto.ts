import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength, Matches } from "class-validator";
import { MustMatch } from "../decorators/match.decorator";

export class ResetPasswordDto {
    
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    resetToken: string

    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Password is required'}) 
    @MinLength(8, {message: 'Password should be minimum 8 character long'})
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak. Should contain uppercase letter, special character and alphanumeric characters' })
    password: string;

    @IsString()
    @ApiProperty()
    @MustMatch('password') 
    @IsNotEmpty({message: 'Confirm Password is required'}) 
    @MinLength(8, {message: 'Confirm Password should be minimum 8 character long'})
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Confirm Password too weak. Should contain uppercase letter, special character and alphanumeric characters' })
    confirmPassword: string;
}
