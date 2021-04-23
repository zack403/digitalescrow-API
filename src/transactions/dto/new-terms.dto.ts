import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsOptional, IsArray, IsNotEmpty } from "class-validator";

export class NewTermsDto {
    @Expose()
    @IsString()
    @ApiProperty()
    @IsOptional()
    @ApiPropertyOptional()
    message: string;

    @Expose()
    @IsArray()
    @ApiProperty()
    @IsNotEmpty()
    conditions: string[];
}