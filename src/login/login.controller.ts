import { Controller, Post, Body, BadRequestException, HttpCode, Res } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Controller('login')
export class LoginController {
  constructor(private readonly authService: AuthService) { }

  @Post()
  @HttpCode(200)
  async login(@Body() loginDto: { username: string; password: string }, @Res() res): Promise<void> {
    if (!loginDto || !loginDto.username || !loginDto.password) {
      throw new BadRequestException('Username and password are required');
    }
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }
    const tokens = await this.authService.login(user);
    res.cookie('jwt', tokens.access_token, { httpOnly: true });
    res.status(200).send(tokens);
  }
}
