import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

const user = await prisma.user.findUnique({
    where: { id: '6835854313' },
    select: { balance: true, earnedBalance: true, bonusBalance: true }
});
console.log('=== Баланс пользователя LO WAVE ===');
console.log('Общий баланс (balance):', user.balance);
console.log('Заработанный/Реальный (earnedBalance):', user.earnedBalance);
console.log('Бонусный (bonusBalance):', user.bonusBalance);
await prisma.$disconnect();
