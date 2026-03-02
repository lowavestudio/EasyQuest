import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
    Star, ArrowUpRight, Gift, Minus, RotateCcw, Plus,
    ChevronRight, TrendingUp, TrendingDown, Wallet as WalletIcon, X
} from 'lucide-react';
import { useTonConnectUI } from '@tonconnect/ui-react';

const PACKAGES = [
    { stars: 10, ton: '0.10', label: 'Стартовый', badge: null },
    { stars: 50, ton: '0.45', label: 'Популярный', badge: '🔥 Выбор' },
    { stars: 100, ton: '0.80', label: 'Выгодный', badge: '💎 Лучшая цена' },
    { stars: 250, ton: '1.80', label: 'Профи', badge: '⚡ Максимум' },
];

const TX_TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    earn: { label: 'Заработок', color: 'var(--success-color)', bg: 'var(--success-bg)', icon: '⬆' },
    bonus: { label: 'Бонус', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: '🎁' },
    spend: { label: 'Расход', color: 'var(--danger-color)', bg: 'rgba(239,68,68,0.1)', icon: '⬇' },
    refund: { label: 'Возврат', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '↩' },
    topup: { label: 'Пополнение', color: 'var(--accent-color)', bg: 'var(--accent-light)', icon: '💳' },
};

const Wallet = () => {
    const { balance, transactions, topUp } = useAppStore();
    const [tonConnectUI] = useTonConnectUI();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showTopUp, setShowTopUp] = useState(false);
    const [processingPkg, setProcessingPkg] = useState<number | null>(null);

    const earned = useMemo(() => transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0), [transactions]);
    const spent = useMemo(() => Math.abs(transactions.filter(t => t.amount < 0).reduce((a, t) => a + t.amount, 0)), [transactions]);

    // Simple 7-day balance mini chart
    const chartData = useMemo(() => {
        const days: { label: string; balance: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toDateString();
            const dayLabel = d.toLocaleDateString('ru-RU', { weekday: 'short' });
            // Sum up all transactions up to this day
            const runningBalance = transactions
                .filter(t => new Date(t.createdAt) <= d)
                .reduce((sum, t) => sum + t.amount, 0);
            days.push({ label: dayLabel, balance: Math.max(0, runningBalance) });
        }
        return days;
    }, [transactions]);

    const maxVal = Math.max(...chartData.map(d => d.balance), 1);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        if (isToday) return 'Сегодня, ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ', ' +
            d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    const handleTopUp = async (stars: number, tonAmount: string, idx: number) => {
        if (!tonConnectUI.connected) {
            await tonConnectUI.openModal();
            return;
        }
        setIsProcessing(true);
        setProcessingPkg(idx);
        try {
            const nanoAmount = (parseFloat(tonAmount) * 1_000_000_000).toString();
            await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 60,
                messages: [{ address: 'UQB6mE_Uf-3-vS8P9p4P-G0-n7-G0-n7-G0-n7-G0-n7-G0n7', amount: nanoAmount }],
            });
            await topUp(stars);
            setShowTopUp(false);
        } catch (e) {
            console.error('TON tx failed', e);
        } finally {
            setIsProcessing(false);
            setProcessingPkg(null);
        }
    };

    return (
        <div className="page-container" style={{ padding: '0', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <div className="top-header">
                <div className="top-header-title">
                    <div className="header-icon"><WalletIcon size={18} /></div>
                    Кошелёк
                </div>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '90px' }}>

                {/* Balance Card */}
                <div className="wallet-card" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -40, right: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="wallet-label" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.8px', opacity: 0.8 }}>ОБЩИЙ БАЛАНС</div>
                        <div className="wallet-amount" style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-2px', display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                            {balance}
                            <Star size={36} fill="white" strokeWidth={0} />
                        </div>
                        <div className="wallet-subtext" style={{ opacity: 0.75, fontSize: '13px' }}>1 Star ≈ 0.01 TON · ≈ {(balance * 0.01 * 4.5).toFixed(0)} ₽</div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                className="wallet-action-btn"
                                onClick={() => setShowTopUp(true)}
                                style={{ flex: 1, background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                            >
                                <Plus size={17} /> Купить Stars
                            </button>
                            <button
                                className="wallet-action-btn"
                                style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 700, cursor: 'not-allowed' }}
                            >
                                <ArrowUpRight size={17} /> Вывести
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="stats-row">
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '4px' }}>
                            <TrendingUp size={14} color="var(--success-color)" />
                            <span style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)', fontWeight: 600 }}>Заработано</span>
                        </div>
                        <div className="stat-value" style={{ color: 'var(--success-color)', fontSize: '22px' }}>{earned} ★</div>
                    </div>
                    <div className="stat-card" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '4px' }}>
                            <TrendingDown size={14} color="var(--danger-color)" />
                            <span style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)', fontWeight: 600 }}>Потрачено</span>
                        </div>
                        <div className="stat-value" style={{ color: 'var(--danger-color)', fontSize: '22px' }}>{spent} ★</div>
                    </div>
                </div>

                {/* Mini Bar Chart */}
                {transactions.length > 0 && (
                    <div className="detail-section" style={{ padding: '16px' }}>
                        <div className="section-heading" style={{ marginBottom: '16px' }}>📊 Активность за 7 дней</div>
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
                                    💳 Пополнить баланс
                                </div>
                                <button onClick={() => setShowTopUp(false)} style={{ background: 'var(--card-bg)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={16} color="var(--tg-theme-hint-color)" />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {PACKAGES.map((pkg, idx) => (
                                    <button
                                        key={pkg.stars}
                                        onClick={() => handleTopUp(pkg.stars, pkg.ton, idx)}
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
                                                {pkg.stars} Stars
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', marginTop: '2px' }}>
                                                {pkg.label}
                                                {pkg.badge && <span style={{ marginLeft: '8px', background: 'var(--accent-light)', color: 'var(--accent-color)', padding: '1px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{pkg.badge}</span>}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--accent-color)' }}>
                                                {processingPkg === idx ? '...' : `${pkg.ton} TON`}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)' }}>
                                                ≈ {(parseFloat(pkg.ton) * 4.5 * 100).toFixed(0)} ₽
                                            </div>
                                        </div>

                                        <ChevronRight size={16} color="var(--tg-theme-hint-color)" />
                                    </button>
                                ))}
                            </div>

                            <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '12px', color: 'var(--tg-theme-hint-color)', lineHeight: 1.5 }}>
                                Для оплаты требуется TON-кошелёк · Курс TON/₽ приблизительный
                            </div>
                        </div>
                    </div>
                )}

                {/* Transactions */}
                <div className="section-header" style={{ padding: '0', marginTop: '4px' }}>
                    <div className="section-title">История операций</div>
                    <div className="badge">{transactions.length}</div>
                </div>

                <div className="detail-section" style={{ padding: '4px 0' }}>
                    {transactions.length === 0 ? (
                        <div className="empty-state" style={{ padding: '28px 0' }}>
                            <div className="empty-state-icon"><WalletIcon size={26} /></div>
                            <div className="empty-state-title">Пока нет операций</div>
                            <div className="empty-state-text">Здесь будет отображаться история ваших заработков и трат</div>
                        </div>
                    ) : (
                        transactions.map((tx, i) => {
                            const meta = TX_TYPE_META[tx.type] || TX_TYPE_META.earn;
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
