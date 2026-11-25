import readline from 'readline';
import bcrypt from 'bcryptjs';
import { GlobalRole } from '@prisma/client';
import { prisma } from '../config/database.js';

function promptHiddenOrLine(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const email = process.env.ADMIN_EMAIL || (await promptHiddenOrLine('Super-admin email: '));
  const fullName =
    process.env.ADMIN_NAME || (await promptHiddenOrLine('Super-admin full name: '));
  const password =
    process.env.ADMIN_PASSWORD || (await promptHiddenOrLine('Super-admin password (min 8 chars): '));

  if (!email || !fullName || !password || password.length < 8) {
    console.error('Invalid admin bootstrap inputs. Provide valid email, name, and 8+ char password.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      fullName,
      passwordHash,
      globalRole: GlobalRole.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: email.toLowerCase(),
      fullName,
      passwordHash,
      globalRole: GlobalRole.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(`Super-admin ready: ${user.email} (${user.id})`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Admin bootstrap failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
