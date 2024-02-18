import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { CreateRoleDto } from 'src/user/role/dto/create-role.dto';

export const POSTGRES_ERROR_CODES = {
  unique_violation: 23505,
};

export const defaultRoles: CreateRoleDto[] = [
  { name: 'super_admin', description: 'Site Super Admin' },
  { name: 'admin', description: 'Site Admin' },
  { name: 'user', description: 'Site User' },
];

interface IDefaultSuperAdmin extends CreateUserDto {
  isEmailVerified: boolean;
  role: string;
}

export const defaultSuperAdmin: IDefaultSuperAdmin = {
  email: 'super-admin@tib.com',
  password: 'Admin_123',
  isEmailVerified: true,
  role: 'super_admin',
  firstName: 'Super',
  lastName: 'Admin',
};
