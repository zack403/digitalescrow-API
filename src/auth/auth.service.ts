import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { UserEntity } from 'src/users/entities/user.entity';
import { LoginRO } from 'src/users/interfaces/login-ro.interface';
import { JwtPayload } from './interfaces/jwt.interface';
import { JwtService } from '@nestjs/jwt';
import { EmailVerificationRepository } from './repositories/email-verification.repository';
import { UsersRepository } from 'src/users/users.repository';
import { EmailVerification } from './interfaces/email-verification.interface';
import * as SendGrid from "@sendgrid/mail";
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Connection, Not } from 'typeorm';
import { PasswordResetRepository } from './repositories/password-reset.repository';
import { PasswordReset } from './interfaces/password-reset.interface';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResponseSuccess } from 'src/_common/response-success';


@Injectable()
export class AuthService {

  private emailVerificationRepo: EmailVerificationRepository;
  private userRepo: UsersRepository;
  private passwordResetRepo: PasswordResetRepository;



  constructor(
    private readonly connection: Connection,
    private readonly userSvc: UsersService, 
    private jwtService: JwtService,
    private readonly configService: ConfigService) {
      this.emailVerificationRepo = this.connection.getCustomRepository(EmailVerificationRepository);
      this.userRepo = this.connection.getCustomRepository(UsersRepository);
      this.passwordResetRepo = this.connection.getCustomRepository(PasswordResetRepository);
      SendGrid.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    }

  async register(request: RegisterDto, req: Request): Promise<boolean> {
      
    const isExist = await this.userSvc.findByEmail(request.email);
    if(isExist) {
         throw new HttpException(`An account with email ${request.email} already exists`, HttpStatus.BAD_REQUEST)
    }
    
    const hashedPassword = await this.hashPassword(request.password);

    const newUser = plainToClass(UserEntity, request);
    newUser.createdBy = request.name;
    newUser.password = hashedPassword;
    newUser.confirmPassword = hashedPassword;

    try {
      const saved = await this.userSvc.register(newUser);
      if(saved) {
        const emailTokenCreated = await this.createEmailToken(saved.email);
        if(emailTokenCreated) {
          if (await this.sendVerificationEmail(saved.email, emailTokenCreated.emailToken, req.headers.origin, true)) return true;
        }
      } 
    } catch (error) {
      throw new HttpException(`Error while creating user - Error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async login(request: LoginDto): Promise<LoginRO> {
     const user = await this.userSvc.authenticateUser(request);
     if(!user) {
        throw new HttpException('Login Failed, invalid email or password.', HttpStatus.BAD_REQUEST)
     }
     
     const isPasswordMatching = await this.verifyPassword(request.password, user.password);
     
     if(!isPasswordMatching) {
      throw new HttpException('Login Failed, invalid email or password.', HttpStatus.BAD_REQUEST);
     }

     //generate auth token
     const {id: userId, email, name, isAdmin, emailVerified} = user;
     const payload: JwtPayload = { userId, email, name, isAdmin };
     const token = await this.jwtService.sign(payload, {
       secret: this.configService.get('JWT_SECRETKEY'),
       expiresIn: this.configService.get('JWT_EXPIRESIN')
     });

     return {
        id: userId,
        name,
        email,
        isAdmin,
        token,
        emailVerified
     }
  }

  protected async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  private async verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    
    const isPasswordMatching = await bcrypt.compare(plainTextPassword, hashedPassword);
    
    if (!isPasswordMatching) {
      return false;
    }
    return true;
  }

  async createEmailToken(email: string): Promise<EmailVerification> {
      const user = await this.userRepo.findOne({where: {email}})
      if(!user) {
        return null;
      }
      const emailVerification = await this.emailVerificationRepo.findOne({userId: user.id}); 
      if (emailVerification ){
        emailVerification.emailToken = (Math.floor(Math.random() * (9000000)) + 1000000).toString()
        return await this.emailVerificationRepo.save(emailVerification);
        
      } else {
        
        const payload : EmailVerification = {
          userId: user.id,
          emailToken: (Math.floor(Math.random() * (9000000)) + 1000000).toString(),
          createdBy: email
        }
    
        return await this.emailVerificationRepo.save(payload);
        
    }

    
  }

  public async sendVerificationEmail(email: string, token: string, host: string, shouldSend?: boolean): Promise<boolean> {
    const messages = [];
    const user = await this.userRepo.findOne({where: {email}});
    if (user) {
      
          const msg1 = {
            to: email,
            from: '"Digital Escrow" <zack.aminu@netopconsult.com>',
            templateId: this.configService.get('SENDGRID_EMAIL_VERIFY_TEMPLATE_ID'),
            dynamicTemplateData: {
              name: user.name,
              link: host +'/api/v1/auth/email/verify/'+ token
            },
          };

          messages.push(msg1);

          if(shouldSend) {
              const msg2 = {
                to: email,
                from: '"Digital Escrow" <zack.aminu@netopconsult.com>',
                templateId: this.configService.get('SENDGRID_EMAIL_WELCOME_TEMPLATE_ID'),
                dynamicTemplateData: {
                  name: user.name
                },
              };
    
              messages.push(msg2);
          }

        try {
            const sent = await SendGrid.send(messages);
            if(sent) {
              return true;
            }
        } catch (error) {
           throw new HttpException(`An error occurred while trying to resend verification email, try again. ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
    } else {
      throw new HttpException('This email do not have an account with us', HttpStatus.NOT_FOUND);
    }
  }

  public async verifyEmail(token: string): Promise<string> {
    
      const result = await this.emailVerificationRepo.findOne({ where: { emailToken: token } });
      if (result && result.userId) {
        try {
            const user = await this.userRepo.findOne({where: {id: result.userId}});
            if(!user) throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
            if(user.emailVerified) throw new HttpException('Email already verified', HttpStatus.BAD_REQUEST);
            user.emailVerified = true;
            user.updatedAt = new Date();
            user.updatedBy = user.email;
            await user.save();
            await this.emailVerificationRepo.delete({id: result.id});
            return "Email verified successfully";
        } catch (error) {
            throw new HttpException(`An error occurred while trying to verify email - Error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
      } else {
        throw new HttpException(`An error occurred while trying to verify email - Error: invalid token`, HttpStatus.BAD_REQUEST);
      }
  }
  
  async createForgottenPasswordToken(userId: string): Promise<PasswordReset> {
    
      const resetToken = await this.jwtService.sign({userId}, {
        secret: this.configService.get('JWT_SECRETKEY'),
        expiresIn: this.configService.get('JWT_EXPIRESIN')
      }) 

      const forgottenPasswordPayload: PasswordReset = {
        userId,
        resetToken,
        createdBy: ''
      }
      const forgottenPasswordModel = await this.passwordResetRepo.save(forgottenPasswordPayload);
      if(forgottenPasswordModel){
        
        // delete all previous user request reset password data
        await this.passwordResetRepo.delete({userId, resetToken: Not(forgottenPasswordModel.resetToken) });
        return forgottenPasswordModel;
      } else {
        throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    
  }

  public async sendEmailForgotPassword(email: string, host: string): Promise<ResponseSuccess> {
    const user = await this.userRepo.findOne({ where: { email: email } });
    if (!user) {
      throw new HttpException(`${email} does not exists`, HttpStatus.NOT_FOUND);
    }

    const tokenModel = await this.createForgottenPasswordToken(user.id);

    if(tokenModel && tokenModel.resetToken) {
      const mailOptions = {
        to: user.email,
        from: '"Digital Escrow" <zack.aminu@netopconsult.com>',
        subject: 'Digital Escrow Account Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        host +'/reset-password/' + tokenModel.resetToken + '\n\n' +
        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        }
     
        try {
            const sent = await SendGrid.send(mailOptions);
            if(sent) {
              return {
                status: HttpStatus.OK,
                data: "An instruction has been sent to your email, kindly check your inbox and click on the link to reset your password"
              }
            }
        } catch (error) {
            return error.message;
        }
    }
  }

  async isValidPasswordToken(token: string): Promise<ResponseSuccess> {
    const user = await this.passwordResetRepo.findOne({where: {resetToken:token}});
    if (!user) {
      throw new HttpException('Invalid token or token expired', HttpStatus.BAD_REQUEST);
    }

    //check if token has expired
    try {
      this.jwtService.verify(token, {secret: this.configService.get('JWT_SECRETKEY')});
   } catch (ex) {
     throw new HttpException('Token expired or is no longer valid! Kindly generate a new token', HttpStatus.BAD_REQUEST);
   }

   return {
     status: HttpStatus.OK,
     data: "Token verified successfully."
   } 

  }


  async setNewPassord (request: ResetPasswordDto): Promise<ResponseSuccess> {
     
    const userToken = await this.passwordResetRepo.findOne({where: {resetToken: request.resetToken}});

    if (!userToken) {
      throw new HttpException('Token expired or is no longer valid! Kindly generate a new token', HttpStatus.BAD_REQUEST);
    }
     
    const user = await this.userRepo.findOne({where: {id: userToken.userId}});
    if(!user){
      throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
    }

    const isPreviousPassword = await this.verifyPassword(request.password, user.password);
    if(isPreviousPassword) {
      throw new HttpException('New password cannot be one of previous password.', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await this.hashPassword(request.password);

    user.password = hashedPassword;
    user.confirmPassword = hashedPassword;

    try {
      const updated = await this.userRepo.save(user);
      if(updated) {
        return {
          status: HttpStatus.OK,
          data: 'Password reset successful. Kindly login to your account'
        } 
      }
    } catch (error) {
      throw new HttpException(`An error occured while setting new passwod - Error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }    
  }

  async changedPassword (req: ChangePasswordDto, userId: string) : Promise<ResponseSuccess> {
    const {oldPassword, newPassword, confirmNewPassword} = req;

    if(oldPassword && newPassword && confirmNewPassword) {
      if(newPassword != confirmNewPassword) {
        throw new HttpException('Confirm password must match new password.', HttpStatus.BAD_REQUEST );
      }
  
      const user = await this.userRepo.findOne({where: {id: userId}});
      if(!user){
        throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST );
      }
  
      const isOldPasswordCorrect = await this.verifyPassword(oldPassword, user.password);
      if(!isOldPasswordCorrect) {
        throw new HttpException('Old password do not match our record.', HttpStatus.BAD_REQUEST );
      }  

      const hashedPassword = await this.hashPassword(newPassword);

      user.password = hashedPassword;
      user.confirmPassword = hashedPassword;

      try {
        const updated = await this.userRepo.save(user);
        if(updated) {
          return {
            status: HttpStatus.OK,
            data: 'Password change successful. Kindly login again.'
          } 
        }
      } catch (error) {
        throw new HttpException(`An error occured while changeing your passwod - Error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
      }
    }
    else {
      throw new HttpException('Please check your payload.', HttpStatus.BAD_REQUEST );
    }
  }

}
