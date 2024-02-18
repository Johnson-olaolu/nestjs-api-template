import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import moment from 'moment-timezone';
import * as otpGenerator from 'otp-generator';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { ConfirmUserDto } from 'src/auth/dto/confirm-user.dto';
import { Profile } from './entities/profile.entity';
import { POSTGRES_ERROR_CODES } from 'src/utils/constants';
import { RoleService } from './role/role.service';

@Injectable()
export class UserService {
  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
    private roleService: RoleService,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Profile) private profileRepository: Repository<Profile>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userProfile = await this.profileRepository.create(createUserDto);
      await queryRunner.manager.save(userProfile);
      const role = await this.roleService.findOneByName(
        createUserDto.role || 'user',
      );
      const newUser = await this.userRepository.create({
        ...createUserDto,
        role: role,
      });
      const userWithEmail = await this.generateConfirmUserEmailToken(newUser);
      await queryRunner.manager.save(userWithEmail);
      await queryRunner.commitTransaction();
      return userWithEmail;
    } catch (error) {
      console.log(error);
      await queryRunner.rollbackTransaction();
      if (error?.code == POSTGRES_ERROR_CODES.unique_violation) {
        throw new BadRequestException(error.detail);
      }
      throw new InternalServerErrorException(error.detail);
    } finally {
      await queryRunner.release();
    }
  }

  async generateConfirmUserEmailToken(user: User) {
    const verificationToken = otpGenerator.generate(4, {
      digits: true,
      lowerCaseAlphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
    });

    const expire = moment().add(15, 'minutes');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenTTL = expire.toDate();
    // const registrationNotification: INotification<RegistrationNotificationData> =
    //   {
    //     type: ['email'],
    //     recipient: {
    //       mail: user.email,
    //       name: user.userName,
    //     },
    //     data: {
    //       date: moment().toString(),
    //       name: user.userName,
    //       token: verificationToken,
    //     },
    //   };

    return user;
  }

  async confirmUserEmail(confirmUserDto: ConfirmUserDto) {
    const user = await this.findOneByEmail(confirmUserDto.email);
    const currentDate = moment(moment.now()).toDate().valueOf();

    if (
      currentDate > moment(user.emailVerificationTokenTTL).toDate().valueOf()
    ) {
      throw new UnauthorizedException('Token Expired');
    }
    if (confirmUserDto.token !== user.emailVerificationToken) {
      throw new UnauthorizedException('Invalid Token');
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenTTL = null;
    await user.save();
    return user;
  }

  async generatePasswordResetToken(user: User) {
    const passwordResetToken = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
    });

    const expire = moment().add(15, 'minutes');

    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenTTL = moment(expire, true)
      .tz('Africa/Lagos')
      .toDate();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const passwordResetUrl = `${this.configService.get(
      'CLIENT_URL',
    )}/auth/reset-password?email=${user.email}&token=${
      user.passwordResetToken
    }`;

    //send password reset link

    await user.save();
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const user = await this.findOneByEmail(changePasswordDto.email);
    const currentDate = moment(moment.now()).toDate().valueOf();

    if (currentDate > moment(user.passwordResetTokenTTL).valueOf()) {
      throw new UnauthorizedException('Token Expired');
    }
    if (changePasswordDto.token !== user.passwordResetToken) {
      throw new UnauthorizedException('Invalid Token');
    }

    user.password = changePasswordDto.password;
    user.passwordResetToken = null;
    user.passwordResetTokenTTL = null;
    await user.save();
    return user;
  }

  async findAll() {
    const users = await this.userRepository.find();
    return users;
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new NotFoundException(`user not found for this id ${id}`);
    }
    return user;
  }
  async findOneByEmail(email: string) {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundException(`user not found for this email: ${email}`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    for (const key in updateUserDto) {
      user[key] = updateUserDto[key];
    }
    await user.save();
    return user;
  }

  async remove(id: string) {
    const deleteResponse = await this.userRepository.delete(id);
    if (!deleteResponse.affected) {
      throw new NotFoundException('User not found for this ID');
    }
  }
}
