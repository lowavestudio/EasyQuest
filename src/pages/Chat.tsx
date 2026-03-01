import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const Chat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, messages, fetchMessages, sendMessage, tasks } = useAppStore();
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

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
        if (!inputText.trim() || !id) return;

        const text = inputText;
        setInputText('');
        await sendMessage(Number(id), text);
    };

    if (!task) return null;

    // Validation: only executor or customer can chat, and only if accepted/reviewed
    const isParticipant = task.customerId === user?.id || task.executorId === user?.id;
    const canChat = isParticipant && task.status !== 'available';

    if (!canChat) {
        return (
            <div className="chat-page">
                <div className="detail-header" style={{ position: 'fixed', top: 0, zIndex: 100 }}>
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ChevronLeft size={22} />
                    </button>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div className="chat-target-name">Доступ ограничен</div>
                    </div>
                    <div style={{ width: 36 }} />
                </div>
                <div className="chat-empty" style={{ marginTop: '120px' }}>
                    <div className="chat-empty-icon">🔒</div>
                    <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px', color: 'var(--tg-theme-text-color)' }}>Нет доступа</div>
                    <div style={{ color: 'var(--tg-theme-hint-color)' }}>Этот чат доступен только участникам задания после его принятия.</div>
                    <button
                        className="tg-button"
                        style={{ marginTop: '24px', width: 'auto', padding: '10px 24px' }}
                        onClick={() => navigate(-1)}
                    >
                        Вернуться
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-page">
            <div className="detail-header" style={{ position: 'fixed', top: 0, zIndex: 100 }}>
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={22} />
                </button>
                <div style={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
                    <div className="chat-target-name">{task.title}</div>
                    <div className="chat-target-status">Рабочий чат</div>
                </div>
                <div style={{ width: 36 }} />
            </div>

            <div className="chat-messages" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">💬</div>
                        <div>Напишите сообщение, чтобы начать обсуждение</div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.senderId === user?.id;
                        return (
                            <div key={msg.id} className={`message-row ${isOwn ? 'own' : 'other'}`}>
                                {!isOwn && (
                                    <div className="message-avatar">
                                        {msg.sender.photoUrl ? (
                                            <img src={msg.sender.photoUrl} alt="" />
                                        ) : (
                                            <User size={14} />
                                        )}
                                    </div>
                                )}
                                <div className="message-bubble-wrapper">
                                    <div className="message-bubble">
                                        {msg.text}
                                        <div className="message-time">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Сообщение..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}>
                    <Send size={18} fill={inputText.trim() ? "white" : "none"} />
                </button>
            </form>
        </div>
    );
};

export default Chat;
