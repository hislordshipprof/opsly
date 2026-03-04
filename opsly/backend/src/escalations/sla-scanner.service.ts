import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscalationsService } from './escalations.service.js';

@Injectable()
export class SlaScannerService {
  private readonly logger = new Logger(SlaScannerService.name);

  constructor(private escalations: EscalationsService) {}

  /** Run every 5 minutes — scan for SLA breaches and trigger/advance escalations */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.debug('SLA scanner running...');
    const result = await this.escalations.scanAndEscalate();
    if (result.scanned > 0) {
      this.logger.log(`SLA scan complete: ${result.scanned} breached orders processed`);
    }
  }
}
