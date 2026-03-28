import { PrismaClient, UserRole, ServiceCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CAR_DATA, SERVICES } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Data-Driven Seed...');

  const isProduction = process.env.NODE_ENV === 'production';

  // 1. DEV ONLY CLEANUP - NEVER RUN IN PRODUCTION
  if (!isProduction) {
    console.warn('⚠️ Development mode detected. Wiping existing data...');
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
  } else {
    console.log('🛡️ Production mode detected. Skipping cleanup to preserve live data.');
  }

  // 2. CREATE / UPDATE SERVICES (Using findFirst to avoid @unique requirements)
  const serviceMap: Record<string, string> = {};
  for (const s of SERVICES) {
    let service = await prisma.service.findFirst({ where: { name: s.name } });
    
    if (service) {
      service = await prisma.service.update({
        where: { id: service.id },
        data: { basePrice: s.price, category: s.category as ServiceCategory },
      });
    } else {
      service = await prisma.service.create({
        data: { name: s.name, category: s.category as ServiceCategory, basePrice: s.price },
      });
    }
    serviceMap[s.name] = service.id;
  }
  console.log('✅ Services verified/created');

  // 3. CREATE CARS & RULES
  for (const brandName of Object.keys(CAR_DATA)) {
    let brand = await prisma.carBrand.findFirst({ where: { name: brandName } });
    if (!brand) {
      brand = await prisma.carBrand.create({ data: { name: brandName } });
    }

    const models = CAR_DATA[brandName];

    for (const modelName of Object.keys(models)) {
      const modelData = models[modelName];
      
      let model = await prisma.carModel.findFirst({ where: { name: modelName, brandId: brand.id } });
      if (!model) {
        model = await prisma.carModel.create({
          data: { name: modelName, brandId: brand.id, engineCode: modelData.engine },
        });
      }

      // Apply Rules
      const rules = modelData.rules;
      for (const kmStr of Object.keys(rules)) {
        const km = parseInt(kmStr);
        const serviceNames = rules[kmStr]; 

        for (const sName of serviceNames) {
          const serviceId = serviceMap[sName];
          if (serviceId) {
            const ruleExists = await prisma.maintenanceRule.findFirst({
              where: { modelId: model.id, serviceId, intervalKm: km }
            });

            if (!ruleExists) {
              await prisma.maintenanceRule.create({
                data: { modelId: model.id, serviceId, intervalKm: km }
              });
            }
          } else {
            console.warn(`⚠️ Warning: Service '${sName}' not found for ${brandName} ${modelName}`);
          }
        }
      }
    }
  }
  console.log(`✅ All ${Object.keys(CAR_DATA).length} Brands and Models verified.`);

  // 4. SEED USERS AND ORGANIZATIONS (Using findFirst approach)
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Vodafone Org
  let vodafone = await prisma.organization.findFirst({ where: { taxId: 'TAX-EG-VODA' } });
  if (!vodafone) {
    vodafone = await prisma.organization.create({
      data: { name: 'Vodafone Fleet Egypt', taxId: 'TAX-EG-VODA' }
    });
  }

  // HQ Org
  let hq = await prisma.organization.findFirst({ where: { taxId: 'TAX-EG-HQ' } });
  if (!hq) {
    hq = await prisma.organization.create({
      data: { name: 'Auto Mentor HQ', taxId: 'TAX-EG-HQ' }
    });
  }

  // Users (Assuming email IS marked as @unique in your schema, so upsert is safe here)
  await prisma.user.upsert({
    where: { email: 'test@fleet.com' },
    update: { role: UserRole.ACCOUNT_MANAGER, organizationId: vodafone.id },
    create: { email: 'test@fleet.com', password: hashedPassword, name: 'Fleet Manager', role: UserRole.ACCOUNT_MANAGER, organizationId: vodafone.id }
  });

  await prisma.user.upsert({
    where: { email: 'admin@elgarage.com' },
    update: { role: UserRole.ADMIN, organizationId: hq.id },
    create: { email: 'admin@elgarage.com', password: hashedPassword, name: 'System Administrator', role: UserRole.ADMIN, organizationId: hq.id }
  });

  console.log('✅ Users seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });