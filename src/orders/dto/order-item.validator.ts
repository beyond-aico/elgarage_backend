/**
 * Standalone XOR validator for reuse in other DTOs.
 *
 * OrderItemDto enforces XOR directly via two @ValidateIf phantom-field guards
 * (_xorGuardNeither and _xorGuardBoth). This decorator can be used on any
 * other DTO that needs the same "exactly one of partId/serviceId" constraint.
 *
 * Usage:
 *   @IsPartOrService()
 *   someField: OrderItemShape;
 */
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

interface ItemInput {
  partId?: string;
  serviceId?: string;
}

@ValidatorConstraint({ name: 'PartOrService', async: false })
export class PartOrServiceConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (!value || typeof value !== 'object') return false;

    const item = value as ItemInput;
    const hasPart = !!item.partId;
    const hasService = !!item.serviceId;

    return (hasPart && !hasService) || (!hasPart && hasService);
  }

  defaultMessage() {
    return 'Item must provide either a partId or a serviceId, but not both.';
  }
}

export function IsPartOrService(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string): void {
    registerDecorator({
      target: (target as { constructor: new (...args: unknown[]) => unknown })
        .constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: PartOrServiceConstraint,
    });
  };
}
