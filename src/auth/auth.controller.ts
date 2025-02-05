import { Controller, Post, UseGuards, Req, Res, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@Req() req, @Res() res): Promise<void> {
        await this.authService.logout(req.user.userId);
        res.clearCookie('jwt'); // Assuming the token is stored in a cookie
        res.status(200).send({ message: 'Logged out successfully' });
    }

    @Post('refresh-token')
    async refreshToken(@Body('refresh_token') refreshToken: string) {
        return this.authService.refreshToken(refreshToken);
    }
}
