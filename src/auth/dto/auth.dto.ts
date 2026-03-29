// src/auth/dto/auth.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '+201000000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  // --- B2B / Corporate Onboarding Fields ---

  @ApiPropertyOptional({
    example: 'Acme Corp',
    description: 'If provided, creates a new Company alongside the user',
  })
  @IsOptional()
  @IsString()
  organizationName?: string;

  @ApiPropertyOptional({
    example: '123-456-789',
    description: 'Optional tax ID for the company',
  })
  @IsOptional()
  @IsString()
  taxId?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
