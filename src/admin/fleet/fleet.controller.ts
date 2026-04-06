import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';

import { CarsService } from '../../cars/cars.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthUser } from '../../auth/types/auth-user.type';
import { AssignBarcodeDto } from './dto/assign-barcode.dto';

type AuthRequest = Request & { user: AuthUser };

/**
 * Admin / Account-Manager fleet management endpoints.
 *
 * Kept separate from the user-facing CarsController so that privileged
 * mutations (barcode assignment, etc.) never mix with the owner-scoped CRUD.
 */
@ApiTags('Admin — Fleet')
@ApiBearerAuth()
@Controller('admin/fleet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminFleetController {
  constructor(private readonly carsService: CarsService) {}

  /**
   * PATCH /admin/fleet/cars/:carId/barcode
   *
   * Assigns (or replaces) the barcode printed on a fleet vehicle.
   * Only fleet vehicles (isFleetVehicle = true) can have a barcode —
   * attempting to assign one to a personal car returns 403.
   *
   * The barcode is what drivers scan at the start of a shift via
   * POST /fleet/auth-barcode, so it must be set before drivers can log fuel.
   */
  @Patch('cars/:carId/barcode')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.ACCOUNT_MANAGER)
  @ApiParam({ name: 'carId', description: 'UUID of the fleet vehicle' })
  @ApiOperation({
    summary: 'Assign a barcode to a fleet vehicle (Admin / Account Manager)',
    description:
      'Sets the scannable barcode on a fleet vehicle. ' +
      'The vehicle must be owned by a fleet organisation (isFleetVehicle = true). ' +
      'Account Managers can only update vehicles that belong to their own organisation.',
  })
  @ApiResponse({ status: 200, description: 'Barcode assigned successfully' })
  @ApiResponse({
    status: 403,
    description: 'Not a fleet vehicle, or wrong org',
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({
    status: 409,
    description: 'Barcode already in use by another vehicle',
  })
  assignBarcode(
    @Req() req: AuthRequest,
    @Param('carId', ParseUUIDPipe) carId: string,
    @Body() dto: AssignBarcodeDto,
  ) {
    return this.carsService.assignBarcode(carId, dto.barcode, req.user);
  }
}
