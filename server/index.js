import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer — memory storage (files go to Cloudinary, not disk)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Platform commission config
const PLATFORM_COMMISSION = 0.10; // 10%
const PLATFORM_WALLET = process.env.PLATFORM_WALLET || 'UQDnHFZgSQqGUqGpG9dClE26K1rZk-BRN8v9Yv8xz1RBeYgJ';

app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPPORT_BOT_TOKEN = process.env.SUPPORT_BOT_TOKEN;

// Helper to send Telegram notifications (main bot)
async function sendNotification(chatId, message) {
    if (!BOT_TOKEN) {
        console.log(`[Notification Mock] to ${chatId}: ${message}`);
        return;
    }
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
        });
    } catch (err) {
        console.error('Failed to send Telegram notification:', err);
    }
}

// ─── Support Bot Auto-Responder ───────────────────────────────────────────────
const SUPPORT_FAQ = [
    {
        keywords: ['stars', 'звезд', 'баланс', 'пополнить', 'купить', 'кошелек', 'кошелёк', 'ton'],
        answer: `💰 <b>Stars и кошелёк</b>\n\nStars — это внутренняя валюта Easy Quest.\n\n• При регистрации вы получаете <b>150 Stars</b> бесплатно\n• Пополнить баланс можно через <b>Кошелёк → Купить Stars</b>, подключив TON-кошелёк\n• 1 Star ≈ 0.01 TON ≈ 0.45₽\n\nОткройте приложение: @easyquestwork_bot`
    },
    {
        keywords: ['задание', 'задач', 'принять', 'найти', 'выполнить', 'задан'],
        answer: `📋 <b>Как принять задание</b>\n\n1. Откройте <b>Лента</b> в приложении\n2. Нажмите на задание на карте или в списке\n3. Нажмите <b>«Принять задание»</b>\n4. Выполните его и загрузите фото\n5. После одобрения заказчиком Stars поступят на баланс\n\nОткройте приложение: @easyquestwork_bot`
    },
    {
        keywords: ['создать', 'опублик', 'заказчик', 'разместить', 'новое задание'],
        answer: `🛠 <b>Как создать задание (для заказчиков)</b>\n\n1. В Профиле переключитесь на роль <b>«Заказчик»</b>\n2. На Ленте нажмите кнопку <b>«+»</b> на карте\n3. Заполните: название, описание, адрес, вознаграждение\n4. Нажмите <b>«Опубликовать»</b>\n\nСтоимость блокируется с баланса и вернётся при отмене.\n\nОткройте приложение: @easyquestwork_bot`
    },
    {
        keywords: ['фото', 'загрузить', 'отчет', 'отчёт', 'сдать', 'доказ'],
        answer: `📸 <b>Как сдать задание</b>\n\n1. Выполните задание на месте\n2. Откройте задание в разделе <b>«Задания → Активные»</b>\n3. Нажмите <b>«Сдать задание»</b>\n4. Сделайте чёткое фото на месте выполнения\n5. Заказчик проверит и одобрит — Stars сразу придут вам\n\nОткройте приложение: @easyquestwork_bot`
    },
    {
        keywords: ['рейтинг', 'отзыв', 'оценк', 'репутац'],
        answer: `⭐ <b>Рейтинг и отзывы</b>\n\nВаш рейтинг (от 1.0 до 5.0★) формируется из оценок заказчиков после каждого выполненного задания.\n\nВысокий рейтинг = больше доверия = больше заданий.\n\nВсе отзывы видны в вашем профиле.\n\nОткройте приложение: @easyquestwork_bot`
    },
    {
        keywords: ['верификац', 'подтвержд', 'значок', 'проверк личности'],
        answer: `✅ <b>Верификация</b>\n\nВерификация подтверждает вашу личность и повышает доверие заказчиков. Верифицированные пользователи имеют приоритет на задания.\n\nФункция верификации в разработке и появится в ближайшем обновлении. Следите за новостями: @EasyQuestNews`
    },
    {
        keywords: ['вывод', 'вывести', 'обмен', 'получить деньги', 'снять'],
        answer: `💸 <b>Вывод Stars</b>\n\nВывод Stars в TON находится в разработке и появится в ближайшем обновлении.\n\nСледите за анонсами: @EasyQuestNews`
    },
    {
        keywords: ['привет', 'здравствуй', 'hi', 'hello', 'хай', 'добрый', 'помог', 'помощь'],
        answer: `👋 <b>Привет! Я бот поддержки Easy Quest.</b>\n\nЧем могу помочь? Напишите ваш вопрос — я отвечу на популярные темы:\n\n• Stars и баланс\n• Как принять задание\n• Как создать задание\n• Как сдать отчёт\n• Рейтинг и отзывы\n• Вывод средств\n\nЕсли я не смогу помочь — передам ваш вопрос команде!`
    },
];

async function sendSupportMessage(chatId, text) {
    if (!SUPPORT_BOT_TOKEN) return;
    try {
        await fetch(`https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
        });
    } catch (err) {
        console.error('[SupportBot] Send error:', err.message);
    }
}

async function handleSupportUpdate(update) {
    const msg = update.message || update.edited_message;
    if (!msg || !msg.text) return;

    const text = msg.text.toLowerCase();
    const chatId = msg.chat.id;
    const userName = msg.from?.first_name || 'Пользователь';

    // Find matching FAQ entry
    const match = SUPPORT_FAQ.find(entry =>
        entry.keywords.some(kw => text.includes(kw))
    );

    if (match) {
        await sendSupportMessage(chatId, match.answer);
    } else {
        // Unknown question — auto-reply + notify admin via main bot
        await sendSupportMessage(chatId,
            `🤔 Получил ваш вопрос! Команда Easy Quest ответит вам в ближайшее время.\n\nПока можете найти ответ в разделе <b>Помощь и FAQ</b> приложения:\n@easyquestwork_bot`
        );
        // Forward to admin (owner) via main bot if we know admin chat id
        if (BOT_TOKEN && process.env.ADMIN_CHAT_ID) {
            await sendNotification(process.env.ADMIN_CHAT_ID,
                `📨 <b>Вопрос в поддержку от ${userName}</b> (id: ${chatId})\n\n<i>${msg.text}</i>\n\n<a href="tg://user?id=${chatId}">Ответить пользователю</a>`
            );
        }
    }
}

// Start long-polling for support bot
let supportBotOffset = 0;
async function pollSupportBot() {
    if (!SUPPORT_BOT_TOKEN) return;
    try {
        const res = await fetch(
            `https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/getUpdates?offset=${supportBotOffset}&timeout=25&allowed_updates=["message"]`,
            { signal: AbortSignal.timeout(30000) }
        );
        const data = await res.json();
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                supportBotOffset = update.update_id + 1;
                handleSupportUpdate(update).catch(console.error);
            }
        }
    } catch (e) {
        // timeout or network error — just retry
    }
    setTimeout(pollSupportBot, 1000);
}


// Auth / Login
app.post('/api/auth/login', async (req, res) => {
    const { id, firstName, username, photoUrl } = req.body;
    if (!id || !firstName) return res.status(400).json({ error: 'Missing fields' });

    try {
        let user = await prisma.user.findUnique({ where: { id: String(id) } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: String(id),
                    firstName,
                    username,
                    photoUrl,
                    balance: 150,
                    transactions: {
                        create: {
                            title: 'Бонус за регистрацию',
                            amount: 150,
                            type: 'bonus'
                        }
                    }
                }
            });
            await sendNotification(id, `<b>Добро пожаловать в Easy Quest, ${firstName}!</b>\n\nВам начислен бонус: 150 Stars ✨`);
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET profile
app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
                reviews: { orderBy: { createdAt: 'desc' }, take: 5 }
            }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST topup balance
app.post('/api/user/:id/topup', async (req, res) => {
    const { amount } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                balance: { increment: Number(amount) },
                transactions: {
                    create: {
                        title: 'Пополнение баланса',
                        amount: Number(amount),
                        type: 'bonus'
                    }
                }
            }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { status: 'available' },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET my tasks
app.get('/api/tasks/my/:userId', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { executorId: req.params.userId, status: { in: ['accepted', 'under_review', 'completed'] } },
                    { customerId: req.params.userId, status: { not: 'cancelled' } }
                ]
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET leaderboard - top executors by completed tasks
app.get('/api/leaderboard', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                photoUrl: true,
                rating: true,
                reviewCount: true,
                _count: {
                    select: { executedTasks: { where: { status: 'completed' } } }
                }
            },
            orderBy: [
                { executedTasks: { _count: 'desc' } },
                { rating: 'desc' }
            ],
            take: 20
        });
        const leaderboard = users.map((u, idx) => ({
            rank: idx + 1,
            id: u.id,
            firstName: u.firstName,
            photoUrl: u.photoUrl,
            rating: u.rating,
            reviewCount: u.reviewCount,
            completedCount: u._count.executedTasks
        }));
        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST upload photo → Cloudinary
app.post('/api/upload', upload.single('photo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'easy-quest', resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
                (error, result) => error ? reject(error) : resolve(result)
            ).end(req.file.buffer);
        });
        res.json({ url: result.secure_url });
    } catch (err) {
        console.error('Cloudinary upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// POST create task (10% platform commission)
app.post('/api/tasks', async (req, res) => {
    const { title, description, reward, lat, lng, customerId, category, address } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: customerId } });
            if (!user || user.balance < reward) throw new Error('Insufficient balance');

            const commission = Math.ceil(reward * PLATFORM_COMMISSION); // 10% rounded up
            const executorReward = reward - commission;

            const task = await tx.task.create({
                data: {
                    title, description, reward: executorReward, lat, lng, customerId,
                    status: 'available', category: category || 'other', address: address || ''
                }
            });

            // Deduct full amount from customer
            await tx.user.update({
                where: { id: customerId },
                data: { balance: { decrement: reward } }
            });

            await tx.transaction.create({
                data: { title: `Создание: ${title}`, amount: -reward, type: 'spend', userId: customerId }
            });

            // Log platform commission (informational)
            console.log(`[Commission] Task #${task.id}: ${commission}★ → ${PLATFORM_WALLET}`);

            return task;
        });
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST accept task
app.post('/api/tasks/:id/accept', async (req, res) => {
    const { userId } = req.body;
    try {
        const task = await prisma.task.update({
            where: { id: Number(req.params.id), status: 'available' },
            data: { status: 'accepted', executorId: userId, acceptedAt: new Date() }
        });
        await sendNotification(task.customerId, `✅ <b>Ваше задание принято!</b>\n\nИсполнитель приступил к выполнению задания: "<i>${task.title}</i>"`);
        res.json(task);
    } catch (err) {
        res.status(400).json({ error: 'Task not available' });
    }
});

// POST submit for review
app.post('/api/tasks/:id/complete', async (req, res) => {
    const { proofPhotoUrl } = req.body;
    try {
        const task = await prisma.task.update({
            where: { id: Number(req.params.id), status: 'accepted' },
            data: { status: 'under_review', proofPhotoUrl }
        });
        await sendNotification(task.customerId, `📩 <b>Задание на проверке!</b>\n\nИсполнитель сдал отчет по заданию: "<i>${task.title}</i>". Проверьте результат в приложении.`);
        res.json(task);
    } catch (err) {
        res.status(400).json({ error: 'Task not in accepted state' });
    }
});

// POST approve task (Customer approves)
app.post('/api/tasks/:id/approve', async (req, res) => {
    const { rating, comment } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const task = await tx.task.findUnique({
                where: { id: Number(req.params.id) },
                include: { executor: true }
            });

            if (!task || task.status !== 'under_review' || !task.executorId) {
                throw new Error('Task cannot be approved');
            }

            // 1. Update task
            await tx.task.update({
                where: { id: task.id },
                data: { status: 'completed', completedAt: new Date() }
            });

            // 2. Pay executor
            await tx.user.update({
                where: { id: task.executorId },
                data: { balance: { increment: task.reward } }
            });

            await tx.transaction.create({
                data: { title: `Оплата: ${task.title}`, amount: task.reward, type: 'earn', userId: task.executorId }
            });

            // 3. Add review & Update rating
            if (rating) {
                await tx.review.create({
                    data: { rating, comment, taskId: task.id, userId: task.executorId }
                });

                const executor = await tx.user.findUnique({ where: { id: task.executorId } });
                const newCount = executor.reviewCount + 1;
                const newRating = ((executor.rating * executor.reviewCount) + rating) / newCount;

                await tx.user.update({
                    where: { id: task.executorId },
                    data: { rating: newRating, reviewCount: newCount }
                });
            }

            return { success: true };
        });

        const taskFinal = await prisma.task.findUnique({ where: { id: Number(req.params.id) } });
        await sendNotification(taskFinal.executorId, `🎉 <b>Задание принято!</b>\n\nЗаказчик одобрил ваш отчет по заданию "<i>${taskFinal.title}</i>". На ваш баланс зачислено ${taskFinal.reward} Stars ✨`);

        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST abandon task
app.post('/api/tasks/:id/abandon', async (req, res) => {
    try {
        const task = await prisma.task.update({
            where: { id: Number(req.params.id), status: 'accepted' },
            data: { status: 'available', executorId: null, acceptedAt: null }
        });
        await sendNotification(task.customerId, `⚠️ <b>Исполнитель отказался</b>\n\nЗадание "<i>${task.title}</i>" снова доступно в ленте.`);
        res.json(task);
    } catch (err) {
        res.status(400).json({ error: 'Cannot abandon' });
    }
});

// GET unread messages count for a user
app.get('/api/unread-count/:userId', async (req, res) => {
    try {
        const count = await prisma.message.count({
            where: {
                readAt: null,
                senderId: { not: req.params.userId },
                task: {
                    OR: [
                        { customerId: req.params.userId },
                        { executorId: req.params.userId }
                    ]
                }
            }
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET messages for a task
app.get('/api/tasks/:id/messages', async (req, res) => {
    const userId = req.query.userId;
    try {
        const messages = await prisma.message.findMany({
            where: { taskId: Number(req.params.id) },
            orderBy: { createdAt: 'asc' },
            include: { sender: true }
        });

        // Mark as read if userId provided
        if (userId) {
            await prisma.message.updateMany({
                where: {
                    taskId: Number(req.params.id),
                    senderId: { not: userId },
                    readAt: null
                },
                data: { readAt: new Date() }
            });
        }

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST message to a task
app.post('/api/tasks/:id/messages', async (req, res) => {
    const { text, senderId } = req.body;
    const taskId = Number(req.params.id);
    try {
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task || task.status === 'available') {
            return res.status(400).json({ error: 'Chat not active for this task' });
        }

        const message = await prisma.message.create({
            data: { text, taskId, senderId },
            include: { task: true, sender: true }
        });

        // Notify the OTHER party
        const otherPartyId = message.senderId === message.task.customerId
            ? message.task.executorId
            : message.task.customerId;

        if (otherPartyId) {
            await sendNotification(otherPartyId, `💬 <b>Новое сообщение</b>\n\nОт: <b>${message.sender.firstName}</b>\nЗадание: "<i>${message.task.title}</i>"\n\n${text}`);
        }

        res.json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static files from the React app
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// DELETE cancel task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const task = await tx.task.findUnique({ where: { id: Number(req.params.id) } });
            if (!task || task.status === 'completed' || task.status === 'under_review') {
                throw new Error('Cannot cancel active or completed task');
            }
            await tx.task.update({ where: { id: task.id }, data: { status: 'cancelled' } });
            await tx.user.update({ where: { id: task.customerId }, data: { balance: { increment: task.reward } } });
            await tx.transaction.create({ data: { title: `Отмена: ${task.title}`, amount: task.reward, type: 'refund', userId: task.customerId } });
            return { success: true };
        });
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Not Found');
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    pollSupportBot();
    console.log('[SupportBot] Auto-responder started for @EasyQuestSupportBot');
});
