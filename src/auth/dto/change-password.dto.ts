import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength, Matches } from "class-validator";
import { MustMatch } from "../decorators/match.decorator";

export class ChangePasswordDto {
    
    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Old Password is required'}) 
    oldPassword: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'New Password is required'}) 
    @MinLength(8, {message: 'New Password should be minimum 8 character long'})
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'New Password too weak. Should contain uppercase letter, special character and alphanumeric characters' })
    newPassword: string;

    @IsString()
    @ApiProperty()
    @MustMatch('newPassword') 
    @IsNotEmpty({message: 'Confirm New Password is required'}) 
    @MinLength(8, {message: 'Confirm New Password should be minimum 8 character long'})
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Confirm New Password too weak. Should contain uppercase letter, special character and alphanumeric characters' })
    confirmNewPassword: string;
}
