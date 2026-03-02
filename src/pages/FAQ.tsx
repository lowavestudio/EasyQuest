import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, Search, Rocket, MapPin, Star, ShieldCheck, MessageSquare, Trophy, Zap, HelpCircle } from 'lucide-react';

interface FaqItem {
    q: string;
    a: string;
}

interface FaqSection {
    icon: React.ReactNode;
    title: string;
    color: string;
    items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
    {
        icon: <Rocket size={18} />,
        title: 'Что такое Easy Quest?',
        color: '#3b82f6',
        items: [
            {
                q: 'Для чего создано приложение?',
                a: 'Easy Quest — это платформа для выполнения микрозаданий в реальном мире прямо через Telegram. Заказчики публикуют небольшие задачи рядом с геолокацией — сфотографировать объект, доставить посылку, разместить листовку, проверить магазин, — а исполнители выполняют их и получают вознаграждение в Stars ★.\n\nMission: сделать краудсорсинговые задания быстрыми, прозрачными и доступными для всех.',
            },
            {
                q: 'Кому подходит Easy Quest?',
                a: '• Бизнесу — быстро собрать фото/аудит торговых точек, распространить флаеры, проверить соответствие стандартам.\n• Фрилансерам и студентам — зарабатывать Stars, выполняя задания рядом с домом без оформления.\n• Курьерам и активным людям — монетизировать свои поездки по городу.\n• Всем, кому нужна небольшая помощь рядом — быстро и без лишней бюрократии.',
            },
            {
                q: 'Чем это отличается от обычных бирж?',
                a: 'Классические биржи — это удалённые задания (тексты, дизайн, код). Easy Quest — именно геолокационные, офлайн-задачи в вашем городе. Ключевое отличие:\n\n• Подтверждение через фото с геоданными\n• Моментальная выплата после одобрения\n• Чат с заказчиком прямо в задании\n• Всё внутри Telegram — не нужно устанавливать отдельное приложение',
            },
        ],
    },
    {
        icon: <MapPin size={18} />,
        title: 'Как находить и выполнять задания',
        color: '#10b981',
        items: [
            {
                q: 'Как найти задание рядом со мной?',
                a: 'Откройте вкладку «Лента». На карте вверху вы увидите синие метки — это активные задания рядом с вашей геолокацией. Нажмите на метку или листайте список заданий ниже.\n\nИспользуйте фильтры: Рядом, Доставка, Фото/Видео, Помощь — или введите запрос в строку поиска, чтобы найти конкретное задание.',
            },
            {
                q: 'Как принять задание?',
                a: '1. Нажмите на карточку задания → откроется детальная страница\n2. Ознакомьтесь с описанием, адресом на карте и наградой\n3. Нажмите «Принять задание»\n4. Задание появится у вас во вкладке «Задания → Активные»\n5. Общайтесь с заказчиком через встроенный чат, если нужно',
            },
            {
                q: 'Как сдать задание и получить оплату?',
                a: '1. Выполните задание согласно инструкции\n2. Откройте задание → нажмите «Сдать задание (загрузить фото)»\n3. Сделайте чёткое фото рядом с местом выполнения\n4. Заказчик получит уведомление и проверит отчёт\n5. После одобрения Stars мгновенно поступят на ваш баланс в кошельке\n\n⏱ Старайтесь сдавать в течение 2 часов после принятия.',
            },
            {
                q: 'Можно ли отказаться от задания после принятия?',
                a: 'Да. Откройте задание → «Отказаться от задания». Задание вернётся в ленту и снова станет доступным другим исполнителям. Это не повлияет на ваш рейтинг, если вы не злоупотребляете отказами.\n\nЕсли вы часто отказываетесь без выполнения, это может отразиться на вашем рейтинге.',
            },
        ],
    },
    {
        icon: <Zap size={18} />,
        title: 'Создание заданий (для заказчиков)',
        color: '#f59e0b',
        items: [
            {
                q: 'Как создать задание?',
                a: '1. В профиле переключитесь на роль «Заказчик»\n2. На странице Ленты нажмите синюю кнопку «+» на карте\n3. Выберите категорию, введите название и подробное описание\n4. Укажите точное место — введите адрес в поиск или нажмите на карту\n5. Установите вознаграждение в Stars ★\n6. Нажмите «Опубликовать задание»\n\nСтоимость блокируется с вашего баланса сразу при публикации и возвращается при отмене.',
            },
            {
                q: 'Что писать в описании?',
                a: 'Чем подробнее — тем лучше. Укажите:\n• Что именно нужно сделать (сфотографировать, привезти, проверить)\n• Особые требования (ракурс, количество фото, формат отчёта)\n• Точный адрес или ориентиры\n• Временные ограничения\n\nЗадания с хорошим описанием принимаются быстрее.',
            },
            {
                q: 'Как одобрить работу исполнителя?',
                a: 'Когда исполнитель сдаст отчёт, вы получите уведомление в Telegram. Откройте вкладку «Задания» → найдите задание со статусом «На проверке».\n\nПросмотрите фото и описание. Нажмите «Принять и оплатить», оцените работу от 1 до 5 звёзд и оставьте комментарий. Stars автоматически перейдут исполнителю.',
            },
            {
                q: 'Что если исполнитель сделал плохо?',
                a: 'Вы можете написать в чат и попросить переделать, пока задание на проверке. Если качество неприемлемо — напишите нам через кнопку «Поддержка» в профиле. В спорных ситуациях наши модераторы помогут разобраться.',
            },
        ],
    },
    {
        icon: <Star size={18} />,
        title: 'Stars и кошелёк',
        color: '#f59e0b',
        items: [
            {
                q: 'Что такое Stars ★?',
                a: 'Stars — внутренняя валюта Easy Quest. 1 Star ≈ 0.01 TON ≈ 0.45 ₽ (курс приблизительный).\n\nКак получить Stars:\n• Бонус за регистрацию: 150 ★\n• Выполнение заданий\n• Пополнение через TON-кошелёк',
            },
            {
                q: 'Как пополнить баланс?',
                a: '1. Откройте вкладку «Кошелёк»\n2. Нажмите «Купить Stars»\n3. Подключите TON-кошелёк (TonConnect)\n4. Выберите пакет (10 / 50 / 100 / 250 ★)\n5. Подтвердите транзакцию\n\nStars поступят на баланс сразу после подтверждения блокчейна.',
            },
            {
                q: 'Можно ли вывести Stars?',
                a: 'Функция вывода Stars в TON находится в разработке и появится в ближайшем обновлении. Следите за анонсами в официальном канале.',
            },
        ],
    },
    {
        icon: <ShieldCheck size={18} />,
        title: 'Безопасность и рейтинг',
        color: '#8b5cf6',
        items: [
            {
                q: 'Как работает рейтинг?',
                a: 'Ваш рейтинг (от 1.0 до 5.0★) формируется на основе оценок заказчиков после выполнения заданий. Высокий рейтинг означает надёжного исполнителя и помогает быстрее принимать задания.\n\nВсе отзывы отображаются в вашем профиле.',
            },
            {
                q: 'Что такое верификация?',
                a: 'Верификация подтверждает вашу личность и повышает доверие. Верифицированные исполнители получают значок ✅ в профиле и имеют приоритет при выборе на задания.\n\nДля верификации перейдите: Профиль → Верификация → следуйте инструкциям.',
            },
            {
                q: 'Как вас защищает приложение?',
                a: '• Авторизация только через Telegram (ваш ID уникален)\n• Оплата блокируется на время выполнения и переводится только после одобрения\n• Фотоотчёт с геоданными как доказательство\n• Система отзывов видна всем участникам\n• Чат фиксирует все договорённости',
            },
        ],
    },
    {
        icon: <Trophy size={18} />,
        title: 'Лидерборд и достижения',
        color: '#ef4444',
        items: [
            {
                q: 'Что такое лидерборд?',
                a: 'Топ-20 лучших исполнителей на платформе — по числу выполненных заданий и рейтингу. Откройте Профиль → нажмите иконку 🏆 в правом верхнем углу.\n\nТоп-3 отмечены медалями 🥇🥈🥉. Ваша позиция всегда выделена синим.',
            },
            {
                q: 'Как попасть в топ?',
                a: '1. Выполняйте задания быстро и качественно\n2. Получайте высокие оценки от заказчиков (4-5★)\n3. Не отказывайтесь от принятых заданий\n4. Берите задания регулярно\n\nТоп обновляется в реальном времени.',
            },
        ],
    },
    {
        icon: <MessageSquare size={18} />,
        title: 'Поддержка и контакты',
        color: '#64748b',
        items: [
            {
                q: 'Как связаться с поддержкой?',
                a: 'Напишите нам в Telegram: @EasyQuestSupport\nМы отвечаем в рабочие дни с 9:00 до 21:00 (МСК).\n\nОписывайте проблему подробно — приложите скриншот, ID задания и суть вопроса.',
            },
            {
                q: 'Как оставить пожелание или сообщить об ошибке?',
                a: 'Мы открыты к предложениям! Напишите в @EasyQuestSupport с темой «Предложение» или «Баг». Лучшие идеи от пользователей попадают в следующие обновления.',
            },
        ],
    },
];

const FAQ = () => {
    const navigate = useNavigate();
    const [openKey, setOpenKey] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const toggle = (key: string) => setOpenKey(prev => (prev === key ? null : key));

    const filtered = searchQuery.trim()
        ? FAQ_SECTIONS.map(sec => ({
            ...sec,
            items: sec.items.filter(
                item =>
                    item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.a.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter(sec => sec.items.length > 0)
        : FAQ_SECTIONS;

    return (
        <div className="task-details-page">
            <div className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={22} />
                </button>
                <div className="detail-title">Помощь и FAQ</div>
                <div style={{ width: 36 }} />
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>

                {/* Hero */}
                <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    borderRadius: '20px', padding: '24px 20px', textAlign: 'center', color: 'white',
                }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🚀</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Easy Quest</div>
                    <div style={{ fontSize: '14px', opacity: 0.9, lineHeight: 1.6 }}>
                        Платформа микрозаданий в реальном мире внутри Telegram. Зарабатывайте Stars, выполняя задания рядом с вами.
                    </div>
                </div>

                {/* Search */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'var(--card-bg)', border: '1.5px solid var(--border-color)',
                    borderRadius: '14px', padding: '11px 14px',
                }}>
                    <Search size={16} color="var(--tg-theme-hint-color)" style={{ flexShrink: 0 }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Поиск по FAQ..."
                        style={{
                            flex: 1, border: 'none', background: 'transparent',
                            outline: 'none', fontSize: '14px', color: 'var(--tg-theme-text-color)',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    />
                </div>

                {filtered.length === 0 && (
                    <div className="empty-state" style={{ padding: '24px 0' }}>
                        <div className="empty-state-icon"><HelpCircle size={26} /></div>
                        <div className="empty-state-title">Ничего не найдено</div>
                        <div className="empty-state-text">Попробуйте другой запрос или напишите нам в поддержку</div>
                    </div>
                )}

                {/* Sections */}
                {filtered.map(section => (
                    <div key={section.title}>
                        {/* Section header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            marginBottom: '10px', padding: '0 4px',
                        }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: '8px',
                                background: `${section.color}18`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: section.color, flexShrink: 0,
                            }}>
                                {section.icon}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--tg-theme-text-color)' }}>
                                {section.title}
                            </span>
                        </div>

                        {/* Accordion items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {section.items.map((item, i) => {
                                const key = `${section.title}-${i}`;
                                const isOpen = openKey === key;
                                return (
                                    <div
                                        key={key}
                                        style={{
                                            background: 'var(--card-bg)',
                                            borderRadius: '14px',
                                            border: `1.5px solid ${isOpen ? section.color + '50' : 'var(--border-color)'}`,
                                            overflow: 'hidden',
                                            transition: 'border-color 0.2s',
                                        }}
                                    >
                                        {/* Question row */}
                                        <button
                                            onClick={() => toggle(key)}
                                            style={{
                                                width: '100%', padding: '14px 16px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                                                background: 'transparent', border: 'none', cursor: 'pointer',
                                                textAlign: 'left',
                                            }}
                                        >
                                            <span style={{
                                                fontSize: '14px', fontWeight: 600,
                                                color: 'var(--tg-theme-text-color)', lineHeight: 1.4, flex: 1,
                                            }}>
                                                {item.q}
                                            </span>
                                            <div style={{
                                                flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
                                                background: isOpen ? section.color : 'var(--border-color)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'background 0.2s',
                                            }}>
                                                {isOpen
                                                    ? <ChevronUp size={14} color="white" />
                                                    : <ChevronDown size={14} color="var(--tg-theme-hint-color)" />
                                                }
                                            </div>
                                        </button>

                                        {/* Answer */}
                                        {isOpen && (
                                            <div style={{
                                                padding: '0 16px 16px',
                                                borderTop: `1px solid ${section.color}25`,
                                                animation: 'fadeUp 0.18s ease',
                                            }}>
                                                <div style={{
                                                    paddingTop: '12px',
                                                    fontSize: '13px', lineHeight: 1.7,
                                                    color: 'var(--tg-theme-hint-color)',
                                                    whiteSpace: 'pre-line',
                                                }}>
                                                    {item.a}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Support CTA */}
                <div style={{
                    background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                    borderRadius: '18px', padding: '20px', textAlign: 'center', marginTop: '8px',
                }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>💬</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--tg-theme-text-color)', marginBottom: '6px' }}>
                        Не нашли ответ?
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', marginBottom: '16px', lineHeight: 1.5 }}>
                        Наша поддержка отвечает быстро. Напишите нам в Telegram!
                    </div>
                    <a
                        href="https://t.me/EasyQuestSupport"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            color: 'white', borderRadius: '14px', fontSize: '14px', fontWeight: 700,
                            textDecoration: 'none',
                        }}
                    >
                        <MessageSquare size={16} /> Написать в поддержку
                    </a>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
