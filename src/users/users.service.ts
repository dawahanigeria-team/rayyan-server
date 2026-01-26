import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { PasswordResetToken, PasswordResetTokenDocument } from './schemas/password-reset-token.schema';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PasswordResetToken.name) private passwordResetTokenModel: Model<PasswordResetTokenDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const createdUser = new this.userModel(createUserDto);
      return await createdUser.save();
    } catch (error: any) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`User with this ${field} already exists`);
      }
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      return await this.userModel.findById(id).exec();
    } catch (error) {
      return null;
    }
  }

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async findUserWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true, runValidators: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async count(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  async createPasswordResetToken(email: string): Promise<{ token: string; user: User } | null> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      return null;
    }

    // Invalidate any existing tokens for this user
    await this.passwordResetTokenModel.updateMany(
      { user: user._id, used: false },
      { used: true }
    );

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Create new reset token
    const resetToken = new this.passwordResetTokenModel({
      user: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await resetToken.save();

    return { token, user };
  }

  async validatePasswordResetToken(token: string): Promise<{ valid: boolean; user?: User }> {
    const resetToken = await this.passwordResetTokenModel
      .findOne({
        token,
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .populate('user')
      .exec();

    if (!resetToken || !resetToken.user) {
      return { valid: false };
    }

    return { valid: true, user: resetToken.user as unknown as User };
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const resetToken = await this.passwordResetTokenModel
      .findOne({
        token,
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!resetToken) {
      return false;
    }

    // Hash the new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password
    await this.userModel.findByIdAndUpdate(resetToken.user, {
      password: hashedPassword,
    });

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    return true;
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.passwordResetTokenModel.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { used: true },
      ],
    });
  }
}