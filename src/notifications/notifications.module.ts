import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

/**
 * @Global() — makes NotificationsService available to every module that is
 * imported after NotificationsModule without needing to re-import this module.
 * Both MaintenanceModule and InventoryModule consume it.
 */
@Global()
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
