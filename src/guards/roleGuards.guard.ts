import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';

const RoleGuard = (roles: string[]): Type<CanActivate> => {
  class RoleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();
      const user = request.user as User;
      return roles.includes(user?.roleName);
    }
  }
  return mixin(RoleGuardMixin);
};

export default RoleGuard;
