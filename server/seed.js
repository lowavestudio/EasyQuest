import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const adminId = process.env.ADMIN_CHAT_ID;
    if (!adminId) {
        console.error('❌ Error: ADMIN_CHAT_ID not found in .env');
        return;
    }

    const checkAdmin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!checkAdmin) {
        console.error(`❌ Error: User with ID ${adminId} (admin) not found in DB. Open the app in Telegram first!`);
        return;
    }

    console.log('🌱 Seeding initial tasks for launch...');

    const initialTasks = [
        {
            title: "✨ Подписка на новости проекта",
            description: "Подпишитесь на официальный канал новостей Easy Quest, чтобы не пропускать новые задания и обновления. Награда начисляется мгновенно после проверки.",
            reward: 5,
            lat: 55.751244,
            lng: 37.618423,
            category: "promo",
            address: "Глобальное задание (Telegram)",
            customerId: adminId
        },
        {
            title: "📸 Фото-проверка популярного места (Москва)",
            description: "Сделайте свежее фото Красной площади и загрузите в отчет. Нам нужно убедиться в качестве системы загрузки фото.",
            reward: 15,
            lat: 55.7535,
            lng: 37.6210,
            category: "photo",
            address: "Красная площадь, Москва",
            customerId: adminId
        },
        {
            title: "📦 Курьерская доставка (м. Белорусская)",
            description: "Заберите конверт с документами на выходе из метро и доставьте в бизнес-центр в 5 минутах ходьбы. Время ограничено: 15 мин.",
            reward: 80,
            lat: 55.7766,
            lng: 37.5813,
            category: "delivery",
            address: "м. Белорусская, Москва",
            customerId: adminId
        },
        {
            title: "💬 Креативный отзыв",
            description: "Напишите в наш бот поддержки @EasyQuestSupportBot, что вам больше всего понравилось в приложении и какую фичу вы ждете больше всего. Сделайте скриншот сообщения.",
            reward: 10,
            lat: 59.9343,
            lng: 30.3351,
            category: "help",
            address: "Глобальное задание",
            customerId: adminId
        },
        {
            title: "🏪 Проверка цен в магазине",
            description: "Зайдите в любой сетевой продуктовый магазин (Пятерочка, Магнит) и сфотографируйте ценник на десяток яиц и пакет молока.",
            reward: 25,
            lat: 55.7485,
            lng: 37.5367,
            category: "it",
            address: "Сити, Москва",
            customerId: adminId
        },
        {
            title: "🌉 Фото моста в СПБ",
            description: "Сделайте красивое фото Дворцового моста днем. Это поможет нам протестировать систему распознавания лиц и объектов на фото.",
            reward: 20,
            lat: 59.9411,
            lng: 30.3081,
            category: "photo",
            address: "Сенатская пл., С.-Петербург",
            customerId: adminId
        },
        {
            title: "🏢 Визит в офис",
            description: "Зайдите в наш демонстрационный офис и возьмите стикерпак. Сделайте фото на фоне логотипа.",
            reward: 40,
            lat: 55.7088,
            lng: 37.6591,
            category: "promo",
            address: "Омега Плаза, Москва",
            customerId: adminId
        },
        {
            title: "🛒 Помощь с покупками",
            description: "Помогите донести сумки пожилому человеку от магазина до парадной (до 100 метров). Доброе дело + вознаграждение.",
            reward: 100,
            lat: 55.8021,
            lng: 37.5255,
            category: "help",
            address: "Сокол, Москва",
            customerId: adminId
        },
        {
            title: "🤖 Тестирование API",
            description: "Выполните серию из 5 кликов по разным элементам меню Profile и убедитесь, что всё работает плавно. Отправьте скриншот Profile.",
            reward: 5,
            lat: 55.7558,
            lng: 37.6173,
            category: "it",
            address: "Дистанционно",
            customerId: adminId
        },
        {
            title: "🏙 Задание в Казани",
            description: "Сфотографируйте башню Сююмбике. Нам нужно больше контента из регионов.",
            reward: 35,
            lat: 55.8005,
            lng: 49.1057,
            category: "photo",
            address: "Кремль, Казань",
            customerId: adminId
        }
    ];

    for (const t of initialTasks) {
        await prisma.task.create({ data: t });
    }

    console.log(`✅ Success! Created ${initialTasks.length} initial tasks. Refresh the app to see them.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
