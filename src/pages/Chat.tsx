import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Сегодня';
    if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

const Chat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, messages, fetchMessages, sendMessage, tasks } = useAppStore();
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const task = tasks.find(t => t.id === Number(id));

    useEffect(() => {
        if (id && task && task.status !== 'available') {
            fetchMessages(Number(id));
            const interval = setInterval(() => fetchMessages(Number(id)), 5000);
            return () => clearInterval(interval);
        }
    }, [id, fetchMessages, task]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !id || isSending) return;
        setIsSending(true);
        const text = inputText.trim();
        setInputText('');
        await sendMessage(Number(id), text);
        setIsSending(false);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    if (!task) return null;

    const isParticipant = task.customerId === user?.id || task.executorId === user?.id;
    const canChat = isParticipant && task.status !== 'available';
    const isOwner = task.customerId === user?.id;
    const interlocutorName = isOwner ? 'Исполнитель' : 'Заказчик';

    if (!canChat) {
        return (
            <div className="chat-page">
                <div className="detail-header" style={{ position: 'fixed', top: 0, zIndex: 100 }}>
                    <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={22} /></button>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div className="chat-target-name">Доступ ограничен</div>
                    </div>
                    <div style={{ width: 36 }} />
                </div>
                <div className="chat-empty" style={{ marginTop: '120px' }}>
                    <div className="chat-empty-icon">🔒</div>
                    <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px', color: 'var(--tg-theme-text-color)' }}>Нет доступа</div>
                    <div style={{ color: 'var(--tg-theme-hint-color)', textAlign: 'center', lineHeight: 1.5 }}>
                        Чат доступен только участникам после принятия задания.
                    </div>
                    <button className="tg-button" style={{ marginTop: '24px', width: 'auto', padding: '10px 24px' }} onClick={() => navigate(-1)}>
                        Вернуться
                    </button>
                </div>
            </div>
        );
    }

    // Group messages by date for dividers
    const messagesByDate: { date: string; msgs: typeof messages }[] = [];
    messages.forEach(msg => {
        const dateKey = new Date(msg.createdAt).toDateString();
        const group = messagesByDate.find(g => g.date === dateKey);
        if (group) group.msgs.push(msg);
        else messagesByDate.push({ date: dateKey, msgs: [msg] });
    });

    return (
        <div className="chat-page">
            {/* Header */}
            <div className="detail-header" style={{ position: 'fixed', top: 0, zIndex: 100 }}>
                <button className="back-btn" onClick={() => navigate(-1)}><ChevronLeft size={22} /></button>
                <div style={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
                    <div className="chat-target-name">{interlocutorName}</div>
                    <div className="chat-target-status" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', color: 'var(--tg-theme-hint-color)'
                    }}>
                        <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title}
                        </span>
                    </div>
                </div>
                <div style={{ width: 36 }} />
            </div>

            {/* Messages */}
            <div className="chat-messages" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">💬</div>
                        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--tg-theme-text-color)' }}>Начните общение</div>
                        <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', textAlign: 'center', lineHeight: 1.5 }}>
                            Договоритесь о деталях задания или уточните инструкции
                        </div>
                    </div>
                ) : (
                    messagesByDate.map(group => (
                        <div key={group.date}>
                            {/* Date divider */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                margin: '12px 0', padding: '0 4px',
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tg-theme-hint-color)', whiteSpace: 'nowrap' }}>
                                    {formatDate(group.msgs[0].createdAt)}
                                </span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                            </div>

                            {group.msgs.map((msg, i) => {
                                const isOwn = msg.senderId === user?.id;
                                const prevMsg = i > 0 ? group.msgs[i - 1] : null;
                                const showAvatar = !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId);
                                return (
                                    <div key={msg.id} className={`message-row ${isOwn ? 'own' : 'other'}`}>
                                        {!isOwn && (
                                            <div className="message-avatar" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                                                {msg.sender?.photoUrl ? (
                                                    <img src={msg.sender.photoUrl} alt="" />
                                                ) : (
                                                    <User size={14} />
                                                )}
                                            </div>
                                        )}
                                        <div className="message-bubble-wrapper">
                                            {!isOwn && showAvatar && (
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-color)', marginBottom: '3px', marginLeft: '4px' }}>
                                                    {msg.sender?.firstName || interlocutorName}
                                                </div>
                                            )}
                                            <div className="message-bubble">
                                                {msg.text}
                                                <div className="message-time">{formatTime(msg.createdAt)}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <form className="chat-input-area" onSubmit={handleSend}>
                <input
                    ref={inputRef}
                    type="text"
                    className="chat-input"
                    placeholder="Сообщение..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    disabled={isSending}
                />
                <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!inputText.trim() || isSending}
                    style={{ opacity: inputText.trim() && !isSending ? 1 : 0.5, transition: 'opacity 0.15s' }}
                >
                    <Send size={18} fill={inputText.trim() ? 'white' : 'none'} />
                </button>
            </form>
        </div>
    );
};

export default Chat;
