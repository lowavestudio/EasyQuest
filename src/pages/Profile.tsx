import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { UserRound, ShieldCheck, Briefcase, ChevronRight, LogOut, Star, Trophy, HelpCircle, Users, Copy, Settings, Shield } from 'lucide-react';
import { TonConnectButton } from '@tonconnect/ui-react';

interface LeaderboardEntry {
    rank: number;
    id: string;
    firstName: string;
    photoUrl?: string;
    rating: number;
    reviewCount: number;
    completedCount: number;
}

const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#cd7c3e'];

const Profile = () => {
    const { user, role, setRole, balance, tasks, logout, notify } = useAppStore();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [loadingLb, setLoadingLb] = useState(false);

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const activeCount = tasks.filter(t => t.status === 'accepted' || t.status === 'under_review').length;

    const fetchLeaderboard = async () => {
        if (leaderboard.length > 0) { setShowLeaderboard(true); return; }
        setLoadingLb(true);
        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();
            setLeaderboard(data);
            setShowLeaderboard(true);
        } catch {
            setShowLeaderboard(true);
        } finally {
            setLoadingLb(false);
        }
    };

    return (
        <div className="page-container" style={{ padding: '0', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <div className="top-header">
                <div className="top-header-title">Профиль</div>
                <button
                    className="filter-btn"
                    onClick={fetchLeaderboard}
                    title="Лидерборд"
                    style={{ position: 'relative' }}
                >
                    <Trophy size={20} />
                </button>
            </div>

            {/* Leaderboard Panel */}
            {showLeaderboard && (
                <div style={{
                    margin: '0 16px 12px',
                    background: 'var(--card-bg)',
                    borderRadius: '18px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    animation: 'fadeUp 0.25s ease',
                }}>
                    <div style={{
                        padding: '14px 16px 10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid var(--border-color)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800, color: 'var(--tg-theme-text-color)' }}>
                            <Trophy size={16} color="#f59e0b" /> Топ исполнителей
                        </div>
                        <button
                            onClick={() => setShowLeaderboard(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--tg-theme-hint-color)', lineHeight: 1 }}
                        >×</button>
                    </div>

                    {loadingLb ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>Загрузка...</div>
                    ) : leaderboard.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>Пока нет данных</div>
                    ) : (
                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                            {leaderboard.map((entry, i) => {
                                const isMe = entry.id === user?.id;
                                const hasMedal = i < 3;
                                return (
                                    <div key={entry.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 16px',
                                        background: isMe ? 'var(--accent-light)' : 'transparent',
                                        borderBottom: i < leaderboard.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    }}>
                                        {/* Rank */}
                                        <div style={{
                                            width: '26px', textAlign: 'center', flexShrink: 0,
                                            fontWeight: 800, fontSize: hasMedal ? '18px' : '13px',
                                            color: hasMedal ? MEDAL_COLORS[i] : 'var(--tg-theme-hint-color)',
                                        }}>
                                            {hasMedal ? ['🥇', '🥈', '🥉'][i] : entry.rank}
                                        </div>

                                        {/* Avatar */}
                                        {entry.photoUrl ? (
                                            <img src={entry.photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                        ) : (
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                                background: isMe ? 'var(--accent-color)' : 'var(--border-color)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '14px', fontWeight: 800, color: isMe ? 'white' : 'var(--tg-theme-hint-color)',
                                            }}>
                                                {entry.firstName?.charAt(0) || '?'}
                                            </div>
                                        )}

                                        {/* Name + stats */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '14px', fontWeight: 700,
                                                color: isMe ? 'var(--accent-color)' : 'var(--tg-theme-text-color)',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            }}>
                                                {entry.firstName}{isMe ? ' (вы)' : ''}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                                <span>⭐ {entry.rating?.toFixed(1)}</span>
                                                <span>✓ {entry.completedCount} выполнено</span>
                                            </div>
                                        </div>

                                        {/* Badge */}
                                        <div style={{
                                            fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '8px',
                                            background: hasMedal ? `${MEDAL_COLORS[i]}20` : 'var(--border-color)',
                                            color: hasMedal ? MEDAL_COLORS[i] : 'var(--tg-theme-hint-color)',
                                            flexShrink: 0,
                                        }}>
                                            {entry.completedCount} ★
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* User Card */}
                <div className="detail-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
                    {user?.photoUrl ? (
                        <img src={user.photoUrl} alt="Avatar" className="profile-avatar" />
                    ) : (
                        <div className="profile-avatar-placeholder">
                            {user?.firstName?.charAt(0) || 'U'}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--tg-theme-text-color)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {user?.firstName}
                            {user?.verificationStatus === 'verified' && (
                                <ShieldCheck size={18} color="#007aff" fill="#007aff" style={{ color: 'white' }} />
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--star-bg)', color: '#f59e0b', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                                <Star size={12} fill="currentColor" />
                                {user?.rating?.toFixed(1) || '5.0'}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', fontWeight: '500' }}>
                                {user?.reviewCount || 0} отзывов
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="stats-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <div className="stat-value" style={{ color: 'var(--star-color)' }}>{balance}</div>
                        <div className="stat-label">Баланс</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <div className="stat-value">{completedCount}</div>
                        <div className="stat-label">Сдано</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <div className="stat-value" style={{ color: 'var(--accent-color)' }}>{activeCount}</div>
                        <div className="stat-label">Активных</div>
                    </div>
                </div>

                {/* Role Switcher */}
                <div className="detail-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="section-heading" style={{ marginBottom: '0' }}>
                        <ShieldCheck size={18} /> Роль
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', lineHeight: '1.5' }}>
                        Исполнитель зарабатывает звёзды, выполняя задания. Заказчик создаёт задания.
                    </p>
                    <div className="role-toggle">
                        <button onClick={() => setRole('executor')} className={`role-btn ${role === 'executor' ? 'active' : ''}`}>
                            <UserRound size={16} />
                            Исполнитель
                        </button>
                        <button onClick={() => setRole('customer')} className={`role-btn ${role === 'customer' ? 'active' : ''}`}>
                            <Briefcase size={16} />
                            Заказчик
                        </button>
                    </div>
                </div>

                {/* Referrals */}
                <div className="detail-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="section-heading" style={{ marginBottom: '0' }}>
                        <Users size={18} /> Партнёрская программа
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', lineHeight: '1.5' }}>
                        Приглашайте друзей и получайте <b>5%</b> от каждого выполненного ими задания пожизненно!
                    </p>

                    <div style={{ background: 'var(--tg-theme-secondary-bg-color)', border: '1px solid var(--tg-theme-bg-color)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                            <span style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>Ваша ссылка</span>
                            <span style={{ fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>t.me/easyquestwork_bot/app?startapp=ref_{user?.id}</span>
                        </div>
                        <button
                            className="primary-btn"
                            style={{ padding: '8px', minWidth: 'auto', borderRadius: '8px', marginLeft: '12px' }}
                            onClick={() => {
                                navigator.clipboard.writeText(`https://t.me/easyquestwork_bot/app?startapp=ref_${user?.id}`);
                                notify('Ссылка скопирована!', 'success');
                            }}
                        >
                            <Copy size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>Приглашено друзей</span>
                        <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{user?._count?.referrals || 0}</span>
                    </div>
                </div>

                {/* Settings */}
                <div className="detail-section" style={{ padding: '0', overflow: 'hidden' }}>
                    <div className="settings-row">
                        <div className="settings-row-left">
                            <span style={{ color: 'var(--tg-theme-hint-color)' }}>💎</span>
                            <span style={{ fontWeight: '600' }}>TON Кошелёк</span>
                        </div>
                        <TonConnectButton />
                    </div>
                    <div className="settings-row" onClick={() => navigate('/verification')} style={{ cursor: 'pointer' }}>
                        <div className="settings-row-left">
                            <ShieldCheck size={18} color={user?.verificationStatus === 'verified' ? '#007aff' : "var(--tg-theme-hint-color)"} />
                            <span style={{ fontWeight: '600' }}>Верификация</span>
                            {user?.verificationStatus === 'pending' && <span style={{ fontSize: '12px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' }}>В обработке</span>}
                            {user?.verificationStatus === 'verified' && <span style={{ fontSize: '12px', color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' }}>Подтверждено</span>}
                        </div>
                        <ChevronRight size={18} color="var(--tg-theme-hint-color)" />
                    </div>
                    <div className="settings-row" onClick={() => navigate('/faq')} style={{ cursor: 'pointer' }}>
                        <div className="settings-row-left">
                            <HelpCircle size={18} color="var(--tg-theme-hint-color)" />
                            <span style={{ fontWeight: '600' }}>Помощь и FAQ</span>
                        </div>
                        <ChevronRight size={18} color="var(--tg-theme-hint-color)" />
                    </div>
                    <div
                        className="settings-row"
                        style={{ color: 'var(--danger-color)', cursor: 'pointer' }}
                        onClick={() => logout()}
                    >
                        <div className="settings-row-left" style={{ color: 'inherit' }}>
                            <LogOut size={18} />
                            <span style={{ fontWeight: '600' }}>Выйти</span>
                        </div>
                    </div>
                </div>

                {/* Footer Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '20px' }}>
                    {user?.isAdmin && (
                        <div
                            className="settings-row"
                            onClick={() => navigate('/admin')}
                            style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-color)', borderRadius: '12px', cursor: 'pointer' }}
                        >
                            <div className="settings-row-left">
                                <Settings size={18} color="var(--accent-color)" />
                                <span style={{ fontWeight: '700', color: 'var(--accent-color)' }}>АДМИН-ПАНЕЛЬ</span>
                            </div>
                            <ChevronRight size={18} color="var(--accent-color)" />
                        </div>
                    )}

                    <div
                        className="settings-row"
                        onClick={() => navigate('/privacy')}
                        style={{ cursor: 'pointer', opacity: 0.7 }}
                    >
                        <div className="settings-row-left">
                            <Shield size={16} color="var(--tg-theme-hint-color)" />
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>Политика конфиденциальности</span>
                        </div>
                        <ChevronRight size={16} color="var(--tg-theme-hint-color)" />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;
