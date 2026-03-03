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
            title: "📦 Тестовая доставка (центр Москвы)",
            description: "Передайте символическую посылку (например, письмо) от одного метро к другому в пределах кольцевой линии. Просто для проверки механики логистики.",
            reward: 50,
            lat: 55.7558,
            lng: 37.6173,
            category: "delivery",
            address: "м. Охотный ряд",
            customerId: adminId
        },
        {
            title: "🤖 Проверка тех-поддержки",
            description: "Отправьте любой вопрос в поддержку и получите ответ. Нам важно знать, как быстро реагирует бот @EasyQuestSupportBot.",
            reward: 5,
            lat: 54.9924,
            lng: 73.3686,
            category: "it",
            address: "Дистанционно",
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
