-- CreateIndex
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_carId_serviceId_performedAt_idx" ON "MaintenanceRecord"("carId", "serviceId", "performedAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");