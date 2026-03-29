import { OrderStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

/**
 * Valid transitions map.
 * Key   = current status
 * Value = set of statuses that the order may transition INTO
 */
const VALID_TRANSITIONS: Record<OrderStatus, ReadonlySet<OrderStatus>> = {
  [OrderStatus.PENDING]: new Set([
    OrderStatus.CONFIRMED,
    OrderStatus.CANCELLED,
  ]),
  [OrderStatus.CONFIRMED]: new Set([
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
  ]),
  [OrderStatus.IN_PROGRESS]: new Set([OrderStatus.COMPLETED]),
  [OrderStatus.COMPLETED]: new Set(), // terminal
  [OrderStatus.CANCELLED]: new Set(), // terminal
};

export function assertValidTransition(
  current: OrderStatus,
  next: OrderStatus,
): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed.has(next)) {
    throw new BadRequestException(
      `Cannot transition order from ${current} to ${next}. ` +
        `Allowed transitions: ${[...allowed].join(', ') || 'none (terminal state)'}`,
    );
  }
}

export function isCancellation(next: OrderStatus): boolean {
  return next === OrderStatus.CANCELLED;
}
