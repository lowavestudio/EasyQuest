import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
                id: "promo_user",
                firstName: "Alexander",
                balance: 1000,
                bonusBalance: 100,
                earnedBalance: 900
            }
        });
    }

    // Cancel any existing tasks to clean up the map specifically for the promo video
    await prisma.task.updateMany({ data: { status: 'cancelled' } });

    // Moscow coordinates: 55.7558, 37.6173
    await prisma.task.create({
        data: {
            title: "Отнести папку с документами",
            description: "Оплата наличными на месте. Сделка в бизнес-центре у парка.",
            reward: 0,
            lat: 55.7512,
            lng: 37.6184,
            customerId: user.id,
            paymentType: "cash",
            cashAmount: "1200 ₽",
            category: "delivery",
            address: "Москва, Кремлёвская наб.",
            status: "available"
        }
    });

    await prisma.task.create({
        data: {
            title: "Сфотографировать вывеску магазина",
            description: "Для отчета подрядчикам нужно 3 четких фото новой вывески.",
            reward: 350,
            lat: 55.7601,
            lng: 37.6105,
            customerId: user.id,
            paymentType: "stars",
            category: "photo",
            address: "Тверская улица, Москва",
            status: "available"
        }
    });

    await prisma.task.create({
        data: {
            title: "Помощь в разгрузке коробок (10 мин)",
            description: "Пара коробок с декором. Оплата на месте наличкой или перевод.",
            reward: 0,
            lat: 55.7505,
            lng: 37.6001,
            customerId: user.id,
            paymentType: "cash",
            cashAmount: "500 RUB",
            category: "help",
            address: "Гоголевский бульвар",
            status: "available"
        }
    });

    console.log("Promo tasks seeded successfully in Moscow!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
