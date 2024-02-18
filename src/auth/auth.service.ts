import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfirmUserDto } from './dto/confirm-user.dto';
import { IGoogleUser } from './strategy/google.strategy';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private userService: UserService,
  ) {}

  async registerNewUser(registerUserDto: RegisterDto) {
    const newUser = await this.userService.create(registerUserDto);
    // await this.generateConfirmAccountToken(newUser.email);
    return this.loginUser(newUser);
  }

  async googleLogin(data: IGoogleUser) {
    try {
      const user = await this.userService.findOneByEmail(data.email);
      return this.loginUser(user);
    } catch (error) {
      if (error.status === 404) {
        interface IGoogleCreateUserDto extends CreateUserDto {
          isEmailVerified: boolean;
          role?: string;
        }
        const userDetails: IGoogleCreateUserDto = {
          email: data.email,
          lastName: data.lastName,
          firstName: data.firstName,
          isEmailVerified: true,
          password: data.providerId,
        };
        const user = await this.registerNewUser(userDetails);
        return user;
      }
      throw new InternalServerErrorException(error.detail);
    }
  }

  loginUser(user: User) {
    const payload = { username: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken: accessToken,
      user: user,
    };
  }

  public async getAuthenticatedUser(usernameOrEmail: string, password: string) {
    const user = await this.userService.findOneByEmail(usernameOrEmail);
    if (!user.comparePasswords(password)) {
      throw new UnauthorizedException('Incorrect Password');
    }
    return user;
  }

  async generateConfirmAccountToken(user: User) {
    const userWithToken =
      await this.userService.generateConfirmUserEmailToken(user);
    return userWithToken;
  }

  async confirmNewUserEmail(confirmUserDto: ConfirmUserDto) {
    const confirmedUser =
      await this.userService.confirmUserEmail(confirmUserDto);
    return confirmedUser;
  }

  async getPasswordResetLink(email: string) {
    const user = await this.userService.findOneByEmail(email);
    const userWithToken =
      await this.userService.generatePasswordResetToken(user);
    return userWithToken;
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const user = await this.userService.changePassword(changePasswordDto);
    return user;
  }
}
