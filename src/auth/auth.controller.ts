import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto'; // You might want to rename this DTO to SignupDto later, but keep for now
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport'; // or your JwtAuthGuard
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
// import { SignupDto } from './dto/auth.dto'; // Use the correct DTO import if you switched

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  // @ApiBody({ type: SignupDto }) 
  register(@Body() dto: any) { // Use 'any' temporarily if DTOs are fighting, or import SignupDto
    // FIX: Change .register() to .signup()
    return this.authService.signup(dto); 
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh')) // Ensure you have this guard or remove if not using refresh tokens yet
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body('userId') userId: string) {
    // FIX: You need to add this method to AuthService (see Fix 2)
    return this.authService.refresh(userId); 
  }
}