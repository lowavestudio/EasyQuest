import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

// Fix: set earnedBalance = balance = 120 (so user can test withdrawal of 100)
const updated = await prisma.user.update({
    where: { id: '6835854313' },
    data: {
        balance: 120,
        earnedBalance: 120,
        bonusBalance: 0  // reset bonus to 0 since we have real balance
    }
});

console.log('=== Баланс после исправления ===');
console.log('balance:', updated.balance);
console.log('earnedBalance:', updated.earnedBalance);
console.log('bonusBalance:', updated.bonusBalance);
console.log('Теперь можно выводить от 100 Stars!');

await prisma.$disconnect();
