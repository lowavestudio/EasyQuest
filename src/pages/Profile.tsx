import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { UserRound, ShieldCheck, Briefcase, ChevronRight, LogOut, Star, HelpCircle, Users, Settings, Shield } from 'lucide-react';
import { TonConnectButton } from '@tonconnect/ui-react';



const Profile = () => {
    const { user, balance, setRole, role, t, language, setLanguage, logout, notify } = useAppStore();
    const navigate = useNavigate();

    const profileT = t('profile');

    const activeTaskCount = useAppStore(s => s.tasks.filter(t => (t.status === 'accepted' || t.status === 'under_review') && t.executorId === user?.id).length);

    return (
        <div className="page-container" style={{ padding: '0', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <div className="top-header">
                <div className="top-header-title">{profileT.title}</div>
                <div style={{ width: 36 }} />
            </div>

            <div style={{ padding: '0 16px 110px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="profile-card">
                    <img src={user?.photoUrl || `https://ui-avatars.com/api/?name=${user?.firstName}&background=random`} alt="" className="profile-avatar" />
                    <div className="profile-info">
                        <div className="profile-name">{user?.firstName} {user?.verificationStatus === 'verified' && <ShieldCheck size={16} color="var(--accent-color)" fill="var(--accent-color)" />}</div>
                        <div className="profile-rating">
                            <Star size={14} fill="var(--star-color)" color="var(--star-color)" />
                            <span>{user?.rating}</span>
                            <span style={{ opacity: 0.6 }}>• {user?.reviewCount} {profileT.reviews}</span>
                        </div>
                    </div>
                </div>

                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-value">{balance}</div>
                        <div className="stat-label">{profileT.balance}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{user?.tasksCompleted || 0}</div>
                        <div className="stat-label">{profileT.completed}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{activeTaskCount}</div>
                        <div className="stat-label">{profileT.active}</div>
                    </div>
                </div>

                <div className="detail-section">
                    <div className="section-heading">
                        <Users size={18} /> {profileT.role_label}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', marginBottom: '16px' }}>
                        {profileT.role_desc}
                    </p>
                    <div className="role-switcher">
                        <button
                            className={`role-btn ${role === 'executor' ? 'active' : ''}`}
                            onClick={() => setRole('executor')}
                        >
                            <UserRound size={18} /> {profileT.role_executor}
                        </button>
                        <button
                            className={`role-btn ${role === 'customer' ? 'active' : ''}`}
                            onClick={() => setRole('customer')}
                        >
                            <Briefcase size={18} /> {profileT.role_customer}
                        </button>
                    </div>
                </div>

                {/* Referral Link */}
                <div className="detail-section">
                    <div className="section-heading">
                        <Users size={18} /> {profileT.referral_title}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', marginBottom: '14px' }}>
                        {profileT.referral_desc}
                    </p>
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>
                            t.me/easyquestwork_bot?start=ref_{user?.id}
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`https://t.me/easyquestwork_bot?start=ref_${user?.id}`);
                                notify(profileT.copied, 'success');
                            }}
                            style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            {profileT.copy}
                        </button>
                    </div>
                </div>

                {/* Settings list */}
                <div className="detail-section" style={{ padding: '8px 0' }}>
                    <div style={{ padding: '0 16px 8px', fontSize: '12px', fontWeight: 700, color: 'var(--tg-theme-hint-color)', letterSpacing: '0.5px' }}>
                        {profileT.settings.toUpperCase()}
                    </div>

                    <div className="settings-row" onClick={() => navigate('/faq')}>
                        <div className="settings-row-left">
                            <HelpCircle size={18} color="var(--warning-color)" />
                            <span>{profileT.help}</span>
                        </div>
                        <ChevronRight size={18} />
                    </div>

                    <a href="https://t.me/easyquestwork_group" target="_blank" rel="noopener noreferrer" className="settings-row" style={{ textDecoration: 'none' }}>
                        <div className="settings-row-left">
                            <Users size={18} color="#3b82f6" />
                            <span>{profileT.community}</span>
                        </div>
                        <ChevronRight size={18} />
                    </a>

                    <div className="settings-row" onClick={() => navigate('/verification')}>
                        <div className="settings-row-left">
                            <ShieldCheck size={18} color="var(--success-color)" />
                            <span>{profileT.verification}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge" style={{
                                background: user?.verificationStatus === 'verified' ? 'var(--success-bg)' :
                                    user?.verificationStatus === 'pending' ? 'var(--warning-bg)' : 'var(--card-bg)',
                                color: user?.verificationStatus === 'verified' ? 'var(--success-color)' :
                                    user?.verificationStatus === 'pending' ? 'var(--warning-color)' : 'var(--tg-theme-hint-color)'
                            }}>
                                {user?.verificationStatus === 'verified' ? profileT.status.verified :
                                    user?.verificationStatus === 'pending' ? profileT.status.pending : profileT.status.none}
                            </span>
                            <ChevronRight size={18} />
                        </div>
                    </div>

                    {/* Language Switcher */}
                    <div className="settings-row" onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}>
                        <div className="settings-row-left">
                            <span style={{ fontSize: '18px' }}>{language === 'ru' ? '🇷🇺' : '🇺🇸'}</span>
                            <span>{language === 'ru' ? 'Русский' : 'English'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', fontWeight: 600 }}>{language === 'ru' ? 'RU' : 'EN'}</span>
                            <ChevronRight size={18} />
                        </div>
                    </div>

                    <div className="settings-row">
                        <div className="settings-row-left">
                            <span style={{ color: 'var(--tg-theme-hint-color)' }}>💎</span>
                            <span style={{ fontWeight: '600' }}>{profileT.wallet_connect}</span>
                        </div>
                        <TonConnectButton />
                    </div>

                    <div
                        className="settings-row"
                        style={{ color: 'var(--danger-color)', cursor: 'pointer' }}
                        onClick={() => logout()}
                    >
                        <div className="settings-row-left" style={{ color: 'inherit' }}>
                            <LogOut size={18} />
                            <span style={{ fontWeight: '600' }}>{profileT.logout}</span>
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
                                <span style={{ fontWeight: '700', color: 'var(--accent-color)' }}>{profileT.admin_panel}</span>
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
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{profileT.privacy}</span>
                        </div>
                        <ChevronRight size={16} color="var(--tg-theme-hint-color)" />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;
