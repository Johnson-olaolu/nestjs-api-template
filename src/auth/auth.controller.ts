import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';
import { Profile } from 'src/user/entities/profile.entity';
import { ResponseDto } from 'src/utils/Response.dto';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from 'src/guards/loginGuard.guard';
import { AuthGuard } from '@nestjs/passport';
import { ConfirmUserDto } from './dto/confirm-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { IGoogleUser } from './strategy/google.strategy';

@ApiTags('Auth')
@ApiExtraModels(User, Profile)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({
    status: 200,
    description: 'User registered successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    },
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.registerNewUser(registerDto);
    return {
      success: true,
      message: 'Your account has been created, please confirm your email',
      data: data,
    };
  }

  @ApiResponse({
    status: 200,
    description: 'Login Successfull',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    },
  })
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async loginUser(@Req() request: Request) {
    const user = (request as any).user as User;
    const data = await this.authService.loginUser(user);
    return {
      success: true,
      message: 'user logged in successfully',
      data: data,
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async signInWithGoogle() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() request: Request) {
    const user = (request as any).user as IGoogleUser;
    const data = await this.authService.googleLogin(user);
    return {
      success: true,
      message: 'user logged in successfully',
      data: data,
    };
  }

  @ApiResponse({
    status: 200,
    description: 'Email confirmation token created',
    schema: {
      allOf: [{ $ref: getSchemaPath(ResponseDto) }],
    },
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('confirm-email')
  async getConfirmEmailToken(@Req() request: Request) {
    const user = (request as any).user as User;
    await this.authService.generateConfirmAccountToken(user);
    return {
      success: true,
      message: 'New token generated, Please check your email',
    };
  }

  @ApiResponse({
    status: 201,
    description: 'Email confirmed',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(User),
            },
          },
        },
      ],
    },
  })
  @ApiBearerAuth()
  @HttpCode(201)
  @Post('confirm-email')
  async confirmEmail(@Body() confirmUserDto: ConfirmUserDto) {
    const data = await this.authService.confirmNewUserEmail(confirmUserDto);
    return {
      success: true,
      message: 'Email Confirmed',
      data,
    };
  }

  @ApiResponse({
    status: 200,
    description: 'Get password reset link',
    schema: {
      allOf: [{ $ref: getSchemaPath(ResponseDto) }],
    },
  })
  @Get('change-password')
  async getPasswordResetLink(@Query('email') email: string) {
    await this.authService.getPasswordResetLink(email);
    return {
      success: true,
      message: 'Password reset link sent to your mail',
    };
  }

  @ApiResponse({
    status: 201,
    description: 'Change Password',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(User),
            },
          },
        },
      ],
    },
  })
  @HttpCode(201)
  @Post('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    const data = await this.authService.changePassword(changePasswordDto);
    return {
      success: true,
      message: 'Password changed Succesfully',
      data,
    };
  }
}
