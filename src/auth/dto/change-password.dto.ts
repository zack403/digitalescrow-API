import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MinLength, Matches } from "class-validator";

export class ChangePasswordDto {
    
    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Old Password is required'}) 
    @MinLength(8)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Old Password too weak' })
    oldPassword: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'New Password is required'}) 
    @MinLength(8)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'New Password too weak' })
    newPassword: string;

    @IsString()
    @ApiProperty()
    @IsNotEmpty({message: 'Confrim New Password is required'}) 
    @MinLength(8)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Confirm Password too weak' })
    confirmNewPassword: string;
}
