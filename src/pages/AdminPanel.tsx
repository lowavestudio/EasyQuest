import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ArrowLeft, Users, CheckCircle, BarChart3, Megaphone, Send, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminStats {
    userCount: number;
    taskCount: number;
    totalStars: number;
    pendingVerif: number;
}

const AdminPanel = () => {
    const { user, notify } = useAppStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);

    useEffect(() => {
        if (!user?.isAdmin) {
            navigate('/feed');
            return;
        }

        fetchStats();
    }, [user, navigate]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats', {
                headers: { 'x-admin-id': user?.id || '' }
            });
            const data = await res.json();
            setStats(data);
        } catch (e) {
            notify('Ошибка загрузки статистики', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setBroadcasting(true);
        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-id': user?.id || ''
                },
                body: JSON.stringify({ message: broadcastMsg })
            });
            const data = await res.json();
            if (data.success) {
                notify(`Рассылка завершена! Отправлено: ${data.sent}`, 'success');
                setBroadcastMsg('');
            }
        } catch (e) {
            notify('Ошибка рассылки', 'error');
        } finally {
            setBroadcasting(false);
        }
    };

    if (loading) return <div className="page-container">Загрузка данных админа...</div>;

    return (
        <div className="page-container" style={{ padding: '0', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <div className="top-header">
                <button className="back-btn" onClick={() => navigate('/profile')}>
                    <ArrowLeft size={18} />
                </button>
                <div className="top-header-title">Панель Управления</div>
                <div style={{ width: 36 }} />
            </div>

            <div style={{ padding: '0 16px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'
                }}>
                    <div className="detail-card" style={{ padding: '16px', gap: '8px' }}>
                        <div style={{ color: 'var(--accent-color)', opacity: 0.8 }}><Users size={20} /></div>
                        <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats?.userCount}</div>
                        <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)', fontWeight: 700 }}>ПОЛЬЗОВАТЕЛЕЙ</div>
                    </div>
                    <div className="detail-card" style={{ padding: '16px', gap: '8px' }}>
                        <div style={{ color: 'var(--success-color)', opacity: 0.8 }}><CheckCircle size={20} /></div>
                        <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats?.taskCount}</div>
                        <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)', fontWeight: 700 }}>ВЫПОЛНЕНО</div>
                    </div>
                    <div className="detail-card" style={{ padding: '16px', gap: '8px' }}>
                        <div style={{ color: 'var(--star-color)', opacity: 0.8 }}><BarChart3 size={20} /></div>
                        <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats?.totalStars}</div>
                        <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)', fontWeight: 700 }}>ЗВЕЗД В СИСТЕМЕ</div>
                    </div>
                    <div className="detail-card" style={{ padding: '16px', gap: '8px' }}>
                        <div style={{ color: '#f59e0b', opacity: 0.8 }}><ShieldAlert size={20} /></div>
                        <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats?.pendingVerif}</div>
                        <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)', fontWeight: 700 }}>ЖДУТ ПРОВЕРКИ</div>
                    </div>
                </div>

                {/* Broadcast Section */}
                <div className="detail-section">
                    <div className="section-heading">
                        <Megaphone size={18} /> Массовая рассылка
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', marginBottom: '12px' }}>
                        Сообщение будет отправлено всем зарегистрированным пользователям напрямую в бот.
                    </p>
                    <textarea
                        className="form-input"
                        rows={4}
                        placeholder="Введите текст сообщения..."
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        style={{ resize: 'none', marginBottom: '14px' }}
                    />
                    <button
                        className="tg-button"
                        onClick={handleBroadcast}
                        disabled={broadcasting || !broadcastMsg.trim()}
                    >
                        {broadcasting ? 'Отправка...' : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Send size={18} /> Отправить всем
                            </div>
                        )}
                    </button>
                </div>

                {/* Quick Info */}
                <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-color)', borderRadius: '16px', padding: '16px', color: 'var(--accent-color)' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>💡 Совет CTO</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.5, fontWeight: 500 }}>
                        Используйте рассылки аккуратно, чтобы пользователи не блокировали бота. Лучше всего сообщать о новых крупных заданиях или важных обновлениях системы.
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminPanel;
