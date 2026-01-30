import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

interface ItemInput {
  inventoryId?: string;
  serviceId?: string;
}

@ValidatorConstraint({ name: 'InventoryOrService', async: false })
export class InventoryOrServiceConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value) return false;

    const item = value as ItemInput;
    const hasInventory = !!item.inventoryId;
    const hasService = !!item.serviceId;

    // XOR logic: (A and !B) or (!A and B)
    return (hasInventory && !hasService) || (!hasInventory && hasService);
  }

  defaultMessage() {
    return 'Item must provide either an inventoryId or a serviceId, but not both.';
  }
}

export function IsInventoryOrService(validationOptions?: ValidationOptions) {
  return function (target: new (...args: any[]) => any): void {
    registerDecorator({
      target: target,
      propertyName: '',
      ...(validationOptions && { options: validationOptions }),
      constraints: [],
      validator: InventoryOrServiceConstraint,
    });
  };
}
