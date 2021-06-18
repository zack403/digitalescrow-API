import { Controller, Get, Post, Body, Param, Req, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginRO } from 'src/users/interfaces/login-ro.interface';
import { ResponseSuccess } from 'src/_common/response-success';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  
  @Post('/register')
  @ApiOperation({summary: 'Create a new Descrow user'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 201, description: 'User Successfully created' })
  async register(@Body() registrationDto: RegisterDto, @Req() req: any): Promise<ResponseSuccess> {
    if(await this.authService.register(registrationDto, req)) {
      return {
        status: HttpStatus.CREATED,
        data: "User successfully created"
      };
    }
  }


  @Post('/login')
  @ApiOperation({summary: 'Authenticate a Descrow user and sends back a token for subsequent request'})
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 200, description: 'Return user payload' })
  async logIn(@Body() loginDto: LoginDto): Promise<LoginRO> {
    return await this.authService.login(loginDto);
  }

  @Get('/verify-email/:token')
  @ApiParam({name: 'token', required: true})
  @ApiOperation({summary: 'Verifies a Descrow user email by token'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmail(@Param() params: any): Promise<ResponseSuccess> {
    const msg = await this.authService.verifyEmail(params.token)
    if (msg) {
      return {
        status: HttpStatus.OK,
        data: msg
      };
    }
  }

  @Get('/resend-verification/:email')
  @ApiOperation({summary: 'Resends an email verification to a Descrow user email with a token'})
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiParam({name: 'email', required: true})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiResponse({ status: 200, description: 'Email Verification sent' })
  public async sendEmailVerification(@Param() params: any, @Req() req: any): Promise<ResponseSuccess> {
      const data = await this.authService.createEmailToken(params.email);
      if(data) {
        const isEmailSent = await this.authService.sendVerificationEmail(params.email, data.emailToken, req.headers.origin );
        if(isEmailSent){
          return {
            status: HttpStatus.OK,
            data: 'Verification email has been sent, kindly check your inbox'
          } 
        } 
      }
      
      return {
        status: HttpStatus.NOT_FOUND,
        data: 'Email does not exist with us'
      } 


  }

  @Get('/forgot-password/:email')
  @ApiParam({name: 'email', required: true})
  @ApiOperation({summary: 'Sends an instructions on how to reset password to the email provided if the account exist'})
  @ApiResponse({ status: 200, description: 'Forgot password email sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public async sendEmailForgotPassword(@Param() params: any, @Req() req: any): Promise<ResponseSuccess> {
    return await this.authService.sendEmailForgotPassword(params.email, req.headers.origin);
  }

  @Get('/valid-password-token/:token')
  @ApiParam({name: 'token', required: true})
  @ApiOperation({summary: 'Verifies the password token send to a descrow user email'})
  async validPasswordToken(@Param() params: any): Promise<ResponseSuccess> {
    if(!params.token) {
      throw new HttpException('Password Reset token is required', HttpStatus.BAD_REQUEST);
    }
    return await this.authService.isValidPasswordToken(params.token);
  }

  @Post('/reset-password')
  @ApiOperation({summary: 'Reset a Descrow user password'})
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiResponse({ status: 200, description: 'Password Reset successful' })
  public async setNewPassord(@Body() resetDto: ResetPasswordDto): Promise<ResponseSuccess> {
    return await this.authService.setNewPassord(resetDto);
  }

  @Post('/change-password')
  @ApiBearerAuth()
  @UseGuards(AuthGuard())
  @ApiOperation({summary: 'To change a Descrow user password'})
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiResponse({ status: 200, description: 'Change Password successful' })
  public async changePassord(@Body() changeDto: ChangePasswordDto, @Req() req: any): Promise<ResponseSuccess> {
    return await this.authService.changedPassword(changeDto, req.user.id);
  }


  // @UseGuards(JwtAuthenticationGuard)
  // @Post('log-out')
  // @HttpCode(200)
  // async logOut(@Req() request: RequestWithUser) {
  //   await this.usersService.removeRefreshToken(request.user.id);
  //   request.res.setHeader('Set-Cookie', this.authenticationService.getCookiesForLogOut());
  // }

  // @UseGuards(JwtAuthenticationGuard)
  // @Get()
  // authenticate(@Req() request: RequestWithUser) {
  //   return request.user;
  // }

  // @UseGuards(JwtRefreshGuard)
  // @Get('refresh')
  // refresh(@Req() request: RequestWithUser) {
  //   const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(request.user.id);

  //   request.res.setHeader('Set-Cookie', accessTokenCookie);
  //   return request.user;
  // }
}
