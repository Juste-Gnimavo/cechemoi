import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedTax() {
  console.log('💰 Seeding tax rates and classes...')

  // Create default 18% VAT rate for Côte d'Ivoire
  const ivoryCoastVAT = await prisma.taxRate.upsert({
    where: { id: 'default-vat-ci' },
    update: {},
    create: {
      id: 'default-vat-ci',
      country: "Côte d'Ivoire",
      rate: 18.0, // 18% VAT as specified
      name: 'TVA (Taxe sur la Valeur Ajoutée)',
      enabled: true,
      isDefault: true,
      applyToShipping: false, // Shipping not taxed by default
      priority: 1,
    },
  })

  console.log('✅ Created Côte d\'Ivoire 18% VAT (default)')

  // Create tax rates for other African countries (disabled for future use)
  const countries = [
    { country: 'Sénégal', rate: 18.0, name: 'TVA' },
    { country: 'Mali', rate: 18.0, name: 'TVA' },
    { country: 'Burkina Faso', rate: 18.0, name: 'TVA' },
    { country: 'Bénin', rate: 18.0, name: 'TVA' },
    { country: 'Togo', rate: 18.0, name: 'TVA' },
    { country: 'Ghana', rate: 15.0, name: 'VAT' },
    { country: 'Niger', rate: 19.0, name: 'TVA' },
    { country: 'Guinée', rate: 18.0, name: 'TVA' },
  ]

  for (const { country, rate, name } of countries) {
    await prisma.taxRate.upsert({
      where: { id: `vat-${country.toLowerCase().replace(/'/g, '').replace(/ /g, '-')}` },
      update: {},
      create: {
        id: `vat-${country.toLowerCase().replace(/'/g, '').replace(/ /g, '-')}`,
        country,
        rate,
        name,
        enabled: false, // Disabled for future international expansion
        isDefault: false,
        applyToShipping: false,
        priority: 1,
      },
    })
  }

  console.log('✅ Created West Africa tax rates (disabled for future use)')

  // Create European tax rates (disabled for future use)
  const europeanCountries = [
    { country: 'France', rate: 20.0, name: 'TVA' },
    { country: 'Belgique', rate: 21.0, name: 'TVA/BTW' },
    { country: 'Suisse', rate: 7.7, name: 'TVA' },
    { country: 'Allemagne', rate: 19.0, name: 'MwSt' },
    { country: 'Italie', rate: 22.0, name: 'IVA' },
    { country: 'Espagne', rate: 21.0, name: 'IVA' },
  ]

  for (const { country, rate, name } of europeanCountries) {
    await prisma.taxRate.upsert({
      where: { id: `vat-${country.toLowerCase().replace(/'/g, '').replace(/ /g, '-')}` },
      update: {},
      create: {
        id: `vat-${country.toLowerCase().replace(/'/g, '').replace(/ /g, '-')}`,
        country,
        rate,
        name,
        enabled: false,
        isDefault: false,
        applyToShipping: true, // European countries often tax shipping
        priority: 1,
      },
    })
  }

  console.log('✅ Created Europe tax rates (disabled for future use)')

  // Create North American tax rates (disabled for future use)
  await prisma.taxRate.upsert({
    where: { id: 'sales-tax-usa' },
    update: {},
    create: {
      id: 'sales-tax-usa',
      country: 'États-Unis',
      state: 'Average',
      rate: 7.0, // Average sales tax
      name: 'Sales Tax',
      enabled: false,
      isDefault: false,
      applyToShipping: false,
      priority: 1,
    },
  })

  await prisma.taxRate.upsert({
    where: { id: 'gst-hst-canada' },
    update: {},
    create: {
      id: 'gst-hst-canada',
      country: 'Canada',
      rate: 13.0, // HST average
      name: 'GST/HST',
      enabled: false,
      isDefault: false,
      applyToShipping: true,
      priority: 1,
    },
  })

  console.log('✅ Created North America tax rates (disabled for future use)')

  // Create tax classes
  const standardClass = await prisma.taxClass.upsert({
    where: { name: 'Standard' },
    update: {},
    create: {
      name: 'Standard',
      description: 'Taux de taxe standard (18% TVA)',
      rate: null, // Uses default tax rate
      enabled: true,
    },
  })

  const reducedClass = await prisma.taxClass.upsert({
    where: { name: 'Reduced' },
    update: {},
    create: {
      name: 'Reduced',
      description: 'Taux de taxe réduit (pour certains produits alimentaires ou essentiels)',
      rate: 9.0, // 50% of standard rate
      enabled: true,
    },
  })

  const zeroClass = await prisma.taxClass.upsert({
    where: { name: 'Zero-rated' },
    update: {},
    create: {
      name: 'Zero-rated',
      description: 'Produits non taxés (exports, certains services)',
      rate: 0,
      enabled: true,
    },
  })

  const exemptClass = await prisma.taxClass.upsert({
    where: { name: 'Exempt' },
    update: {},
    create: {
      name: 'Exempt',
      description: 'Produits exemptés de taxe (produits médicaux, éducatifs)',
      rate: 0,
      enabled: true,
    },
  })

  console.log('✅ Created 4 tax classes:')
  console.log('   - Standard (18% TVA default)')
  console.log('   - Reduced (9% TVA)')
  console.log('   - Zero-rated (0%)')
  console.log('   - Exempt (0%)')

  // Update settings with default tax rate
  await prisma.settings.upsert({
    where: { id: 'default-settings' },
    update: {
      taxRate: 18.0,
      calculateTax: true,
      pricesIncludeTax: false, // Prices don't include tax by default
    },
    create: {
      id: 'default-settings',
      siteName: 'Cave Express',
      currency: 'XOF',
      currencySymbol: 'CFA',
      taxRate: 18.0,
      calculateTax: true,
      pricesIncludeTax: false,
    },
  })

  console.log('✅ Updated settings with 18% default tax rate')

  console.log('✅ Tax configuration complete!')
  console.log('   Active: Côte d\'Ivoire 18% VAT (default)')
  console.log('   Future: West Africa, Europe, North America (disabled)')
  console.log('   Classes: 4 tax classes (Standard, Reduced, Zero-rated, Exempt)')
}

// Run if called directly
if (require.main === module) {
  seedTax()
    .then(() => {
      console.log('✅ Tax seed completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Tax seed failed:', error)
      process.exit(1)
    })
}
