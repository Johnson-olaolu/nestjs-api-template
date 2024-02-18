import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role/entities/role.entity';
import { Profile } from './entities/profile.entity';
import { User } from './entities/user.entity';
import { RoleService } from './role/role.service';
import { RoleController } from './role/role.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Profile])],
  controllers: [UserController, RoleController],
  providers: [UserService, RoleService],
  exports: [UserService, RoleService],
})
export class UserModule {}
