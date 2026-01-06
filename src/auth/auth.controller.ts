import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

interface LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.authService.login(user);
  }

  @Post('admin/login')
  async adminLogin(@Body() loginDto: LoginDto) {
    const adminUser = await this.authService.validateAdminCredentials(
      loginDto.email,
      loginDto.password,
    );

    if (!adminUser) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.authService.login(adminUser);
  }
}
