-- Rename passwordHash to password
ALTER TABLE "User" RENAME COLUMN "passwordHash" TO "password";

-- Add new columns
ALTER TABLE "User" 
  ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "country" TEXT DEFAULT 'Egypt';