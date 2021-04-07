import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRO } from './interfaces/user.interface';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @UseInterceptors(ClassSerializerInterceptor)
  // @Get()
  // @ApiOperation({ summary: 'Get all users' })
  // @ApiResponse({ status: 200, description: 'Return all users' })
  // async findAll(@Query() filterDto: FilterDto,  @Req() req: any ) : Promise<UserRO[]>{
  //   return await this.usersService.findAll(filterDto, req.user);
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get a meeting' })
  // @ApiResponse({ status: 200, description: 'Return a meeting' })
  // async findOne(@Param('id') id: string) : Promise<ScheduleMeetingsRO> {
  //   return await this.scheduleMeetingsService.findOne(id);
  // }

  // @Put(':id')
  // @ApiOperation({ summary: 'Update a meeting' })
  // @ApiResponse({ status: 200, description: 'Return meeting successfully updated' })
  // async update(@Param('id') id: string, @Body() updateScheduleMeetingDto: UpdateScheduleMeetingDto, @Req() req: any): Promise<string> {
  //   return await this.scheduleMeetingsService.update(id, updateScheduleMeetingDto, req);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a meeting' })
  // @ApiResponse({ status: 200, description: 'Meeting successfully deleted' })
  // async remove(@Param('id') id: string) {
  //   return await this.scheduleMeetingsService.remove(id);
  // }
}
