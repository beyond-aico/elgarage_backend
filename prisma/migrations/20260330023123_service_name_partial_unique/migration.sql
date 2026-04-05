CREATE UNIQUE INDEX "Service_name_active_key"
  ON "Service"("name")
  WHERE "deletedAt" IS NULL;