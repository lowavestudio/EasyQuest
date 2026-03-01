import { useAppStore } from '../store/useAppStore';
import { UserRound, ShieldCheck, Briefcase, ChevronRight, LogOut, Star } from 'lucide-react';
import { TonConnectButton } from '@tonconnect/ui-react';

const Profile = () => {
    const { user, role, setRole, balance, tasks, logout, login } = useAppStore();

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const activeCount = tasks.filter(t => t.status === 'accepted' || t.status === 'under_review').length;

    return (
        <div className="page-container" style={{ padding: '0', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <div className="top-header">
                <div className="top-header-title">Профиль</div>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* User Card */}
                <div className="detail-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
                    {user?.photoUrl ? (
                        <img
                            src={user.photoUrl}
                            alt="Avatar"
                            className="profile-avatar"
                        />
                    ) : (
                        <div className="profile-avatar-placeholder">
                            {user?.firstName?.charAt(0) || 'U'}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--tg-theme-text-color)', letterSpacing: '-0.3px' }}>
                            {user?.firstName}
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
                        <button
                            onClick={() => setRole('executor')}
                            className={`role-btn ${role === 'executor' ? 'active' : ''}`}
                        >
                            <UserRound size={16} />
                            Исполнитель
                        </button>
                        <button
                            onClick={() => setRole('customer')}
                            className={`role-btn ${role === 'customer' ? 'active' : ''}`}
                        >
                            <Briefcase size={16} />
                            Заказчик
                        </button>
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
                    <div className="settings-row">
                        <div className="settings-row-left">
                            <ShieldCheck size={18} color="var(--tg-theme-hint-color)" />
                            <span style={{ fontWeight: '600' }}>Верификация</span>
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

                    {(!window.Telegram?.WebApp?.initData || !window.Telegram?.WebApp?.initDataUnsafe?.user) && (
                        <div className="settings-row" onClick={() => login({ id: user?.id === 'demo123' ? 'demo456' : 'demo123', first_name: user?.id === 'demo123' ? 'Executor Test' : 'Browser User' })} style={{ cursor: 'pointer', borderTop: '1px dashed var(--border-color)' }}>
                            <div className="settings-row-left">
                                <span style={{ color: 'var(--accent-color)' }}>🔄</span>
                                <span style={{ fontWeight: '600' }}>Сменить юзера (Тест)</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Profile;
