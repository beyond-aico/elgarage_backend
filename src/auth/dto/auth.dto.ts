// src/auth/dto/auth.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // --- B2B / Corporate Onboarding Fields ---
  
  @IsOptional()
  @IsString()
  organizationName?: string; // If provided, we create a Company!

  @IsOptional()
  @IsString()
  taxId?: string; // Optional tax ID for the company
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  password!: string;
}