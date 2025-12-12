import { Injectable } from '@nestjs/common';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
}

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      id: 1,
      email: 'admin@example.com',
      password: 'changeme',
      name: 'Administrador',
    },
  ];

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user || user.password !== password) {
      return null;
    }

    return user;
  }

  sanitizeUser(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
