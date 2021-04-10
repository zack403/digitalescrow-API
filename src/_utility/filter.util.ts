import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsNumberString, IsOptional, IsString } from "class-validator";

export class Filter {

    @ApiProperty()
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    search: string;

    @ApiProperty({default: 1})
    @IsString()
    page: number;
}