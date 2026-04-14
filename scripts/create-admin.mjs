import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
const id = `admin_${Date.now()}`;

async function createAdmin() {
  const email = 'italoameida013@gmail.com';
  const password = 'lafamiia013';
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      status: 'ACTIVE',
      createdByAdmin: false,
    },
    create: {
      id: `admin_${Date.now()}`,
      email,
      name: 'Italo Almeida',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Admin created/updated: ${admin.email} (role: ${admin.role})`);
  console.log('Password: lafamiia013');
  await prisma.$disconnect();
}

createAdmin().catch(e => {
  console.error('Error:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
