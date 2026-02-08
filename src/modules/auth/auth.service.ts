import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private usersService: UsersService) {}

  async validateUser(userId: number) {
    try {
      const user = await this.usersService.findById(userId);

      if (!user || !user.isActive) {
        return null;
      }

      // Extract permission codes from role
      const permissions = user.role.permissions.map((rp) => rp.permission.code);

      return {
        id: user.id,
        username: user.username,
        role: user.role.name,
        roleName: user.role.displayName,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        permissions,
      };
    } catch (error) {
      this.logger.error(`Error validating user ${userId}:`, error);
      return null;
    }
  }

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) {
      throw new UnauthorizedException('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Extract permissions
    const permissions = user.role.permissions.map((rp) => rp.permission.code);

    return {
      id: user.id,
      username: user.username,
      role: user.role.name,
      roleName: user.role.displayName,
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      permissions,
    };
  }
}
