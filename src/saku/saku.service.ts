import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Saku, SakuDocument, PrivacyTier, SakuMember } from './schemas/saku.schema';
import { SakuAction, SakuActionDocument } from './schemas/saku-action.schema';
import { CreateSakuDto, JoinSakuDto, UpdatePrivacyDto, SendActionDto } from './dto';
import { Fast, FastDocument } from '../fasts/schemas/fast.schema';

export interface MemberStatus {
  id: string;
  displayName: string;
  initials: string;
  isFastingToday: boolean;
  privacyTier: PrivacyTier;
  progress?: {
    totalFasts: number;
    qadaRemaining?: number;
  };
}

export interface SakuSummary {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  memberCount: number;
  members: MemberStatus[];
  recentActions: SakuAction[];
}

@Injectable()
export class SakuService {
  constructor(
    @InjectModel(Saku.name) private readonly sakuModel: Model<SakuDocument>,
    @InjectModel(SakuAction.name) private readonly sakuActionModel: Model<SakuActionDocument>,
    @InjectModel(Fast.name) private readonly fastModel: Model<FastDocument>,
  ) {}

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async ensureUniqueInviteCode(): Promise<string> {
    let code = this.generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await this.sakuModel.findOne({ inviteCode: code });
      if (!existing) return code;
      code = this.generateInviteCode();
      attempts++;
    }
    throw new BadRequestException('Unable to generate unique invite code');
  }

  async create(userId: string, createSakuDto: CreateSakuDto): Promise<Saku> {
    // Check if user already belongs to a circle
    const existingMembership = await this.sakuModel.findOne({
      'members.user': new Types.ObjectId(userId),
    });

    if (existingMembership) {
      throw new BadRequestException('You already belong to a circle');
    }

    const inviteCode = await this.ensureUniqueInviteCode();

    const saku = new this.sakuModel({
      ...createSakuDto,
      inviteCode,
      createdBy: new Types.ObjectId(userId),
      members: [
        {
          user: new Types.ObjectId(userId),
          joinedAt: new Date(),
          privacyTier: PrivacyTier.LIMITED,
          isAdmin: true,
        },
      ],
    });

    return saku.save();
  }

  async join(userId: string, joinSakuDto: JoinSakuDto): Promise<Saku> {
    // Check if user already belongs to a circle
    const existingMembership = await this.sakuModel.findOne({
      'members.user': new Types.ObjectId(userId),
    });

    if (existingMembership) {
      throw new BadRequestException('You already belong to a circle');
    }

    const saku = await this.sakuModel.findOne({
      inviteCode: joinSakuDto.inviteCode.toUpperCase(),
    });

    if (!saku) {
      throw new NotFoundException('Circle not found with this invite code');
    }

    if (saku.members.length >= 5) {
      throw new BadRequestException('This circle is full (max 5 members)');
    }

    saku.members.push({
      user: new Types.ObjectId(userId),
      joinedAt: new Date(),
      privacyTier: PrivacyTier.LIMITED,
      isAdmin: false,
    });

    return saku.save();
  }

  async leave(userId: string): Promise<void> {
    const saku = await this.sakuModel.findOne({
      'members.user': new Types.ObjectId(userId),
    });

    if (!saku) {
      throw new NotFoundException('You are not a member of any circle');
    }

    const memberIndex = saku.members.findIndex(
      (m) => m.user.toString() === userId,
    );

    if (memberIndex === -1) {
      throw new NotFoundException('You are not a member of this circle');
    }

    const isAdmin = saku.members[memberIndex].isAdmin;

    // Remove member
    saku.members.splice(memberIndex, 1);

    // If no members left, delete the circle
    if (saku.members.length === 0) {
      await this.sakuModel.deleteOne({ _id: saku._id });
      return;
    }

    // If leaving admin was the only admin, promote another member
    if (isAdmin && !saku.members.some((m) => m.isAdmin)) {
      saku.members[0].isAdmin = true;
    }

    await saku.save();
  }

  async getMySaku(userId: string): Promise<Saku | null> {
    return this.sakuModel
      .findOne({ 'members.user': new Types.ObjectId(userId) })
      .populate('members.user', 'firstName lastName');
  }

  async getSakuSummary(userId: string): Promise<SakuSummary | null> {
    const saku = await this.sakuModel
      .findOne({ 'members.user': new Types.ObjectId(userId) })
      .populate('members.user', 'firstName lastName');

    if (!saku) return null;

    // Get today's date string
    const today = new Date();
    const dateString = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    // Get fasting status for all members
    const memberStatuses: MemberStatus[] = await Promise.all(
      saku.members.map(async (member: SakuMember) => {
        const user = member.user as any; // populated user
        const displayName = user.firstName || 'Member';
        const initials = `${(user.firstName || 'M')[0]}${(user.lastName || '')[0] || ''}`.toUpperCase();

        // Check if fasting today
        const todayFast = await this.fastModel.findOne({
          user: member.user._id || member.user,
          name: dateString,
        });

        const status: MemberStatus = {
          id: (member.user._id || member.user).toString(),
          displayName,
          initials,
          isFastingToday: !!todayFast,
          privacyTier: member.privacyTier,
        };

        // Add progress if privacy allows
        if (member.privacyTier === PrivacyTier.PUBLIC) {
          const totalFasts = await this.fastModel.countDocuments({
            user: member.user._id || member.user,
            status: true,
          });
          status.progress = { totalFasts };
        }

        return status;
      }),
    );

    // Get recent actions (last 24 hours)
    const recentActions = await this.sakuActionModel
      .find({ saku: saku._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('sender', 'firstName lastName');

    return {
      id: saku._id.toString(),
      name: saku.name,
      description: saku.description,
      inviteCode: saku.inviteCode,
      memberCount: saku.members.length,
      members: memberStatuses,
      recentActions,
    };
  }

  async updatePrivacy(
    userId: string,
    updatePrivacyDto: UpdatePrivacyDto,
  ): Promise<Saku> {
    const saku = await this.sakuModel.findOne({
      'members.user': new Types.ObjectId(userId),
    });

    if (!saku) {
      throw new NotFoundException('You are not a member of any circle');
    }

    const member = saku.members.find((m) => m.user.toString() === userId);
    if (member) {
      member.privacyTier = updatePrivacyDto.privacyTier;
    }

    return saku.save();
  }

  async sendAction(userId: string, sendActionDto: SendActionDto): Promise<SakuAction> {
    const saku = await this.sakuModel.findOne({
      'members.user': new Types.ObjectId(userId),
    });

    if (!saku) {
      throw new NotFoundException('You are not a member of any circle');
    }

    const action = new this.sakuActionModel({
      saku: saku._id,
      sender: new Types.ObjectId(userId),
      actionType: sendActionDto.actionType,
      message: sendActionDto.message,
    });

    return action.save();
  }

  async getRecentActions(userId: string): Promise<SakuAction[]> {
    const saku = await this.sakuModel.findOne({
      'members.user': new Types.ObjectId(userId),
    });

    if (!saku) {
      throw new NotFoundException('You are not a member of any circle');
    }

    return this.sakuActionModel
      .find({ saku: saku._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('sender', 'firstName lastName');
  }

  async removeMember(adminUserId: string, memberUserId: string): Promise<Saku> {
    const saku = await this.sakuModel.findOne({
      'members.user': new Types.ObjectId(adminUserId),
    });

    if (!saku) {
      throw new NotFoundException('You are not a member of any circle');
    }

    const admin = saku.members.find((m) => m.user.toString() === adminUserId);
    if (!admin?.isAdmin) {
      throw new ForbiddenException('Only admins can remove members');
    }

    const memberIndex = saku.members.findIndex(
      (m) => m.user.toString() === memberUserId,
    );

    if (memberIndex === -1) {
      throw new NotFoundException('Member not found in this circle');
    }

    if (memberUserId === adminUserId) {
      throw new BadRequestException('Cannot remove yourself, use leave instead');
    }

    saku.members.splice(memberIndex, 1);
    return saku.save();
  }

  async regenerateInviteCode(userId: string): Promise<Saku> {
    const saku = await this.sakuModel.findOne({
      'members.user': new Types.ObjectId(userId),
    });

    if (!saku) {
      throw new NotFoundException('You are not a member of any circle');
    }

    const member = saku.members.find((m) => m.user.toString() === userId);
    if (!member?.isAdmin) {
      throw new ForbiddenException('Only admins can regenerate invite codes');
    }

    saku.inviteCode = await this.ensureUniqueInviteCode();
    return saku.save();
  }
}
