import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async validateUser(userId: number) {
    // Standalone auth for minimart POS system
    // In production, validate against a user store or external service
    if (process.env.NODE_ENV === 'development') {
      this.logger.warn(
        `Using mock user for development (userId: ${userId})`,
      );
      return {
        id: userId,
        username: 'cashier',
        role: 'ADMIN',
        name: 'Minimart Cashier',
      };
    }

    return null;
  }
}
