import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Clock, Camera, ClipboardList, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';

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
    const { tasks, completeTask, abandonTask, fetchMyTasks, uploadPhoto, notify } = useAppStore();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const selectedTaskId = useRef<number | null>(null);
    const [, forceUpdate] = useState(0);
    const [abandonModalTaskId, setAbandonModalTaskId] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState<number | null>(null);

    const myTasks = tasks.filter(t => t.status === 'accepted' || t.status === 'under_review');

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
                notify('Ошибка при отправке отчета', 'error');
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
                <div className="top-header-title">Мои задания</div>
                <div className="badge">{myTasks.length}</div>
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
                {myTasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <ClipboardList size={28} />
                        </div>
                        <div className="empty-state-title">Нет активных заданий</div>
                        <div className="empty-state-text">
                            Примите задание из ленты, чтобы начать зарабатывать звёзды
                        </div>
                        <button
                            className="tg-button"
                            style={{ marginTop: '12px', width: 'auto', padding: '12px 28px', fontSize: '15px' }}
                            onClick={() => navigate('/feed')}
                        >
                            Найти задания
                        </button>
                    </div>
                ) : (
                    myTasks.map((task, i) => {
                        const remaining = getRemainingMs(task.acceptedAt);
                        const timerState = getTimerState(remaining);
                        const isReviewing = task.status === 'under_review';
                        const uploading = isUploading === task.id;

                        return (
                            <div
                                key={task.id}
                                className="task-card fade-up"
                                style={{ animationDelay: `${i * 0.05}s`, ...(isReviewing ? { opacity: 0.75 } : {}), flexWrap: 'wrap' }}
                                onClick={() => navigate(`/task/${task.id}`)}
                            >
                                <div className="task-info">
                                    <div className="task-title">{task.title}</div>
                                    <div className="task-meta">
                                        {isReviewing ? (
                                            <span className="status-badge reviewing">На проверке</span>
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
                                                {uploading ? 'Загрузка...' : 'Сдать'}
                                            </button>
                                            <button
                                                disabled={uploading}
                                                style={{
                                                    padding: '7px 14px',
                                                    fontSize: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'transparent',
                                                    color: 'var(--danger-color)',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px',
                                                    fontFamily: "'Inter', sans-serif",
                                                    transition: 'all 0.15s',
                                                    opacity: uploading ? 0.5 : 1
                                                }}
                                                onClick={(e) => handleAbandonClick(e, task.id)}
                                            >
                                                <XCircle size={12} /> Отказ
                                            </button>
                                        </>
                                    ) : (
                                        <div className="reward-badge" style={{ fontSize: '13px' }}>
                                            +{task.reward} ★
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Abandon confirmation modal */}
            <ConfirmModal
                open={abandonModalTaskId !== null}
                title="Отказаться от задания?"
                message="Задание вернётся в ленту и станет доступно другим исполнителям."
                confirmText="Да, отказаться"
                cancelText="Нет, продолжить"
                danger
                onConfirm={confirmAbandon}
                onCancel={() => setAbandonModalTaskId(null)}
            />
        </div>
    );
};

export default MyTasks;
