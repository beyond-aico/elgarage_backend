// prisma/seed.ts
import { PrismaClient, UserRole, ServiceCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seed...');

  // 1. CLEANUP (Optional: Remove if you want to keep data)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.maintenanceRule.deleteMany();
  await prisma.part.deleteMany();
  await prisma.car.deleteMany();
  await prisma.carModel.deleteMany();
  await prisma.carBrand.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.service.deleteMany();

  // 2. CREATE BRANDS & MODELS
  const toyota = await prisma.carBrand.create({ data: { name: 'Toyota' } });
  const bmw = await prisma.carBrand.create({ data: { name: 'BMW' } });

  const corolla = await prisma.carModel.create({
    data: { name: 'Corolla 2022', brandId: toyota.id, engineCode: '1.6L' },
  });
  
  const x5 = await prisma.carModel.create({
    data: { name: 'X5 2023', brandId: bmw.id, engineCode: '3.0L Turbo' },
  });

  console.log('✅ Brands & Models created');

  // 3. SMART INVENTORY TEST
  // Scenario A: GENERIC PART (Fits both)
  await prisma.part.create({
    data: {
      name: 'Shell Helix 5W-30',
      sku: 'OIL-SHELL-5W30',
      price: 550.00,
      compatibleModels: {
        connect: [{ id: corolla.id }, { id: x5.id }] // Fits BOTH
      }
    }
  });

  // Scenario B: SPECIFIC PART (Fits only BMW)
  await prisma.part.create({
    data: {
      name: 'BMW Ceramic Brake Pads',
      sku: 'BRK-BMW-X5-FR',
      price: 3200.00,
      compatibleModels: {
        connect: [{ id: x5.id }] // Fits ONLY BMW
      }
    }
  });

  console.log('✅ Smart Inventory (Generic vs Specific) seeded');

  // 4. MAINTENANCE DNA TEST
  const oilService = await prisma.service.create({
    data: { 
      name: 'Synthetic Oil Change', 
      category: ServiceCategory.FLUIDS,
      basePrice: 200 
    }
  });

  // Rule: Corolla needs oil every 10,000km
  await prisma.maintenanceRule.create({
    data: {
      serviceId: oilService.id,
      modelId: corolla.id,
      intervalKm: 10000
    }
  });

  console.log('✅ Maintenance DNA seeded');

  // 5. CORPORATE LOGIC TEST
  const vodafone = await prisma.organization.create({
    data: { name: 'Vodafone Fleet Egypt', taxId: 'TAX-12345' }
  });

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Fleet Manager
  await prisma.user.create({
    data: {
      email: 'manager@vodafone.com',
      password: hashedPassword,
      name: 'Ahmed Manager',
      role: UserRole.ACCOUNT_MANAGER,
      organizationId: vodafone.id
    }
  });

  console.log('✅ Corporate Organization seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });