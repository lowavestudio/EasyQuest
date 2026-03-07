import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
    // Удаляем фейковые задания
    const deleted = await prisma.task.deleteMany({
        where: {
            title: {
                in: [
                    "Отнести папку с документами",
                    "Сфотографировать вывеску магазина",
                    "Помощь в разгрузке коробок (10 мин)",
                    "Доставка кофе"
                ]
            }
        }
    });
    console.log("Deleted fake tasks:", deleted.count);

    // Проверяем балансы
    const users = await prisma.user.findMany({
        orderBy: { balance: 'desc' }
    });
    console.log("Users and balances:");
    users.forEach(u => console.log(`ID: ${u.id}, Name: ${u.firstName}, Balance: ${u.balance}, Bonus: ${u.bonusBalance}, Earned: ${u.earnedBalance}`));

    // Если у кого-то есть миллион звезд (видимо тестовый аккаунт), выведем его
    const millionaires = users.filter(u => u.balance > 10000);
    for (const m of millionaires) {
        if (m.id === 'promo_user' || m.id === 'test_user') {
            await prisma.user.delete({ where: { id: m.id } });
            console.log(`Deleted test user ${m.id}`);
        }
    }
}

fix().catch(console.error).finally(() => prisma.$disconnect());
