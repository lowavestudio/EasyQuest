import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const BOT_TOKEN = process.env.BOT_TOKEN;

// Helper to send Telegram notifications
async function sendNotification(chatId, message) {
    if (!BOT_TOKEN) {
        console.log(`[Notification Mock] to ${chatId}: ${message}`);
        return;
    }
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (err) {
        console.error('Failed to send Telegram notification:', err);
    }
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

// POST upload photo
app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// POST create task
app.post('/api/tasks', async (req, res) => {
    const { title, description, reward, lat, lng, customerId, category } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: customerId } });
            if (!user || user.balance < reward) throw new Error('Insufficient balance');

            const task = await tx.task.create({
                data: { title, description, reward, lat, lng, customerId, status: 'available', category: category || 'other' }
            });

            await tx.user.update({
                where: { id: customerId },
                data: { balance: { decrement: reward } }
            });

            await tx.transaction.create({
                data: { title: `Создание: ${title}`, amount: -reward, type: 'spend', userId: customerId }
            });

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
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
