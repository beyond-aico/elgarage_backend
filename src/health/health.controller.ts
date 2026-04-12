import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthIndicator } from './redis.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Liveness probe — is the process alive?
   * Used by Docker/Railway to decide whether to restart the container.
   * Never checks dependencies — a slow DB must not cause a restart loop.
   */
  @Get()
  @ApiOperation({ summary: 'Liveness probe — process uptime only' })
  liveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe — are all dependencies reachable?
   * Used by load balancers to decide whether to route traffic here.
   * Returns 200 only when both PostgreSQL and Redis are reachable.
   * Returns 503 if either dependency is down.
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe — checks PostgreSQL and Redis connectivity',
  })
  readiness() {
    return this.health.check([
      // Runs a lightweight SELECT 1 against PostgreSQL via the existing
      // PrismaService connection pool — no extra connection opened.
      () => this.prismaHealth.pingCheck('postgresql', this.prisma),

      // PINGs the shared IORedis connection used by BullMQ queues.
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
