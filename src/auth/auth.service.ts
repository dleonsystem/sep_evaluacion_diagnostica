import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, User } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly adminCredentials = {
    email: 'admin@plataforma.local',
    password: 'admin123',
  };

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.validateCredentials(email, password);
    if (!user) {
      return null;
    }

    return this.usersService.sanitizeUser(user);
  }

  async validateAdminCredentials(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    if (
      email !== this.adminCredentials.email ||
      password !== this.adminCredentials.password
    ) {
      return null;
    }

    return {
      id: 999,
      email: this.adminCredentials.email,
      name: 'Administrador',
      role: 'admin',
    };
  }

  async login(user: User | Omit<User, 'password'>) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
    };
  }
}
