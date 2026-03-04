import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Clock, Camera, ClipboardList, XCircle, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import { CATEGORY_META } from './Feed';

const TASK_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

function formatTime(ms: number): string {
    if (ms <= 0) return '00:00:00';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getTimerState(ms: number): 'active' | 'warning' | 'danger' {
    if (ms <= 600000) return 'danger';
    if (ms <= 1800000) return 'warning';
    return 'active';
}

const MyTasks = () => {
    const { tasks, user, completeTask, abandonTask, fetchMyTasks, uploadPhoto, notify, t } = useAppStore();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const selectedTaskId = useRef<number | null>(null);
    const [, forceUpdate] = useState(0);
    const [abandonModalTaskId, setAbandonModalTaskId] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const mtT = t('my_tasks');
    const commonT = t('common');
    const feedT = t('feed');

    const activeTasks = tasks.filter(t => t.status === 'accepted' || t.status === 'under_review');
    const historyTasks = tasks.filter(t =>
        t.status === 'completed' || t.status === 'cancelled'
    );

    useEffect(() => {
        fetchMyTasks();
        const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
        return () => clearInterval(interval);
    }, [fetchMyTasks]);

    const handleCompleteClick = (e: React.MouseEvent, taskId: number) => {
        e.stopPropagation();
        selectedTaskId.current = taskId;
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && selectedTaskId.current) {
            const taskId = selectedTaskId.current;
            const file = e.target.files[0];
            try {
                setIsUploading(taskId);
                const photoUrl = await uploadPhoto(file);
                if (photoUrl) {
                    await completeTask(taskId, photoUrl);
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                    }
                }
            } catch (err) {
                notify(commonT.error, 'error');
            } finally {
                setIsUploading(null);
                e.target.value = '';
            }
        }
    };

    const handleAbandonClick = (e: React.MouseEvent, taskId: number) => {
        e.stopPropagation();
        setAbandonModalTaskId(taskId);
    };

    const confirmAbandon = async () => {
        if (abandonModalTaskId) {
            await abandonTask(abandonModalTaskId);
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
            }
        }
        setAbandonModalTaskId(null);
    };

    const getRemainingMs = (acceptedAt?: string) => {
        if (!acceptedAt) return TASK_DURATION_MS;
        const acceptedDate = new Date(acceptedAt).getTime();
        return Math.max(0, TASK_DURATION_MS - (Date.now() - acceptedDate));
    };

    return (
        <div className="page-container" style={{ padding: '0', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <div className="top-header">
                <div className="top-header-title">{mtT.title}</div>
                <div className="badge">{activeTasks.length}</div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                margin: '0 16px 12px',
                background: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '4px',
                border: '1px solid var(--border-color)',
                gap: '4px',
            }}>
                {(['active', 'history'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            padding: '9px',
                            borderRadius: '9px',
                            border: 'none',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                            background: activeTab === tab ? 'var(--accent-gradient)' : 'transparent',
                            color: activeTab === tab ? 'white' : 'var(--tg-theme-hint-color)',
                            boxShadow: activeTab === tab ? 'var(--shadow-accent)' : 'none',
                        }}
                    >
                        {tab === 'active' ? `${mtT.tabs.active} (${activeTasks.length})` : `${mtT.tabs.history} (${historyTasks.length})`}
                    </button>
                ))}
            </div>

            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            <div className="task-feed" style={{ padding: '0 16px 16px', marginBottom: '80px' }}>
                {/* ACTIVE TAB */}
                {activeTab === 'active' && (
                    activeTasks.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <ClipboardList size={28} />
                            </div>
                            <div className="empty-state-title">{mtT.empty_active_title}</div>
                            <div className="empty-state-text">
                                {mtT.empty_active_text}
                            </div>
                            <button
                                className="tg-button"
                                style={{ marginTop: '12px', width: 'auto', padding: '12px 28px', fontSize: '15px' }}
                                onClick={() => navigate('/feed')}
                            >
                                {mtT.find_tasks}
                            </button>
                        </div>
                    ) : (
                        activeTasks.map((task, i) => {
                            const remaining = getRemainingMs(task.acceptedAt);
                            const timerState = getTimerState(remaining);
                            const isReviewing = task.status === 'under_review';
                            const uploading = isUploading === task.id;
                            const catMeta = CATEGORY_META[task.category || 'other'] || CATEGORY_META.other;
                            const CatIcon = catMeta.Icon;

                            return (
                                <div
                                    key={task.id}
                                    className="task-card fade-up"
                                    style={{ animationDelay: `${i * 0.05}s`, ...(isReviewing ? { opacity: 0.8 } : {}), flexWrap: 'wrap' }}
                                    onClick={() => navigate(`/task/${task.id}`)}
                                >
                                    <div className="task-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                fontSize: '10px', fontWeight: 700,
                                                padding: '3px 8px', borderRadius: '6px',
                                                background: catMeta.bg, color: catMeta.color,
                                            }}>
                                                <CatIcon size={10} />
                                                {feedT.chips[(task.category || 'other') as keyof typeof feedT.chips] || catMeta.label}
                                            </span>
                                        </div>
                                        <div className="task-title">{task.title}</div>
                                        <div className="task-meta">
                                            {isReviewing ? (
                                                <span className="status-badge reviewing">{mtT.status.reviewing}</span>
                                            ) : (
                                                <span className={`timer-badge ${timerState}`}>
                                                    <Clock size={12} /> {formatTime(remaining)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="task-reward-box" style={{ justifyContent: 'center', gap: '8px' }}>
                                        {task.status === 'accepted' ? (
                                            <>
                                                <button
                                                    className="tg-button"
                                                    disabled={uploading}
                                                    style={{ padding: '9px 14px', fontSize: '13px', borderRadius: '10px', minWidth: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                    onClick={(e) => handleCompleteClick(e, task.id)}
                                                >
                                                    {uploading ? <Loader2 size={14} className="spin-anim" /> : <Camera size={14} />}
                                                    {uploading ? mtT.actions.uploading : mtT.actions.submit}
                                                </button>
                                                <button
                                                    disabled={uploading}
                                                    style={{
                                                        padding: '7px 14px', fontSize: '12px', borderRadius: '8px',
                                                        border: '1px solid var(--border-color)', background: 'transparent',
                                                        color: 'var(--danger-color)', fontWeight: '600', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                        fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
                                                        opacity: uploading ? 0.5 : 1
                                                    }}
                                                    onClick={(e) => handleAbandonClick(e, task.id)}
                                                >
                                                    <XCircle size={12} /> {mtT.actions.abandon}
                                                </button>
                                            </>
                                        ) : (
                                            task.paymentType === 'cash' ? (
                                                <div className="reward-badge" style={{ fontSize: '13px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                    {task.cashAmount} 💵
                                                </div>
                                            ) : (
                                                <div className="reward-badge" style={{ fontSize: '13px' }}>
                                                    +{task.reward} ★
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    historyTasks.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <CheckCircle2 size={28} />
                            </div>
                            <div className="empty-state-title">{mtT.empty_history_title}</div>
                            <div className="empty-state-text">
                                {mtT.empty_history_text}
                            </div>
                        </div>
                    ) : (
                        historyTasks.map((task, i) => {
                            const isCompleted = task.status === 'completed';
                            const isCustomer = task.customerId === user?.id;
                            const catMeta = CATEGORY_META[task.category || 'other'] || CATEGORY_META.other;
                            const CatIcon = catMeta.Icon;

                            return (
                                <div
                                    key={task.id}
                                    className="task-card fade-up"
                                    style={{ animationDelay: `${i * 0.05}s`, opacity: 0.85, cursor: 'default' }}
                                    onClick={() => navigate(`/task/${task.id}`)}
                                >
                                    <div className="task-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                fontSize: '10px', fontWeight: 700,
                                                padding: '3px 8px', borderRadius: '6px',
                                                background: catMeta.bg, color: catMeta.color,
                                            }}>
                                                <CatIcon size={10} />
                                                {feedT.chips[(task.category || 'other') as keyof typeof feedT.chips] || catMeta.label}
                                            </span>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                                                background: isCompleted ? 'var(--success-bg)' : 'rgba(239,68,68,0.1)',
                                                color: isCompleted ? 'var(--success-color)' : 'var(--danger-color)',
                                            }}>
                                                {isCompleted ? `✓ ${mtT.status.completed}` : `✗ ${mtT.status.cancelled}`}
                                            </span>
                                        </div>
                                        <div className="task-title">{task.title}</div>
                                        <div className="task-meta">
                                            <span className="task-meta-item">
                                                <MapPin size={12} />
                                                {isCustomer ? mtT.role.customer : mtT.role.executor}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="task-reward-box">
                                        {task.paymentType === 'cash' ? (
                                            <div className="reward-badge" style={{
                                                background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'var(--border-color)',
                                                color: isCompleted ? '#059669' : 'var(--tg-theme-hint-color)',
                                                fontSize: '14px',
                                                border: isCompleted ? '1px solid rgba(16, 185, 129, 0.2)' : 'none'
                                            }}>
                                                {isCompleted ? '' : ''}{task.cashAmount} 💵
                                            </div>
                                        ) : (
                                            <div className="reward-badge" style={{
                                                background: isCompleted ? 'var(--success-bg)' : 'var(--border-color)',
                                                color: isCompleted ? 'var(--success-color)' : 'var(--tg-theme-hint-color)',
                                                fontSize: '14px'
                                            }}>
                                                {isCompleted && !isCustomer ? '+' : ''}{isCustomer && isCompleted ? '-' : ''}{task.reward} ★
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )
                )}
            </div>

            <ConfirmModal
                open={abandonModalTaskId !== null}
                title={mtT.abandon_modal.title}
                message={mtT.abandon_modal.message}
                confirmText={mtT.abandon_modal.confirm}
                cancelText={mtT.abandon_modal.cancel}
                danger
                onConfirm={confirmAbandon}
                onCancel={() => setAbandonModalTaskId(null)}
            />
        </div>
    );
};

export default MyTasks;
