import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedShipping() {
  console.log('🚚 Seeding shipping zones and methods...')

  // Create Côte d'Ivoire default zone
  const ivoryCoastZone = await prisma.shippingZone.upsert({
    where: { id: 'default-ivory-coast' },
    update: {},
    create: {
      id: 'default-ivory-coast',
      name: "Côte d'Ivoire",
      countries: ["Côte d'Ivoire"],
      enabled: true,
      isDefault: true,
    },
  })

  console.log('✅ Created Côte d\'Ivoire default shipping zone')

  // Create shipping methods for Ivory Coast
  const standardDelivery = await prisma.shippingMethod.upsert({
    where: { id: 'standard-delivery-ci' },
    update: {},
    create: {
      id: 'standard-delivery-ci',
      zoneId: ivoryCoastZone.id,
      name: 'Livraison Standard',
      description: 'Livraison dans toute la Côte d\'Ivoire',
      enabled: true,
      costType: 'price_based',
      cost: 2000,
      estimatedDays: '2-5 jours',
      taxable: false,
      priceRanges: [
        { min: 0, max: 50000, cost: 2000 },
        { min: 50000, max: 100000, cost: 1500 },
        { min: 100000, max: null, cost: 0 }, // Free shipping over 100,000 CFA
      ],
    },
  })

  const expressDelivery = await prisma.shippingMethod.upsert({
    where: { id: 'express-delivery-ci' },
    update: {},
    create: {
      id: 'express-delivery-ci',
      zoneId: ivoryCoastZone.id,
      name: 'Livraison Express',
      description: 'Livraison rapide à Abidjan (24-48h)',
      enabled: true,
      costType: 'flat_rate',
      cost: 3500,
      estimatedDays: '24-48h',
      taxable: false,
      minOrderAmount: 75000, // Free express shipping over 75,000 CFA
    },
  })

  const pickupPoint = await prisma.shippingMethod.upsert({
    where: { id: 'pickup-point-ci' },
    update: {},
    create: {
      id: 'pickup-point-ci',
      zoneId: ivoryCoastZone.id,
      name: 'Retrait en Point Relais',
      description: 'Retrait gratuit dans nos points de vente',
      enabled: true,
      costType: 'free',
      cost: 0,
      estimatedDays: '1-3 jours',
      taxable: false,
    },
  })

  console.log('✅ Created 3 shipping methods for Côte d\'Ivoire:')
  console.log('   - Livraison Standard (price-based, 2000 CFA base)')
  console.log('   - Livraison Express (3500 CFA, free over 75,000 CFA)')
  console.log('   - Retrait en Point Relais (free)')

  // Create other West African countries zone (disabled by default for future use)
  const westAfricaZone = await prisma.shippingZone.upsert({
    where: { id: 'west-africa-zone' },
    update: {},
    create: {
      id: 'west-africa-zone',
      name: 'Afrique de l\'Ouest',
      countries: ['Sénégal', 'Mali', 'Burkina Faso', 'Niger', 'Bénin', 'Togo', 'Ghana', 'Guinée'],
      enabled: false, // Disabled for future international expansion
      isDefault: false,
    },
  })

  console.log('✅ Created West Africa zone (disabled for future use)')

  // Create international shipping methods (disabled for future)
  await prisma.shippingMethod.upsert({
    where: { id: 'west-africa-standard' },
    update: {},
    create: {
      id: 'west-africa-standard',
      zoneId: westAfricaZone.id,
      name: 'Livraison Internationale - Afrique de l\'Ouest',
      description: 'Livraison vers les pays de l\'Afrique de l\'Ouest',
      enabled: false,
      costType: 'flat_rate',
      cost: 15000,
      estimatedDays: '5-10 jours',
      taxable: true, // International shipping may be taxable
    },
  })

  // Create Europe zone (disabled for future use)
  const europeZone = await prisma.shippingZone.upsert({
    where: { id: 'europe-zone' },
    update: {},
    create: {
      id: 'europe-zone',
      name: 'Europe',
      countries: ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Allemagne', 'Italie', 'Espagne'],
      enabled: false,
      isDefault: false,
    },
  })

  console.log('✅ Created Europe zone (disabled for future use)')

  await prisma.shippingMethod.upsert({
    where: { id: 'europe-standard' },
    update: {},
    create: {
      id: 'europe-standard',
      zoneId: europeZone.id,
      name: 'Livraison Internationale - Europe',
      description: 'Livraison vers l\'Europe',
      enabled: false,
      costType: 'weight_based',
      cost: 25000,
      estimatedDays: '7-14 jours',
      taxable: true,
      weightRanges: [
        { min: 0, max: 5, cost: 25000 },
        { min: 5, max: 10, cost: 35000 },
        { min: 10, max: 20, cost: 50000 },
        { min: 20, max: null, cost: 75000 },
      ],
    },
  })

  // Create North America zone (disabled for future use)
  const northAmericaZone = await prisma.shippingZone.upsert({
    where: { id: 'north-america-zone' },
    update: {},
    create: {
      id: 'north-america-zone',
      name: 'Amérique du Nord',
      countries: ['États-Unis', 'Canada'],
      enabled: false,
      isDefault: false,
    },
  })

  console.log('✅ Created North America zone (disabled for future use)')

  await prisma.shippingMethod.upsert({
    where: { id: 'north-america-standard' },
    update: {},
    create: {
      id: 'north-america-standard',
      zoneId: northAmericaZone.id,
      name: 'Livraison Internationale - Amérique du Nord',
      description: 'Livraison vers les États-Unis et le Canada',
      enabled: false,
      costType: 'weight_based',
      cost: 35000,
      estimatedDays: '10-21 jours',
      taxable: true,
      weightRanges: [
        { min: 0, max: 5, cost: 35000 },
        { min: 5, max: 10, cost: 50000 },
        { min: 10, max: 20, cost: 70000 },
        { min: 20, max: null, cost: 100000 },
      ],
    },
  })

  console.log('✅ Shipping configuration complete!')
  console.log('   Active: Côte d\'Ivoire (3 methods)')
  console.log('   Future: West Africa, Europe, North America (disabled)')
}

// Run if called directly
if (require.main === module) {
  seedShipping()
    .then(() => {
      console.log('✅ Shipping seed completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Shipping seed failed:', error)
      process.exit(1)
    })
}
