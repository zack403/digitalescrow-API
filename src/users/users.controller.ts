import { Controller, Get, Body, Param, Delete, Put, Query, Req, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRO } from './interfaces/user.interface';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Filter } from 'src/_utility/filter.util';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(AuthGuard())
@Controller('user')
export class UsersController {
  
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  async findAll(@Query() filter: Filter) : Promise<UserRO[]>{
    return await this.usersService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user' })
  @ApiResponse({ status: 200, description: 'Return a user' })
  async findOne(@Param('id') id: string) : Promise<UserRO> {
    return await this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'Return user successfully updated' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any): Promise<string> {
    return await this.usersService.update(id, updateUserDto, req);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const {isAdmin} = req.user;
    if(!isAdmin) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN)
    }
    return await this.usersService.remove(id);
  }
}
