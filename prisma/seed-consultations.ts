import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding consultation types and availability...')

  // Create consultation types
  const consultationTypes = [
    {
      name: 'Consultation Personnalisée',
      slug: 'consultation-personnalisee',
      description: 'Décrivez vos besoins spécifiques pour un devis personnalisé. Idéal pour les projets sur-mesure uniques.',
      price: 0, // Sur devis
      duration: 60,
      features: [
        'Écoute de vos besoins spécifiques',
        'Devis personnalisé après évaluation',
        'Solutions sur-mesure adaptées',
        'Suivi individualisé complet'
      ],
      color: '#8b5cf6',
      icon: 'sparkles',
      enabled: true,
      requiresPayment: false,
      sortOrder: 1
    },
    {
      name: 'Analyse Morphologique',
      slug: 'analyse-morphologique',
      description: 'Découvrez votre morphologie et les coupes qui vous subliment. Recevez un guide personnalisé.',
      price: 25000,
      duration: 60,
      features: [
        'Analyse complète de votre silhouette',
        'Conseils personnalisés de style',
        'Guide des coupes adaptées',
        'Rapport détaillé PDF'
      ],
      color: '#f97316',
      icon: 'user',
      enabled: true,
      requiresPayment: true,
      sortOrder: 2
    },
    {
      name: 'Personal Shopping',
      slug: 'personal-shopping',
      description: 'Séance shopping accompagnée avec nos conseillères. On sélectionne, vous choisissez.',
      price: 45000,
      duration: 120,
      features: [
        'Accompagnement shopping personnalisé',
        'Sélection pré-établie selon vos goûts',
        'Essayages conseillés',
        'Conseils style et tendances'
      ],
      color: '#10b981',
      icon: 'shopping-bag',
      enabled: true,
      requiresPayment: true,
      sortOrder: 3
    },
    {
      name: 'Conseil Image Professionnelle',
      slug: 'conseil-image-pro',
      description: 'Optimisez votre image professionnelle. Idéal pour entrepreneurs et cadres.',
      price: 35000,
      duration: 90,
      features: [
        'Audit de votre image actuelle',
        'Recommandations dress code professionnel',
        'Couleurs et styles adaptés à votre secteur',
        'Plan d\'action personnalisé'
      ],
      color: '#3b82f6',
      icon: 'briefcase',
      enabled: true,
      requiresPayment: true,
      sortOrder: 4
    }
  ]

  for (const type of consultationTypes) {
    await prisma.consultationType.upsert({
      where: { slug: type.slug },
      update: type,
      create: type
    })
    console.log(`  ✓ Created/Updated: ${type.name}`)
  }

  // Create default admin availability (Monday to Saturday, 9h-18h)
  const defaultAvailability = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }, // Monday
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' }, // Tuesday
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' }, // Wednesday
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' }, // Thursday
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' }, // Friday
    { dayOfWeek: 6, startTime: '09:00', endTime: '13:00' }, // Saturday (half day)
  ]

  // Check if availability already exists
  const existingAvailability = await prisma.adminAvailability.count()

  if (existingAvailability === 0) {
    for (const availability of defaultAvailability) {
      await prisma.adminAvailability.create({
        data: {
          ...availability,
          slotDuration: 60,
          breakBetween: 15,
          enabled: true
        }
      })
    }
    console.log('  ✓ Created default admin availability (Mon-Sat)')
  } else {
    console.log('  ℹ Admin availability already exists, skipping...')
  }

  console.log('\n✅ Consultation seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding consultations:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
