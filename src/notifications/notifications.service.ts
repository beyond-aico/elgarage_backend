import { Injectable, Logger } from '@nestjs/common';

/**
 * NotificationsService — central hub for all system alerts.
 *
 * Currently writes structured log entries (readable by any log aggregator such
 * as Datadog or Loki). The two methods are designed as integration seams: swap
 * the body for an email/Slack/webhook call without touching any caller.
 *
 * To add a real email transport:
 *   1. npm install nodemailer @types/nodemailer
 *   2. Inject ConfigService, read SMTP_* env vars.
 *   3. Replace the this.logger.warn() calls with transporter.sendMail(…).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Alert a car owner (or fleet manager) that a maintenance service is due.
   *
   * @param recipientEmail  The user's email address pulled from the DB.
   * @param plateNumber     The car's plate number — human-readable reference.
   * @param serviceName     The service that is due (e.g. "Oil Change").
   * @param reason          Either 'NEVER_PERFORMED' or 'INTERVAL_EXCEEDED'.
   */
  sendMaintenanceAlert(
    recipientEmail: string,
    plateNumber: string,
    serviceName: string,
    reason: 'NEVER_PERFORMED' | 'INTERVAL_EXCEEDED',
  ): void {
    const message =
      reason === 'NEVER_PERFORMED'
        ? `Service "${serviceName}" has never been performed on vehicle ${plateNumber}.`
        : `Service "${serviceName}" is due for vehicle ${plateNumber}.`;

    // Structured log — parseable by any log aggregator.
    this.logger.warn({
      event: 'MAINTENANCE_ALERT',
      recipientEmail,
      plateNumber,
      serviceName,
      reason,
      message,
    });

    /*
     * --- Email integration seam ---
     * Uncomment and configure once SMTP credentials are available.
     *
     * await this.mailer.sendMail({
     *   to: recipientEmail,
     *   subject: `[El Garage] Maintenance Due — ${serviceName}`,
     *   text: message,
     * });
     */
  }

  /**
   * Alert admins / account managers that a part has hit its low-stock threshold.
   *
   * @param partName       Human-readable part name.
   * @param sku            Stock-keeping unit — unique identifier for the part.
   * @param currentQty     Quantity currently in stock.
   * @param threshold      The configured low-stock threshold for this part.
   */
  sendLowStockAlert(
    partName: string,
    sku: string,
    currentQty: number,
    threshold: number,
  ): void {
    this.logger.warn({
      event: 'LOW_STOCK_ALERT',
      partName,
      sku,
      currentQty,
      threshold,
      message: `Part "${partName}" (SKU: ${sku}) is low on stock: ${currentQty} remaining (threshold: ${threshold}).`,
    });

    /*
     * --- Slack / webhook integration seam ---
     *
     * await fetch(process.env.SLACK_WEBHOOK_URL, {
     *   method: 'POST',
     *   headers: { 'Content-Type': 'application/json' },
     *   body: JSON.stringify({
     *     text: `*LOW STOCK* — ${partName} (${sku}): ${currentQty} left (threshold: ${threshold})`,
     *   }),
     * });
     */
  }
}
