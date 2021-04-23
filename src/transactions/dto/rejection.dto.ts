import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsOptional, IsNumber, IsNotEmpty, IsDateString, IsArray } from "class-validator";


export class RejectionDto {
  
    @Expose()
    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    reason: string;
    
}