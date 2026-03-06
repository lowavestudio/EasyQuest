import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function cleanDB() {
    try {
        console.log('Начинаю очистку базы данных для релиза...');

        // Удаляем все отзывы
        const reviews = await prisma.review.deleteMany();
        console.log(`Удалено отзывов: ${reviews.count}`);

        // Удаляем все транзакции
        const transactions = await prisma.transaction.deleteMany();
        console.log(`Удалено транзакций: ${transactions.count}`);

        // Удаляем все сообщения в чатах
        const messages = await prisma.message.deleteMany();
        console.log(`Удалено сообщений в чатах: ${messages.count}`);

        // Удаляем все задания
        const tasks = await prisma.task.deleteMany();
        console.log(`Удалено заданий: ${tasks.count}`);

        // Удаляем всех пользователей, КРОМЕ админа (если нужно оставить админа, можно раскомментировать фильтр, 
        // но для полной чистоты лучше удалить всех и зайти снова).
        const users = await prisma.user.deleteMany();
        console.log(`Удалено тестовых пользователей: ${users.count}`);

        console.log('✅ База данных успешно очищена! Теперь можно делать красивые скриншоты.');
    } catch (e) {
        console.error('❌ Ошибка при очистке:', e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanDB();
