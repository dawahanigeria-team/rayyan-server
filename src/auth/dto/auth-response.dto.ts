import { User } from '../../users/interfaces/user.interface';

export class AuthResponseDto {
  access_token!: string;
  user!: Omit<User, 'password'>;
}