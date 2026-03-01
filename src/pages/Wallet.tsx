import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Star, ArrowUpRight, Gift, Minus, RotateCcw, Plus, ChevronRight } from 'lucide-react';
import { useTonConnectUI } from '@tonconnect/ui-react';

const PACKAGES = [
    { stars: 10, amount: '0.1', label: 'Стартовый' },
    { stars: 50, amount: '0.45', label: 'Популярный' },
    { stars: 100, amount: '0.8', label: 'Выгодный' },
];

const Wallet = () => {
    const { balance, transactions, topUp } = useAppStore();
    const [tonConnectUI] = useTonConnectUI();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showTopUp, setShowTopUp] = useState(false);

    const getIcon = (type: string) => {
        switch (type) {
            case 'earn': return <Star size={18} fill="#fbbf24" />;
            case 'bonus': return <Gift size={18} />;
            case 'spend': return <Minus size={18} />;
            case 'refund': return <RotateCcw size={18} />;
            default: return <Star size={18} />;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + ', ' +
            date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };

    const handleTopUp = async (stars: number, tonAmount: string) => {
        if (!tonConnectUI.connected) {
            await tonConnectUI.openModal();
            return;
        }

        setIsProcessing(true);
        try {
            // TON is 9 decimals, so 0.1 TON = 100,000,000 nanoTON
            const nanoAmount = (parseFloat(tonAmount) * 1000000000).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec
                messages: [
                    {
                        address: "UQB6mE_Uf-3-vS8P9p4P-G0-n7-G0-n7-G0-n7-G0-n7-G0-n7", // Placeholder destination
                        amount: nanoAmount,
                    },
                ],
            };

            await tonConnectUI.sendTransaction(transaction);

            // If transaction successful (no error thrown)
            await topUp(stars);
            setShowTopUp(false);
        } catch (e) {
            console.error('TON transaction failed', e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="page-container" style={{ padding: '0', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <div className="top-header">
                <div className="top-header-title">Кошелёк</div>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Balance Card */}
                <div className="wallet-card">
                    <div className="wallet-label">Общий баланс</div>
                    <div className="wallet-amount">
                        {balance} <Star size={32} fill="white" strokeWidth={0} />
                    </div>
                    <div className="wallet-subtext">1 Star ≈ 0.01 TON</div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button className="wallet-action-btn" onClick={() => setShowTopUp(true)} style={{ flex: 1, background: 'rgba(255,255,255,0.2)' }}>
                            <Plus size={18} /> Купить ★
                        </button>
                        <button className="wallet-action-btn" style={{ flex: 1 }}>
                            <ArrowUpRight size={18} /> Вывести
                        </button>
                    </div>
                </div>

                {showTopUp && (
                    <div className="detail-section fade-in" style={{ padding: '16px', border: '1px solid var(--accent-color)' }}>
                        <div className="section-heading">Пополнить баланс</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {PACKAGES.map(pkg => (
                                <button
                                    key={pkg.stars}
                                    className="package-item"
                                    disabled={isProcessing}
                                    onClick={() => handleTopUp(pkg.stars, pkg.amount)}
                                >
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <div style={{ fontWeight: '700', color: 'var(--tg-theme-text-color)' }}>{pkg.stars} ★</div>
                                        <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>{pkg.label}</div>
                                    </div>
                                    <div className="package-price">{pkg.amount} TON</div>
                                    <ChevronRight size={16} />
                                </button>
                            ))}
                        </div>
                        <button className="tg-button secondary" style={{ marginTop: '12px', background: 'transparent' }} onClick={() => setShowTopUp(false)}>
                            Отмена
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--success-color)' }}>
                            {transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0)}
                        </div>
                        <div className="stat-label">Заработано</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--danger-color)' }}>
                            {Math.abs(transactions.filter(t => t.amount < 0).reduce((a, t) => a + t.amount, 0))}
                        </div>
                        <div className="stat-label">Потрачено</div>
                    </div>
                </div>

                {/* Transactions */}
                <div className="section-header" style={{ padding: '0', marginTop: '4px' }}>
                    <div className="section-title">История</div>
                    <div className="badge">{transactions.length}</div>
                </div>

                <div className="detail-section" style={{ padding: '4px 16px', marginBottom: '80px' }}>
                    {transactions.length === 0 ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>
                            Пока нет транзакций
                        </div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className="tx-item">
                                <div className={`tx-icon ${tx.type}`}>
                                    {getIcon(tx.type)}
                                </div>
                                <div className="tx-info">
                                    <div className="tx-title">{tx.title}</div>
                                    <div className="tx-date">{formatDate(tx.createdAt)}</div>
                                </div>
                                <div className={`tx-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                                    {tx.amount >= 0 ? '+' : ''}{tx.amount} ★
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wallet;
