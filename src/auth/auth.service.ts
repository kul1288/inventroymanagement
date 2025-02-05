import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './refresh-token.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findOne(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.refreshTokenRepository.save({
      userId: user.id,
      token: hashedRefreshToken,
    });

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { userId: payload.sub },
      });

      if (!storedToken || !(await bcrypt.compare(refreshToken, storedToken.token))) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { username: payload.username, sub: payload.sub };
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
      storedToken.token = hashedNewRefreshToken;
      await this.refreshTokenRepository.save(storedToken);

      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }
}
