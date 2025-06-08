import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Buat admin user
  const adminEmail = 'admin@carwash.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Admin Carwash',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      },
    });
    console.log('✅ Admin user created: admin@carwash.com / admin123');
  } else {
    console.log('✅ Admin already exists');
  }

  // Buat test user
  const userEmail = 'user@test.com';
  const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('user123', 10);
    await prisma.user.create({
      data: {
        name: 'Test User',
        email: userEmail,
        password: hashedPassword,
        role: 'user'
      },
    });
    console.log('✅ Test user created: user@test.com / user123');
  } else {
    console.log('✅ Test user already exists');
  }

  // Buat layanan sample
  const services = [
    {
      name: 'Cuci Mobil Reguler',
      description: 'Cuci mobil standar dengan sabun dan air bersih',
      price: 25000,
      duration: 30
    },
    {
      name: 'Cuci Mobil Premium',
      description: 'Cuci mobil lengkap dengan wax dan vacuum interior',
      price: 50000,
      duration: 60
    },
    {
      name: 'Cuci Motor',
      description: 'Cuci motor dengan sabun khusus dan lap microfiber',
      price: 15000,
      duration: 20
    },
    {
      name: 'Detailing Mobil',
      description: 'Perawatan lengkap mobil termasuk poles dan coating',
      price: 150000,
      duration: 180
    }
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { name: service.name }
    });

    if (!existing) {
      await prisma.service.create({
        data: service
      });
      console.log(`✅ Service created: ${service.name}`);
    }
  }

  console.log('🌱 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
