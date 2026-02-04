import { PrismaClient, UserRole, ServiceCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seed (24 Models: Opel x2, Kia x5, Hyundai x7, MG x4, Skoda x3, Nissan x3)...');

  // 1. CLEANUP
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

  // 2. CREATE BRANDS & MODELS
  const opel = await prisma.carBrand.create({ data: { name: 'Opel' } });
  const kia = await prisma.carBrand.create({ data: { name: 'Kia' } });
  const hyundai = await prisma.carBrand.create({ data: { name: 'Hyundai' } });
  const mg = await prisma.carBrand.create({ data: { name: 'MG' } });
  const skoda = await prisma.carBrand.create({ data: { name: 'Skoda' } });
  const nissan = await prisma.carBrand.create({ data: { name: 'Nissan' } });

  // Opel Models
  const grandland = await prisma.carModel.create({
    data: { name: 'Grandland X', brandId: opel.id, engineCode: '1.6 Turbo' },
  });
  const astraJ = await prisma.carModel.create({
    data: { name: 'Astra J', brandId: opel.id, engineCode: '1.6L' },
  });

  // Kia Models
  const ceratoK3 = await prisma.carModel.create({
    data: { name: 'Cerato K3', brandId: kia.id, engineCode: '1.6 MPI' },
  });
  const sportageGdi = await prisma.carModel.create({
    data: { name: 'Sportage GDI', brandId: kia.id, engineCode: '1.6 GDI' },
  });
  const sportageNq5 = await prisma.carModel.create({
    data: { name: 'Sportage NQ5', brandId: kia.id, engineCode: '1.6 Turbo GDI' },
  });
  const picanto = await prisma.carModel.create({
    data: { name: 'Picanto', brandId: kia.id, engineCode: '1.2 MPI' },
  });
  const rio = await prisma.carModel.create({
    data: { name: 'Rio', brandId: kia.id, engineCode: '1.4 MPI' },
  });

  // Hyundai Models
  const elantraAd = await prisma.carModel.create({
    data: { name: 'Elantra AD', brandId: hyundai.id, engineCode: '1.6 MPI' },
  });
  const tucsonGdi = await prisma.carModel.create({
    data: { name: 'Tucson GDI', brandId: hyundai.id, engineCode: '1.6 GDI' },
  });
  const tucsonNx4 = await prisma.carModel.create({
    data: { name: 'Tucson NX4', brandId: hyundai.id, engineCode: '1.6 Turbo GDI' },
  });
  const elantraHd = await prisma.carModel.create({
    data: { name: 'Elantra HD', brandId: hyundai.id, engineCode: '1.6 Gamma' },
  });
  const ix35 = await prisma.carModel.create({
    data: { name: 'IX35', brandId: hyundai.id, engineCode: '1.6 GDI' },
  });
  const elantraCn7 = await prisma.carModel.create({
    data: { name: 'Elantra CN7', brandId: hyundai.id, engineCode: '1.6 MPI' },
  });
  const i10 = await prisma.carModel.create({
    data: { name: 'i10', brandId: hyundai.id, engineCode: '1.2 Kappa' },
  });

  // MG Models
  const mg5 = await prisma.carModel.create({
    data: { name: 'MG 5', brandId: mg.id, engineCode: '1.5L' },
  });
  const mg6 = await prisma.carModel.create({
    data: { name: 'MG 6', brandId: mg.id, engineCode: '1.5 Turbo' },
  });
  const mgHs = await prisma.carModel.create({
    data: { name: 'MG HS', brandId: mg.id, engineCode: '1.5 Turbo GDI' },
  });
  const mgRx5 = await prisma.carModel.create({
    data: { name: 'MG RX5', brandId: mg.id, engineCode: '1.5 Turbo' },
  });

  // Skoda Models
  const octaviaA7 = await prisma.carModel.create({
    data: { name: 'Octavia A7', brandId: skoda.id, engineCode: '1.6 MPI' },
  });
  const octaviaA8 = await prisma.carModel.create({
    data: { name: 'Octavia A8', brandId: skoda.id, engineCode: '1.4 TSI' },
  });
  const kodiaq = await prisma.carModel.create({
    data: { name: 'Kodiaq', brandId: skoda.id, engineCode: '1.4 TSI' },
  });

  // Nissan Models
  const sunnyN17 = await prisma.carModel.create({
    data: { name: 'Sunny N17', brandId: nissan.id, engineCode: '1.5L' },
  });
  const sentra = await prisma.carModel.create({
    data: { name: 'Sentra', brandId: nissan.id, engineCode: '1.6L' },
  });
  // NEW: Qashqai J11
  const qashqaiJ11 = await prisma.carModel.create({
    data: { name: 'Qashqai J11', brandId: nissan.id, engineCode: '1.2 Turbo' },
  });

  console.log('✅ Models created: 24 Models Total');

  // 3. CREATE SERVICES
  const services = [
    { name: 'Engine Oil Change', category: ServiceCategory.FLUIDS, price: 600 },
    { name: 'Oil Filter Replacement', category: ServiceCategory.FILTERS, price: 250 },
    { name: 'Fuel Filter Replacement', category: ServiceCategory.FILTERS, price: 400 },
    { name: 'Air Filter Replacement', category: ServiceCategory.FILTERS, price: 300 },
    { name: 'Pollen (Cabin) Filter', category: ServiceCategory.FILTERS, price: 350 },
    { name: 'Spark Plugs Replacement', category: ServiceCategory.IGNITION, price: 1200 },
    { name: 'Coolant Fluid Change', category: ServiceCategory.FLUIDS, price: 450 },
    { name: 'Gearbox Oil Change', category: ServiceCategory.FLUIDS, price: 1500 },
    { name: 'Drive Belt Replacement', category: ServiceCategory.ENGINE, price: 2200 },
    { name: 'Timing Belt Replacement', category: ServiceCategory.ENGINE, price: 3500 },
  ];

  const serviceMap: Record<string, string> = {};

  for (const s of services) {
    const created = await prisma.service.create({
      data: { name: s.name, category: s.category, basePrice: s.price }
    });
    serviceMap[s.name] = created.id;
  }

  // 4. APPLY RULES

  // --- A: Opel Grandland X ---
  const grandlandRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Fuel Filter Replacement', km: 20000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Spark Plugs Replacement', km: 30000 },
    { service: 'Coolant Fluid Change', km: 40000 }, 
    { service: 'Gearbox Oil Change', km: 60000 },   
    { service: 'Drive Belt Replacement', km: 90000 },
  ];
  for (const r of grandlandRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: grandland.id, serviceId, intervalKm: r.km } });
  }

  // --- B: Opel Astra J ---
  const astraRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Fuel Filter Replacement', km: 20000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 60000 },
    { service: 'Gearbox Oil Change', km: 60000 },
    { service: 'Drive Belt Replacement', km: 60000 },
    { service: 'Timing Belt Replacement', km: 60000 },
  ];
  for (const r of astraRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: astraJ.id, serviceId, intervalKm: r.km } });
  }

  // --- C: Kia Cerato K3 ---
  const ceratoRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Drive Belt Replacement', km: 40000 },
    { service: 'Gearbox Oil Change', km: 60000 },
  ];
  for (const r of ceratoRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: ceratoK3.id, serviceId, intervalKm: r.km } });
  }

  // --- D: Kia Sportage GDI ---
  const sportageGdiRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Pollen (Cabin) Filter', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 60000 },
    { service: 'Drive Belt Replacement', km: 60000 },
    { service: 'Gearbox Oil Change', km: 60000 },
  ];
  for (const r of sportageGdiRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: sportageGdi.id, serviceId, intervalKm: r.km } });
  }

  // --- E: Kia Sportage NQ5 ---
  const sportageNq5Rules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Pollen (Cabin) Filter', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 60000 },
    { service: 'Drive Belt Replacement', km: 60000 },
    { service: 'Gearbox Oil Change', km: 100000 },
  ];
  for (const r of sportageNq5Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: sportageNq5.id, serviceId, intervalKm: r.km } });
  }

  // --- F: Kia Picanto ---
  const picantoRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 40000 },
    { service: 'Drive Belt Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Gearbox Oil Change', km: 40000 },
  ];
  for (const r of picantoRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: picanto.id, serviceId, intervalKm: r.km } });
  }

  // --- G: Kia Rio ---
  const rioRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 40000 },
    { service: 'Drive Belt Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Gearbox Oil Change', km: 40000 },
  ];
  for (const r of rioRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: rio.id, serviceId, intervalKm: r.km } });
  }

  // --- H: Hyundai Elantra AD ---
  const elantraAdRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Spark Plugs Replacement', km: 20000 }, 
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Drive Belt Replacement', km: 60000 },
    { service: 'Gearbox Oil Change', km: 60000 },
  ];
  for (const r of elantraAdRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: elantraAd.id, serviceId, intervalKm: r.km } });
  }

  // --- I: Hyundai Tucson GDI ---
  const tucsonGdiRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Pollen (Cabin) Filter', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 60000 },
    { service: 'Drive Belt Replacement', km: 60000 },
    { service: 'Gearbox Oil Change', km: 60000 },
  ];
  for (const r of tucsonGdiRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: tucsonGdi.id, serviceId, intervalKm: r.km } });
  }

  // --- J: Hyundai Tucson NX4 ---
  const tucsonNx4Rules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Pollen (Cabin) Filter', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 60000 },
    { service: 'Drive Belt Replacement', km: 60000 },
    { service: 'Gearbox Oil Change', km: 100000 },
  ];
  for (const r of tucsonNx4Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: tucsonNx4.id, serviceId, intervalKm: r.km } });
  }

  // --- K: Hyundai Elantra HD ---
  const elantraHdRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Spark Plugs Replacement', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Gearbox Oil Change', km: 40000 },
    { service: 'Drive Belt Replacement', km: 60000 },
  ];
  for (const r of elantraHdRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: elantraHd.id, serviceId, intervalKm: r.km } });
  }

  // --- L: Hyundai IX35 ---
  const ix35Rules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Spark Plugs Replacement', km: 20000 }, 
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Drive Belt Replacement', km: 60000 },
    { service: 'Gearbox Oil Change', km: 60000 },
  ];
  for (const r of ix35Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: ix35.id, serviceId, intervalKm: r.km } });
  }

  // --- M: Hyundai Elantra CN7 ---
  const elantraCn7Rules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Spark Plugs Replacement', km: 20000 }, 
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Drive Belt Replacement', km: 60000 },
    { service: 'Gearbox Oil Change', km: 60000 },
  ];
  for (const r of elantraCn7Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: elantraCn7.id, serviceId, intervalKm: r.km } });
  }

  // --- N: Hyundai i10 ---
  const i10Rules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Spark Plugs Replacement', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Gearbox Oil Change', km: 40000 },
    { service: 'Drive Belt Replacement', km: 60000 },
  ];
  for (const r of i10Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: i10.id, serviceId, intervalKm: r.km } });
  }

  // --- O: MG 5 ---
  const mg5Rules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 60000 },
    { service: 'Gearbox Oil Change', km: 60000 },
    { service: 'Coolant Fluid Change', km: 80000 },
    { service: 'Drive Belt Replacement', km: 100000 },
  ];
  for (const r of mg5Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: mg5.id, serviceId, intervalKm: r.km } });
  }

  // --- P: MG 6 ---
  const mg6Rules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 40000 },
    { service: 'Gearbox Oil Change', km: 60000 },
    { service: 'Coolant Fluid Change', km: 80000 },
    { service: 'Drive Belt Replacement', km: 100000 },
  ];
  for (const r of mg6Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: mg6.id, serviceId, intervalKm: r.km } });
  }

  // --- Q: MG HS ---
  const mgHsRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 40000 },
    { service: 'Gearbox Oil Change', km: 60000 },
    { service: 'Coolant Fluid Change', km: 80000 },
    { service: 'Drive Belt Replacement', km: 100000 },
  ];
  for (const r of mgHsRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: mgHs.id, serviceId, intervalKm: r.km } });
  }

  // --- R: MG RX5 ---
  const mgRx5Rules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 40000 },
    { service: 'Gearbox Oil Change', km: 60000 },
    { service: 'Coolant Fluid Change', km: 80000 },
    { service: 'Drive Belt Replacement', km: 100000 },
  ];
  for (const r of mgRx5Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: mgRx5.id, serviceId, intervalKm: r.km } });
  }

  // --- S: Skoda Octavia A7 ---
  const octaviaA7Rules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 60000 },
    { service: 'Spark Plugs Replacement', km: 60000 },
    { service: 'Drive Belt Replacement', km: 60000 },
    { service: 'Timing Belt Replacement', km: 60000 },
    { service: 'Coolant Fluid Change', km: 60000 },
    { service: 'Gearbox Oil Change', km: 60000 },
  ];
  for (const r of octaviaA7Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: octaviaA7.id, serviceId, intervalKm: r.km } });
  }

  // --- T: Skoda Octavia A8 ---
  const octaviaA8Rules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Air Filter Replacement', km: 30000 },
    { service: 'Spark Plugs Replacement', km: 30000 },
    { service: 'Drive Belt Replacement', km: 50000 },
    { service: 'Gearbox Oil Change', km: 50000 },
    { service: 'Fuel Filter Replacement', km: 60000 },
    { service: 'Coolant Fluid Change', km: 60000 },
    { service: 'Timing Belt Replacement', km: 100000 },
  ];
  for (const r of octaviaA8Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: octaviaA8.id, serviceId, intervalKm: r.km } });
  }

  // --- U: Skoda Kodiaq ---
  const kodiaqRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Air Filter Replacement', km: 30000 },
    { service: 'Spark Plugs Replacement', km: 30000 },
    { service: 'Gearbox Oil Change', km: 50000 },
    { service: 'Fuel Filter Replacement', km: 60000 },
    { service: 'Coolant Fluid Change', km: 60000 },
    { service: 'Drive Belt Replacement', km: 100000 },
    { service: 'Timing Belt Replacement', km: 100000 },
  ];
  for (const r of kodiaqRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: kodiaq.id, serviceId, intervalKm: r.km } });
  }

  // --- V: Nissan Sunny N17 ---
  const sunnyN17Rules = [
    // 10k
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    // 20k
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    // 30k (Specific to Nissan)
    { service: 'Fuel Filter Replacement', km: 30000 },
    // 40k (Major)
    { service: 'Spark Plugs Replacement', km: 40000 },
    { service: 'Drive Belt Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Gearbox Oil Change', km: 40000 },
  ];
  for (const r of sunnyN17Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: sunnyN17.id, serviceId, intervalKm: r.km } });
  }

  // --- W: Nissan Sentra ---
  const sentraRules = [
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    { service: 'Fuel Filter Replacement', km: 30000 },
    { service: 'Spark Plugs Replacement', km: 40000 },
    { service: 'Drive Belt Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Gearbox Oil Change', km: 40000 },
  ];
  for (const r of sentraRules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: sentra.id, serviceId, intervalKm: r.km } });
  }

  // --- X: Nissan Qashqai J11 (NEW) ---
  const qashqaiJ11Rules = [
    // 10k
    { service: 'Engine Oil Change', km: 10000 },
    { service: 'Oil Filter Replacement', km: 10000 },
    // 20k
    { service: 'Air Filter Replacement', km: 20000 },
    { service: 'Pollen (Cabin) Filter', km: 20000 },
    // 40k - The Big Service (Fuel Filter aligns here, unlike Sunny)
    { service: 'Fuel Filter Replacement', km: 40000 },
    { service: 'Spark Plugs Replacement', km: 40000 },
    { service: 'Drive Belt Replacement', km: 40000 },
    { service: 'Coolant Fluid Change', km: 40000 },
    { service: 'Gearbox Oil Change', km: 40000 },
  ];
  for (const r of qashqaiJ11Rules) {
    const serviceId = serviceMap[r.service];
    if (serviceId) await prisma.maintenanceRule.create({ data: { modelId: qashqaiJ11.id, serviceId, intervalKm: r.km } });
  }

  console.log('✅ Schedules applied for all 24 models.');

  // 5. CREATE USERS
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const vodafone = await prisma.organization.create({
    data: { name: 'Vodafone Fleet Egypt', taxId: 'TAX-EG-VODA' }
  });

  const hq = await prisma.organization.create({
    data: { name: 'Auto Mentor HQ', taxId: 'TAX-EG-HQ' }
  });

  await prisma.user.create({
    data: {
      email: 'manager@vodafone.com',
      password: hashedPassword,
      name: 'Ahmed Manager',
      role: UserRole.ACCOUNT_MANAGER,
      organizationId: vodafone.id
    }
  });

  await prisma.user.create({
    data: {
      email: 'admin@automentor.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: UserRole.ADMIN,
      organizationId: hq.id
    }
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