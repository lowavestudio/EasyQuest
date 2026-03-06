import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

const USER_ID = '6835854313';
const REFUND_AMOUNT = 100;

// Check current balance first
const before = await prisma.user.findUnique({
    where: { id: USER_ID },
    select: { balance: true, earnedBalance: true, bonusBalance: true }
});

console.log('=== Баланс ДО возврата ===');
console.log('balance:', before.balance);
console.log('earnedBalance:', before.earnedBalance);
console.log('bonusBalance:', before.bonusBalance);

// Refund: restore 100 Stars that were deducted during failed withdrawal
const updated = await prisma.user.update({
    where: { id: USER_ID },
    data: {
        balance: { increment: REFUND_AMOUNT },
        earnedBalance: { increment: REFUND_AMOUNT },
        transactions: {
            create: {
                title: `Возврат: вывод не выполнен (нет горячего кошелька)`,
                amount: REFUND_AMOUNT,
                type: 'refund',
                userId: USER_ID
            }
        }
    }
});

console.log('\n=== Баланс ПОСЛЕ возврата ===');
console.log('balance:', updated.balance);
console.log('earnedBalance:', updated.earnedBalance);
console.log('bonusBalance:', updated.bonusBalance);
console.log(`\n✅ Возвращено ${REFUND_AMOUNT} Stars на баланс!`);

await prisma.$disconnect();
