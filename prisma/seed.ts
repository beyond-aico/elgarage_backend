// prisma/seed.ts
import { PrismaClient, UserRole, ServiceCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CAR_DATA, SERVICES } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Data-Driven Seed...');

  // 1. CLEANUP
  await prisma.fuelLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.maintenanceRule.deleteMany();
  await prisma.part.deleteMany();
  await prisma.car.deleteMany();
  await prisma.carModel.deleteMany();
  await prisma.carBrand.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.service.deleteMany();

  // 2. CREATE SERVICES
  const serviceMap: Record<string, string> = {};
  for (const s of SERVICES) {
    const created = await prisma.service.create({
      data: { name: s.name, category: s.category as ServiceCategory, basePrice: s.price }
    });
    serviceMap[s.name] = created.id;
  }
  console.log('✅ Services created');

  // 3. CREATE CARS & RULES
  for (const brandName of Object.keys(CAR_DATA)) {
    const brand = await prisma.carBrand.create({ data: { name: brandName } });
    const models = CAR_DATA[brandName];

    for (const modelName of Object.keys(models)) {
      const modelData = models[modelName];
      
      const model = await prisma.carModel.create({
        data: { name: modelName, brandId: brand.id, engineCode: modelData.engine },
      });

      // Apply Rules
      const rules = modelData.rules;
      for (const kmStr of Object.keys(rules)) {
        const km = parseInt(kmStr);
        const serviceNames = rules[kmStr]; // Array of service names

        for (const sName of serviceNames) {
          const serviceId = serviceMap[sName];
          if (serviceId) {
            await prisma.maintenanceRule.create({
              data: { modelId: model.id, serviceId, intervalKm: km }
            });
          } else {
            console.warn(`⚠️ Warning: Service '${sName}' not found for ${brandName} ${modelName}`);
          }
        }
      }
    }
  }
  console.log(`✅ All ${Object.keys(CAR_DATA).length} Brands and Models created successfully.`);

  // 4. CREATE USERS
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const vodafone = await prisma.organization.create({
    data: { name: 'Vodafone Fleet Egypt', taxId: 'TAX-EG-VODA' }
  });

  const hq = await prisma.organization.create({
    data: { name: 'Auto Mentor HQ', taxId: 'TAX-EG-HQ' }
  });

  await prisma.user.create({
    data: { email: 'test@fleet.com', password: hashedPassword, name: 'Fleet Manager', role: UserRole.ACCOUNT_MANAGER, organizationId: vodafone.id }
  });

  await prisma.user.create({
    data: { email: 'admin@elgarage.com', password: hashedPassword, name: 'System Administrator', role: UserRole.ADMIN, organizationId: hq.id }
  });

  console.log('✅ Users seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });