import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with first admin user...')

  const adminEmail = 'dg@just.ci'
  const adminPhone = '+2250151092627'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: adminEmail,
    },
  })

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', adminEmail)
    return
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('LM345FCX3xsThales', 12)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Thales',
      email: adminEmail,
      password: hashedPassword,
      phone: adminPhone,
      phoneVerified: new Date(),
      whatsappNumber: '+2250709757296',
      role: 'ADMIN',
      city: 'COTONOU',
      country: 'Ivory Coast',
      countryCode: 'CI',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Admin user created successfully!')
  console.log('📧 Email:', admin.email)
  console.log('📱 Phone:', admin.phone)
  console.log('🔑 Role:', admin.role)
  console.log('🆔 ID:', admin.id)
  console.log('\n🔐 Login credentials:')
  console.log('   Email:', adminEmail)
  console.log('   Password: LM345FCX3xsThales')
  console.log('\n🔗 Admin login URL: http://localhost:3000/auth/stephy-po')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
