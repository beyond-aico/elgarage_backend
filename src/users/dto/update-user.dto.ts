import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

/**
 * Used by PATCH /users/profile — what a user can update about themselves.
 * Excludes email (requires verification flow), role, and password
 * (password change should be its own dedicated endpoint).
 */
export class UpdateOwnProfileDto {
  @ApiPropertyOptional({ example: 'Ahmed Hegazy' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+201000000000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Cairo' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Egypt' })
  @IsString()
  @IsOptional()
  country?: string;
}

/**
 * Used by PATCH /users/:id (Admin only) — full control including email and role.
 * Password is still excluded — admins reset passwords via a separate flow.
 */
export class AdminUpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}

/**
 * Keep this alias so existing imports that reference UpdateUserDto
 * continue to compile while we migrate call sites to the split DTOs.
 * @deprecated Use UpdateOwnProfileDto or AdminUpdateUserDto directly.
 */
export class UpdateUserDto extends UpdateOwnProfileDto {}
