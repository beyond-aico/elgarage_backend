import { Module } from '@nestjs/common';
import { AdminReportsService } from './admin-reports.service';
import { AdminReportsController } from './admin-reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { REPORTS_REPOSITORY } from './interfaces/reports.repository.interface';
import { ReportsPrismaRepository } from './repositories/reports.prisma.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AdminReportsController],
  providers: [
    AdminReportsService,
    {
      provide: REPORTS_REPOSITORY,
      useClass: ReportsPrismaRepository,
    },
  ],
})
export class ReportsModule {}
