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
import { sendTon } from './ton.js';

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

// Main bot polling — handles admin commands from the owner
let mainBotOffset = 0;
async function pollMainBot() {
    if (!BOT_TOKEN) return;
    try {
        const res = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${mainBotOffset}&timeout=25&allowed_updates=["message","pre_checkout_query"]`,
            { signal: AbortSignal.timeout(30000) }
        );
        const data = await res.json();
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                mainBotOffset = update.update_id + 1;
                handleMainBotCommand(update).catch(console.error);
            }
        }
    } catch (e) { /* retry */ }
    setTimeout(pollMainBot, 1000);
}

async function handleMainBotCommand(update) {
    // Handle Stars payment confirmation
    if (update.pre_checkout_query) {
        // Must answer within 10 seconds!
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pre_checkout_query_id: update.pre_checkout_query.id, ok: true })
        });
        return;
    }

    const msg = update.message;
    if (!msg) return;

    // Handle successful payment — credit user balance
    if (msg.successful_payment) {
        const payment = msg.successful_payment;
        const { userId, stars } = JSON.parse(payment.invoice_payload);
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    balance: { increment: stars },
                    earnedBalance: { increment: stars }, // purchased = withdrawable
                    transactions: {
                        create: { title: `Покупка ${stars} Stars`, amount: stars, type: 'topup', userId }
                    }
                }
            });
            await sendNotification(userId, `⭐ <b>Баланс пополнен!</b>\n\nВам зачислено <b>${stars} Stars</b>.\nОткройте приложение: @easyquestwork_bot`);
        } catch (e) {
            console.error('[Payment] Failed to credit balance:', e.message);
        }
        return;
    }

    if (!msg.text) return;
    const text = msg.text.trim();

    // /start command for all users
    if (text.startsWith('/start')) {
        const keyboard = {
            inline_keyboard: [[
                { text: "🚀 Запустить Easy Quest", web_app: { url: "https://easyquesteasy-quest.onrender.com" } }
            ]]
        };
        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: msg.chat.id,
                    text: `👋 <b>Добро пожаловать в Easy Quest!</b>\n\nЭто биржа простых заданий в вашем любимом мессенджере. Здесь вы можете:\n\n✨ <b>Зарабатывать Stars</b>, выполняя быстрые и легкие поручения.\n🔥 <b>Создавать задания</b> и находить исполнителей за пару минут.\n💳 <b>Выводить заработок</b> прямо на свой TON-кошелек.\n\n🎁 <i>При регистрации вы получите бонус 150 Stars!</i>\n\n👇 Нажмите кнопку ниже, чтобы запустить приложение.`,
                    parse_mode: 'HTML',
                    reply_markup: keyboard
                })
            });
        } catch (e) {
            console.error('[Bot] Failed to send /start message', e);
        }
    }

    const adminId = process.env.ADMIN_CHAT_ID;
    if (String(msg.from.id) !== String(adminId)) return; // Only admin past this point



    if (text.startsWith('/approve ')) {
        const userId = text.replace('/approve ', '').trim();
        try {
            await prisma.user.update({ where: { id: userId }, data: { verificationStatus: 'verified' } });
            await sendNotification(adminId, `✅ Пользователь <code>${userId}</code> — верифицирован!`);
            await sendNotification(userId, `🎉 <b>Ваш аккаунт верифицирован!</b>\n\nТеперь рядом с вашим именем отображается синяя галочка ✅. Заказчики будут доверять вам больше — вы будете получать приоритетные задания!\n\nOткройте приложение: @easyquestwork_bot`);
        } catch (e) {
            await sendNotification(adminId, `❌ Ошибка верификации: ${e.message}`);
        }
    } else if (text.startsWith('/reject ')) {
        const userId = text.replace('/reject ', '').trim();
        try {
            await prisma.user.update({ where: { id: userId }, data: { verificationStatus: 'rejected' } });
            await sendNotification(adminId, `🚫 Пользователь <code>${userId}</code> — отклонён.`);
            await sendNotification(userId, `😔 <b>Верификация не пройдена</b>\n\nК сожалению, мы не смогли подтвердить вашу личность. Пожалуйста, повторите попытку:\n\n• Убедитесь что фото документа чёткое\n• Ваше лицо и данные документа чётко видны\n\nОткройте приложение: @easyquestwork_bot`);
        } catch (e) {
            await sendNotification(adminId, `❌ Ошибка отклонения: ${e.message}`);
        }
    } else if (text === '/pending') {
        try {
            const pending = await prisma.user.findMany({ where: { verificationStatus: 'pending' }, select: { id: true, firstName: true, verificationPhotoUrl: true } });
            if (pending.length === 0) {
                await sendNotification(adminId, `✅ Нет заявок на верификацию`);
            } else {
                for (const u of pending) {
                    await sendNotification(adminId,
                        `🛡 <b>Заявка на верификацию</b>\n\nПользователь: <a href="tg://user?id=${u.id}">${u.firstName}</a> (ID: <code>${u.id}</code>)\n<a href="${u.verificationPhotoUrl}">📋 Фото документа</a>\n\n<b>Одобрить:</b> /approve ${u.id}\n<b>Отклонить:</b> /reject ${u.id}`
                    );
                }
            }
        } catch (e) {
            await sendNotification(adminId, `❌ Ошибка: ${e.message}`);
        }
    } else if (text === '/stats') {
        try {
            const [users, tasks, pending] = await Promise.all([
                prisma.user.count(),
                prisma.task.count({ where: { status: 'completed' } }),
                prisma.user.count({ where: { verificationStatus: 'pending' } })
            ]);
            await sendNotification(adminId,
                `📊 <b>Easy Quest Stats</b>\n\n👤 Пользователей: <b>${users}</b>\n✅ Выполнено заданий: <b>${tasks}</b>\n🛡 Ждут верификации: <b>${pending}</b>\n\n<i>/pending — список заявок на верификацию</i>`
            );
        } catch (e) {
            await sendNotification(adminId, `❌ Ошибка: ${e.message}`);
        }
    }
}


// Auth / Login
app.post('/api/auth/login', async (req, res) => {
    const { id, firstName, username, photoUrl, startParam } = req.body;
    if (!id || !firstName) return res.status(400).json({ error: 'Missing fields' });

    try {
        let user = await prisma.user.findUnique({ where: { id: String(id) } });
        if (!user) {
            let referredById = null;
            if (startParam && startParam.startsWith('ref_')) {
                const refId = startParam.replace('ref_', '');
                if (refId !== String(id)) {
                    const referrer = await prisma.user.findUnique({ where: { id: refId } });
                    if (referrer) referredById = refId;
                }
            }

            user = await prisma.user.create({
                data: {
                    id: String(id),
                    firstName,
                    username,
                    photoUrl,
                    balance: 150,      // display total
                    bonusBalance: 150, // non-withdrawable welcome bonus
                    earnedBalance: 0,  // withdrawable — starts at ZERO
                    referredById,
                    transactions: {
                        create: {
                            title: 'Бонус за регистрацию (не выводится)',
                            amount: 150,
                            type: 'bonus'
                        }
                    }
                }
            });
            await sendNotification(id, `<b>Добро пожаловать в Easy Quest, ${firstName}!</b>\n\nВам начислен бонус: 150 Stars ✨`);
        }

        const adminId = process.env.ADMIN_CHAT_ID;
        const isAdmin = String(user.id) === String(adminId);
        res.json({ ...user, isAdmin });
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
                reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
                _count: { select: { referrals: true } }
            }
        });

        if (!user) return res.status(404).json({ error: 'Not found' });

        const adminId = process.env.ADMIN_CHAT_ID;
        const isAdmin = String(user.id) === String(adminId);

        res.json({ ...user, isAdmin });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST update user location
app.post('/api/user/:id/location', async (req, res) => {
    const { lat, lng } = req.body;
    try {
        await prisma.user.update({
            where: { id: req.params.id },
            data: { lastKnownLat: lat, lastKnownLng: lng }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN API ---
app.get('/api/admin/stats', async (req, res) => {
    // Basic auth via token or ID check (ID check is safer here since we have ADMIN_CHAT_ID)
    const adminId = process.env.ADMIN_CHAT_ID;
    const reqAdminId = req.headers['x-admin-id'];

    if (String(reqAdminId) !== String(adminId)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const [userCount, taskCount, totalStars, pendingVerif] = await Promise.all([
            prisma.user.count(),
            prisma.task.count({ where: { status: 'completed' } }),
            prisma.user.aggregate({ _sum: { balance: true } }),
            prisma.user.count({ where: { verificationStatus: 'pending' } })
        ]);

        res.json({
            userCount,
            taskCount,
            totalStars: totalStars._sum.balance || 0,
            pendingVerif
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/broadcast', async (req, res) => {
    const adminId = process.env.ADMIN_CHAT_ID;
    const reqAdminId = req.headers['x-admin-id'];
    const { message } = req.body;

    if (String(reqAdminId) !== String(adminId)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const users = await prisma.user.findMany({ select: { id: true } });
        let sent = 0;
        for (const u of users) {
            try {
                await sendNotification(u.id, `📢 <b>Объявление:</b>\n\n${message}`);
                sent++;
            } catch (e) { /* ignore blocked bot */ }
        }
        res.json({ success: true, sent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST submit verification KYC
app.post('/api/user/:id/verify', async (req, res) => {
    const { photoUrl } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                verificationStatus: 'pending',
                verificationPhotoUrl: photoUrl
            }
        });

        if (BOT_TOKEN && process.env.ADMIN_CHAT_ID) {
            await sendNotification(process.env.ADMIN_CHAT_ID,
                `🛡 <b>Новая заявка на верификацию!</b>\n\nПользователь: <a href="tg://user?id=${user.id}">${user.firstName}</a> (ID: <code>${user.id}</code>)\n\n<a href="${photoUrl}">📋 Посмотреть фото документа</a>\n\n<b>Одобрить:</b> /approve ${user.id}\n<b>Отклонить:</b> /reject ${user.id}`
            );
        }

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
                earnedBalance: { increment: Number(amount) }, // topup = withdrawable
                transactions: {
                    create: {
                        title: 'Пополнение баланса',
                        amount: Number(amount),
                        type: 'topup'
                    }
                }
            }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST withdraw — with strict anti-fraud eligibility
app.post('/api/user/:id/withdraw', async (req, res) => {
    const { amount, walletAddress } = req.body;
    const MIN_WITHDRAWAL = 100;  // Stars
    const MIN_TASKS = 0;         // testing mostly: 0. Change back to 3 for production if needed.

    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Anti-fraud: must have completed at least MIN_TASKS tasks
        if (user.tasksCompleted < MIN_TASKS) {
            return res.status(403).json({
                error: `Для вывода нужно выполнить минимум ${MIN_TASKS} задания. У вас: ${user.tasksCompleted}.`
            });
        }

        // Anti-fraud: can only withdraw earnedBalance (not bonus)
        if (user.earnedBalance < MIN_WITHDRAWAL) {
            return res.status(403).json({
                error: `Минимальная сумма вывода — ${MIN_WITHDRAWAL} Stars. Ваш заработанный баланс: ${user.earnedBalance} Stars. Бонусные Stars не выводятся.`
            });
        }

        if (user.earnedBalance < amount) {
            return res.status(403).json({ error: 'Недостаточно заработанных Stars для вывода.' });
        }

        if (!walletAddress) {
            return res.status(400).json({ error: 'Не указан TON-кошелёк.' });
        }

        // Deduct from both balances
        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                balance: { decrement: Number(amount) },
                earnedBalance: { decrement: Number(amount) },
                transactions: {
                    create: {
                        title: `Вывод на ${walletAddress.slice(0, 8)}...`,
                        amount: -Number(amount),
                        type: 'withdraw'
                    }
                }
            }
        });

        // --- AUTOMATIC WITHDRAWAL ---
        const tonAmount = Number(amount) * 0.01;
        let transferInfo = { status: 'manual' };

        try {
            console.log(`🚀 Processing automatic withdrawal for ${user.id}: ${tonAmount} TON to ${walletAddress}`);
            const result = await sendTon(walletAddress, tonAmount);
            transferInfo = { status: 'auto', result };
            console.log(`✅ Auto-withdrawal successful for ${user.id}`);
        } catch (tonErr) {
            console.error(`❌ Auto-withdrawal failed for ${user.id}:`, tonErr);
            transferInfo = { status: 'failed', error: tonErr.message };
        }

        // Notify admin
        if (BOT_TOKEN && process.env.ADMIN_CHAT_ID) {
            const statusIcon = transferInfo.status === 'auto' ? '✅' : transferInfo.status === 'failed' ? '❌' : '⏳';
            const statusMsg = transferInfo.status === 'auto'
                ? '<b>Авто-вывод выполнен успешно!</b>'
                : transferInfo.status === 'failed'
                    ? `<b>Ошибка авто-вывода:</b> <code>${transferInfo.error}</code>\n<i>Требуется ручное вмешательство!</i>`
                    : '<b>Требуется ручной вывод.</b>';

            await sendNotification(process.env.ADMIN_CHAT_ID,
                `💸 <b>Запрос на вывод (${amount} Stars)</b>\n\nПользователь: <a href="tg://user?id=${user.id}">${user.firstName}</a>\nСумма: <b>${tonAmount.toFixed(2)} TON</b>\nКошелёк: <code>${walletAddress}</code>\n\nСтатус: ${statusIcon} ${statusMsg}`
            );
        }

        res.json({ success: true, user: updated, transfer: transferInfo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST buy-stars — send Telegram Stars invoice to user
app.post('/api/user/:id/buy-stars', async (req, res) => {
    const { stars } = req.body; // number of stars to buy
    const userId = req.params.id;

    if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot not configured' });

    const packages = {
        10: { label: '10 Stars', price: 10 },
        50: { label: '50 Stars', price: 50 },
        100: { label: '100 Stars', price: 100 },
        250: { label: '250 Stars', price: 250 },
    };

    const pkg = packages[stars];
    if (!pkg) return res.status(400).json({ error: 'Invalid package' });

    try {
        const invoiceRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Покупка ${pkg.label}`,
                description: `Зачисление ${stars} Stars на баланс Easy Quest`,
                payload: JSON.stringify({ userId, stars }),
                provider_token: "", // Required to be empty for XTR
                currency: 'XTR', // Telegram Stars
                prices: [{ label: pkg.label, amount: pkg.price }]
            })
        });
        const invoiceData = await invoiceRes.json();
        if (!invoiceData.ok) throw new Error(invoiceData.description);

        // Return the invoice link so Mini App can open it natively
        res.json({ success: true, url: invoiceData.result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { status: 'available' },
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { id: true, firstName: true, photoUrl: true, rating: true, verificationStatus: true } }
            }
        });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single task
app.get('/api/tasks/:id', async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                customer: { select: { id: true, firstName: true, photoUrl: true, rating: true, reviewCount: true, verificationStatus: true } },
                executor: { select: { id: true, firstName: true, photoUrl: true, rating: true, reviewCount: true, verificationStatus: true } }
            }
        });
        if (!task) return res.status(404).json({ error: 'Not found' });
        res.json(task);
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
                    select: { tasksAccepted: { where: { status: 'completed' } } }
                }
            },
            orderBy: [
                { tasksAccepted: { _count: 'desc' } },
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
            completedCount: u._count.tasksAccepted
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

            // Calculate exact deduction: prioritize spending bonus balance first!
            const deductFromBonus = Math.min(user.bonusBalance, reward);
            const deductFromEarned = reward - deductFromBonus;

            // Deduct full amount from customer
            await tx.user.update({
                where: { id: customerId },
                data: {
                    balance: { decrement: reward },
                    bonusBalance: { decrement: deductFromBonus },
                    earnedBalance: { decrement: deductFromEarned }
                }
            });

            await tx.transaction.create({
                data: { title: `Создание: ${title}`, amount: -reward, type: 'spend', userId: customerId }
            });

            // --- Geolocation Push Notification ---
            // After task is created, find users within 5km and notify them via Bot
            try {
                // Fetch users who have lat/lng and are not the customer
                const nearbyUsers = await tx.user.findMany({
                    where: {
                        id: { not: customerId },
                        lastKnownLat: { not: null },
                        lastKnownLng: { not: null }
                    },
                    select: { id: true, firstName: true, lastKnownLat: true, lastKnownLng: true }
                });

                const haversine = (lat1, lon1, lat2, lon2) => {
                    const R = 6371; // km
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                };

                for (const u of nearbyUsers) {
                    const dist = haversine(lat, lng, u.lastKnownLat, u.lastKnownLng);
                    if (dist <= 5) { // Notify users within 5km
                        await sendNotification(u.id,
                            `📍 <b>Новое задание рядом!</b>\n\n"${title}"\nНаграда: <b>${executorReward} Stars</b>\nРасстояние: <b>~${dist.toFixed(1)} км</b>\n\nУспейте выполнить первым! @easyquestwork_bot`
                        );
                    }
                }
            } catch (notifyErr) {
                console.error('[Notification] Failed to notify nearby users:', notifyErr.message);
            }

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

            // 2. Pay executor — earnedBalance = WITHDRAWABLE
            const executor = await tx.user.findUnique({ where: { id: task.executorId } });

            await tx.user.update({
                where: { id: task.executorId },
                data: {
                    balance: { increment: task.reward },
                    earnedBalance: { increment: task.reward }, // withdrawable!
                    tasksCompleted: { increment: 1 }           // unlock withdrawal eligibility
                }
            });

            await tx.transaction.create({
                data: { title: `Оплата: ${task.title}`, amount: task.reward, type: 'earn', userId: task.executorId }
            });

            // Handle referral bonus (5% of original reward) — also withdrawable
            if (executor.referredById) {
                const refBonus = Math.max(1, Math.round((task.reward / 0.9) * 0.05));
                await tx.user.update({
                    where: { id: executor.referredById },
                    data: {
                        balance: { increment: refBonus },
                        earnedBalance: { increment: refBonus } // referral bonus = withdrawable
                    }
                });
                await tx.transaction.create({
                    data: { title: `Реф. бонус за ${task.title}`, amount: refBonus, type: 'earn', userId: executor.referredById }
                });

                // Try sending notification to referrer
                try {
                    await sendNotification(executor.referredById, `🎉 <b>Реферальный бонус!</b>\n\nВаш реферал завершил задание. Вам начислен бонус: ${refBonus} Stars ✨`);
                } catch (e) { }
            }

            // 3. Add review & Update rating
            if (rating) {
                await tx.review.create({
                    data: { rating, comment, taskId: task.id, userId: task.executorId }
                });

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
            // Refund the task.reward to bonusBalance to prevent converting bonus to earned via cancel
            await tx.user.update({
                where: { id: task.customerId },
                data: {
                    balance: { increment: task.reward },
                    bonusBalance: { increment: task.reward }
                }
            });
            await tx.transaction.create({ data: { title: `Возврат: ${task.title}`, amount: task.reward, type: 'refund', userId: task.customerId } });
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
    pollMainBot();
    console.log('[AdminBot] Commands listener started. Use /stats, /pending, /approve <id>, /reject <id>');
});

