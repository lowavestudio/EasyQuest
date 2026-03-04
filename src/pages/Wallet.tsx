import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
    Star, ArrowUpRight, Gift, Plus,
    ChevronRight, Wallet as WalletIcon, X
} from 'lucide-react';

const PACKAGES = [
    { stars: 10, ton: '0.10', label: 'Стартовый', badge: null },
    { stars: 50, ton: '0.45', label: 'Популярный', badge: '🔥 Выбор' },
    { stars: 100, ton: '0.80', label: 'Выгодный', badge: '💎 Лучшая цена' },
    { stars: 250, ton: '1.80', label: 'Профи', badge: '⚡ Максимум' },
];



const Wallet = () => {
    const { balance, user, transactions, buyStars, withdraw, t, language } = useAppStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showTopUp, setShowTopUp] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [processingPkg, setProcessingPkg] = useState<number | null>(null);

    const walletT = t('wallet');
    const commonT = t('common');

    const txTypeMeta: Record<string, { label: string; color: string; bg: string; icon: string }> = {
        earn: { label: language === 'ru' ? 'Заработок' : 'Earning', color: 'var(--success-color)', bg: 'var(--success-bg)', icon: '⬆' },
        bonus: { label: language === 'ru' ? 'Бонус' : 'Bonus', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: '🎁' },
        spend: { label: language === 'ru' ? 'Расход' : 'Expense', color: 'var(--danger-color)', bg: 'rgba(239,68,68,0.1)', icon: '⬇' },
        refund: { label: language === 'ru' ? 'Возврат' : 'Refund', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '↩' },
        topup: { label: language === 'ru' ? 'Пополнение' : 'Top up', color: 'var(--accent-color)', bg: 'var(--accent-light)', icon: '💳' },
        withdraw: { label: language === 'ru' ? 'Вывод' : 'Withdraw', color: 'var(--warning-color)', bg: 'rgba(245,158,11,0.12)', icon: '💸' },
    };

    // Simple 7-day balance mini chart
    const chartData = useMemo(() => {
        const days: { label: string; balance: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayLabel = d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' });
            // Sum up all transactions up to this day
            const runningBalance = transactions
                .filter(t => new Date(t.createdAt) <= d)
                .reduce((sum, t) => sum + t.amount, 0);
            days.push({ label: dayLabel, balance: Math.max(0, runningBalance) });
        }
        return days;
    }, [transactions, language]);

    const maxVal = Math.max(...chartData.map(d => d.balance), 1);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        const locale = language === 'ru' ? 'ru-RU' : 'en-US';
        if (isToday) return (language === 'ru' ? 'Сегодня, ' : 'Today, ') + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) + ', ' +
            d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    };

    const handleBuyStars = async (stars: number, idx: number) => {
        setIsProcessing(true);
        setProcessingPkg(idx);
        try {
            await buyStars(stars);
            setShowTopUp(false);
        } catch (e) {
            console.error('Failed to buy stars', e);
        } finally {
            setIsProcessing(false);
            setProcessingPkg(null);
        }
    };

    const handleWithdraw = async () => {
        const amt = parseInt(withdrawAmount);
        if (isNaN(amt) || amt < 100) return;
        if (!withdrawAddress) return;

        setIsProcessing(true);
        try {
            await withdraw(amt, withdrawAddress);
            setShowWithdraw(false);
            setWithdrawAmount('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="page-container" style={{ padding: '0', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <div className="top-header">
                <div className="top-header-title">
                    <div className="header-icon"><WalletIcon size={18} /></div>
                    {walletT.title}
                </div>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '90px' }}>

                {/* Balance Card */}
                <div className="wallet-card" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -40, right: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="wallet-label" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.8px', opacity: 0.8 }}>{walletT.total_balance}</div>
                        <div className="wallet-amount" style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-2px', display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                            {balance}
                            <Star size={36} fill="white" strokeWidth={0} />
                        </div>
                        <div className="wallet-subtext" style={{ opacity: 0.75, fontSize: '13px' }}>1 Star ≈ 0.01 TON</div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                className="wallet-action-btn"
                                onClick={() => setShowTopUp(true)}
                                style={{ flex: 1, background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)', border: 'none', borderRadius: '12px', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                <Plus size={17} /> {walletT.buy_stars}
                            </button>
                            <button
                                className="wallet-action-btn"
                                onClick={() => setShowWithdraw(true)}
                                style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                <ArrowUpRight size={17} /> {walletT.withdraw}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub-balances Row */}
                <div className="stats-row" style={{ marginTop: '0px' }}>
                    <div className="stat-card" style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={12} fill="var(--warning-color)" color="var(--warning-color)" /> {walletT.available_withdraw}
                        </div>
                        <div className="stat-value" style={{ fontSize: '18px', color: 'var(--tg-theme-text-color)' }}>{user?.earnedBalance ?? 0} ★</div>
                    </div>
                    <div className="stat-card" style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Gift size={12} color="#8b5cf6" /> {walletT.bonuses}
                        </div>
                        <div className="stat-value" style={{ fontSize: '18px', color: 'var(--tg-theme-text-color)' }}>{user?.bonusBalance ?? 0} ★</div>
                    </div>
                </div>

                {/* Mini Bar Chart */}
                {transactions.length > 0 && (
                    <div className="detail-section" style={{ padding: '16px' }}>
                        <div className="section-heading" style={{ marginBottom: '16px' }}>📊 {walletT.activity_7d}</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '60px' }}>
                            {chartData.map((d, i) => {
                                const h = maxVal > 0 ? Math.max(4, (d.balance / maxVal) * 56) : 4;
                                const isToday = i === chartData.length - 1;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                        <div style={{
                                            width: '100%', height: `${h}px`,
                                            background: isToday ? 'var(--accent-color)' : 'var(--border-color)',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.4s ease',
                                            opacity: isToday ? 1 : 0.6,
                                        }} />
                                        <span style={{ fontSize: '9px', color: 'var(--tg-theme-hint-color)', fontWeight: isToday ? 700 : 500 }}>
                                            {d.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Top-Up Modal */}
                {showTopUp && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 200,
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'flex-end',
                    }} onClick={(e) => e.target === e.currentTarget && setShowTopUp(false)}>
                        <div style={{
                            width: '100%', background: 'var(--tg-theme-bg-color)',
                            borderRadius: '24px 24px 0 0', padding: '20px 16px 32px',
                            animation: 'fadeUp 0.25s ease',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--tg-theme-text-color)' }}>
                                    💳 {walletT.topup_modal.title}
                                </div>
                                <button onClick={() => setShowTopUp(false)} style={{ background: 'var(--card-bg)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={16} color="var(--tg-theme-hint-color)" />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {PACKAGES.map((pkg, idx) => (
                                    <button
                                        key={pkg.stars}
                                        onClick={() => handleBuyStars(pkg.stars, idx)}
                                        disabled={isProcessing}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            padding: '14px 16px', borderRadius: '16px',
                                            background: processingPkg === idx ? 'var(--accent-light)' : 'var(--card-bg)',
                                            border: `1.5px solid ${processingPkg === idx ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.18s',
                                            opacity: isProcessing && processingPkg !== idx ? 0.5 : 1,
                                        }}
                                    >
                                        {/* Stars amount */}
                                        <div style={{
                                            width: 46, height: 46, borderRadius: '12px',
                                            background: 'var(--star-bg)', display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <Star size={16} fill="#f59e0b" color="#f59e0b" />
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', marginTop: '1px' }}>{pkg.stars}</span>
                                        </div>

                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--tg-theme-text-color)' }}>
                                                {pkg.stars} {commonT.stars}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', marginTop: '2px' }}>
                                                {language === 'ru' ? pkg.label : (idx === 0 ? 'Starter' : idx === 1 ? 'Popular' : idx === 2 ? 'Best Value' : 'Pro')}
                                                {pkg.badge && <span style={{ marginLeft: '8px', background: 'var(--accent-light)', color: 'var(--accent-color)', padding: '1px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{language === 'ru' ? pkg.badge : (idx === 1 ? '🔥 Choice' : idx === 2 ? '💎 Best' : '⚡ Max')}</span>}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--accent-color)' }}>
                                                {processingPkg === idx ? '...' : `${pkg.ton} TON`}
                                            </div>
                                        </div>

                                        <ChevronRight size={16} color="var(--tg-theme-hint-color)" />
                                    </button>
                                ))}
                            </div>

                            <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '12px', color: 'var(--tg-theme-hint-color)', lineHeight: 1.5 }}>
                                {walletT.topup_modal.official_tg}
                            </div>
                        </div>
                    </div>
                )}

                {/* Withdraw Modal */}
                {showWithdraw && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 200,
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'flex-end',
                    }} onClick={(e) => e.target === e.currentTarget && setShowWithdraw(false)}>
                        <div style={{
                            width: '100%', background: 'var(--tg-theme-bg-color)',
                            borderRadius: '24px 24px 0 0', padding: '20px 16px 32px',
                            animation: 'fadeUp 0.25s ease',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--tg-theme-text-color)' }}>
                                    💸 {walletT.withdraw_modal.title}
                                </div>
                                <button onClick={() => setShowWithdraw(false)} style={{ background: 'var(--card-bg)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={16} color="var(--tg-theme-hint-color)" />
                                </button>
                            </div>

                            {user && user.tasksCompleted < 0 ? (
                                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '14px', color: '#ef4444', fontSize: '14px', lineHeight: 1.5 }}>
                                    {walletT.withdraw_modal.min_tasks} {language === 'ru' ? 'Вы выполнили:' : 'You completed:'} {user.tasksCompleted}.
                                </div>
                            ) : user && user.earnedBalance < 100 ? (
                                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '14px', color: '#ef4444', fontSize: '14px', lineHeight: 1.5 }}>
                                    {walletT.withdraw_modal.min_amount} {language === 'ru' ? 'У вас:' : 'You have:'} {user.earnedBalance} {commonT.stars}.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)' }}>
                                        {language === 'ru' ? 'Доступно для вывода:' : 'Available to withdraw:'} <b style={{ color: 'var(--tg-theme-text-color)' }}>{user?.earnedBalance} ★</b>
                                    </div>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tg-theme-text-color)' }}>{walletT.withdraw_modal.amount_label}</span>
                                        <input
                                            type="number"
                                            placeholder={language === 'ru' ? 'Минимум 100' : 'Min 100'}
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            style={{ padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--tg-theme-text-color)', fontSize: '16px', outline: 'none' }}
                                        />
                                    </label>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tg-theme-text-color)' }}>{walletT.withdraw_modal.address_label}</span>
                                        <input
                                            type="text"
                                            placeholder="EQD..."
                                            value={withdrawAddress}
                                            onChange={(e) => setWithdrawAddress(e.target.value)}
                                            style={{ padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--tg-theme-text-color)', fontSize: '16px', outline: 'none' }}
                                        />
                                    </label>
                                    <button
                                        className="tg-button"
                                        style={{ marginTop: '10px' }}
                                        onClick={handleWithdraw}
                                        disabled={isProcessing || !withdrawAmount || !withdrawAddress || parseInt(withdrawAmount) < 100 || parseInt(withdrawAmount) > (user?.earnedBalance ?? 0)}
                                    >
                                        {isProcessing ? (language === 'ru' ? 'Обработка...' : 'Processing...') : walletT.withdraw_modal.button}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Transactions */}
                <div className="section-header" style={{ padding: '0', marginTop: '4px' }}>
                    <div className="section-title">{walletT.history}</div>
                    <div className="badge">{transactions.length}</div>
                </div>

                <div className="detail-section" style={{ padding: '4px 0' }}>
                    {transactions.length === 0 ? (
                        <div className="empty-state" style={{ padding: '28px 0' }}>
                            <div className="empty-state-icon"><WalletIcon size={26} /></div>
                            <div className="empty-state-title">{walletT.no_history}</div>
                            <div className="empty-state-text">{walletT.no_history_text}</div>
                        </div>
                    ) : (
                        transactions.map((tx, i) => {
                            const meta = txTypeMeta[tx.type] || txTypeMeta.earn;
                            const isPositive = tx.amount >= 0;
                            return (
                                <div key={tx.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    padding: '12px 16px',
                                    borderBottom: i < transactions.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    animation: 'fadeUp 0.25s ease',
                                }}>
                                    {/* Icon */}
                                    <div style={{
                                        width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
                                        background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px',
                                    }}>
                                        {meta.icon}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tg-theme-text-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {tx.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', marginTop: '2px' }}>
                                            {formatDate(tx.createdAt)} · {meta.label}
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div style={{
                                        fontWeight: 800, fontSize: '16px', flexShrink: 0,
                                        color: isPositive ? 'var(--success-color)' : 'var(--danger-color)',
                                    }}>
                                        {isPositive ? '+' : ''}{tx.amount} ★
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wallet;
