import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@carwash.com';

  // Cek apakah admin sudah ada
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('✅ Admin already exists');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Buat admin user
  await prisma.user.create({
    data: {
      name: 'Admin Carwash',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    },
  });

  console.log('✅ Admin user created: admin@carwash.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
