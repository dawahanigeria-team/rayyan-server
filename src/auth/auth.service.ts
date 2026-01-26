import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    
    // Find user by email with password
    const user = await this.usersService.findUserWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Return response without password (schema transform handles this)
    const userResponse = user.toObject();
    
    return {
      access_token,
      user: userResponse,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user (password will be hashed by the schema pre-save middleware)
    const user = await this.usersService.createUser({
      firstName,
      lastName,
      email,
      password,
    });

    // Generate JWT token
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Return response without password (schema transform handles this)
    const userResponse = JSON.parse(JSON.stringify(user));

    return {
      access_token,
      user: userResponse,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findUserWithPassword(email);
    if (user && await this.validatePassword(password, user.password)) {
      return user.toObject();
    }
    return null;
  }

  generateJwtToken(user: any): string {
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    return this.jwtService.sign(payload);
  }

  private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}