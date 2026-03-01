import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, Info, CheckCircle2, XCircle, Star, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import ConfirmModal from '../components/ConfirmModal';
import ReviewModal from '../components/ReviewModal';

const TaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { tasks, acceptTask, abandonTask, cancelOwnTask, approveTask, user } = useAppStore();
    const [showAbandonModal, setShowAbandonModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const task = tasks.find(t => t.id === Number(id));

    if (!task) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Info size={28} />
                    </div>
                    <div className="empty-state-title">Задание не найдено</div>
                    <button
                        className="tg-button"
                        style={{ marginTop: '12px', width: 'auto', padding: '12px 28px', fontSize: '15px' }}
                        onClick={() => navigate('/feed')}
                    >
                        К ленте
                    </button>
                </div>
            </div>
        );
    }

    const isOwner = task.customerId === user?.id;
    const isAccepted = task.status === 'accepted';
    const isAvailable = task.status === 'available';
    const isCancelled = task.status === 'cancelled';
    const isUnderReview = task.status === 'under_review';
    const isCompleted = task.status === 'completed';

    const handleAccept = async () => {
        setIsProcessing(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
        await acceptTask(task.id);
        setIsProcessing(false);
        navigate('/tasks');
    };

    const handleAbandon = async () => {
        setIsProcessing(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
        await abandonTask(task.id);
        setShowAbandonModal(false);
        setIsProcessing(false);
        navigate('/feed');
    };

    const handleCancelOwn = async () => {
        setIsProcessing(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
        await cancelOwnTask(task.id);
        setShowCancelModal(false);
        setIsProcessing(false);
        navigate('/feed');
    };

    const handleApprove = async (rating: number, comment: string) => {
        setIsProcessing(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        await approveTask(task.id, rating, comment);
        setShowReviewModal(false);
        setIsProcessing(false);
        navigate('/feed');
    };

    return (
        <div className="task-details-page">
            <div className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={22} />
                </button>
                <div className="detail-title">Детали задания</div>
                <div style={{ width: 36 }} />
            </div>

            <div className="detail-content">
                <div className="detail-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div className="d-title" style={{ flex: 1 }}>{task.title}</div>
                        {isCancelled && <span className="status-badge cancelled">Отменено</span>}
                        {isUnderReview && <span className="status-badge reviewing">На проверке</span>}
                        {isAccepted && <span className="status-badge accepted">Принято</span>}
                        {isCompleted && <span className="status-badge completed" style={{ background: 'var(--success-bg)', color: 'var(--success-color)' }}>Завершено</span>}
                    </div>

                    <div className="d-meta-row">
                        <div className="d-meta-item">
                            <MapPin size={15} />
                            <span>{task.distance || 'рядом'}</span>
                        </div>
                        <div className="d-meta-item">
                            <Clock size={15} />
                            <span>~{task.timeAllowed || '15 мин'}</span>
                        </div>
                    </div>

                    <div className="d-reward-big">
                        <span className="reward-label">Награда</span>
                        <div className="reward-amount">
                            {task.reward} <span>★</span>
                        </div>
                    </div>
                </div>

                {task.proofPhotoUrl && (
                    <div className="detail-section">
                        <div className="section-heading">Отчет исполнителя</div>
                        <div className="proof-image-container" style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img
                                src={`http://localhost:3001${task.proofPhotoUrl}`}
                                alt="Proof"
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                        </div>
                    </div>
                )}

                <div className="detail-section">
                    <div className="section-heading">
                        <Info size={17} /> Описание и инструкции
                    </div>
                    <p className="d-description">
                        {task.description}
                    </p>
                </div>

                <div className="detail-section">
                    <div className="section-heading">
                        <CheckCircle2 size={17} /> Требования
                    </div>
                    <ul className="d-requirements">
                        <li>Сделайте минимум 1 чёткое фото</li>
                        <li>GPS-локация должна совпадать с меткой</li>
                        <li>Сдайте в течение 2 часов после принятия</li>
                    </ul>
                </div>
            </div>

            {/* Bottom actions */}
            {!isCancelled && !isCompleted && (
                <div className="fixed-bottom-action">
                    {/* Executor: can accept or abandon */}
                    {isAvailable && !isOwner && (
                        <>
                            <div className="action-warning">
                                Принимая задание, вы соглашаетесь выполнить его в установленный срок.
                            </div>
                            <button className="tg-button" onClick={handleAccept} disabled={isProcessing}>
                                {isProcessing ? 'Принятие...' : 'Принять задание'}
                            </button>
                        </>
                    )}

                    {(isAccepted || isUnderReview) && !isOwner && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <button
                                className="tg-button"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
                                onClick={() => navigate(`/chat/${task.id}`)}
                            >
                                <MessageSquare size={18} /> Чат с заказчиком
                            </button>
                            {isAccepted && (
                                <button
                                    className="tg-button danger"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    onClick={() => setShowAbandonModal(true)}
                                    disabled={isProcessing}
                                >
                                    <XCircle size={18} /> Отказаться от задания
                                </button>
                            )}
                        </div>
                    )}

                    {/* Customer: can cancel their own task or approve it */}
                    {isOwner && isAvailable && (
                        <button
                            className="tg-button danger"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={() => setShowCancelModal(true)}
                            disabled={isProcessing}
                        >
                            <XCircle size={18} /> {isProcessing ? 'Отмена...' : 'Отменить задание'}
                        </button>
                    )}

                    {isOwner && isUnderReview && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <button
                                className="tg-button"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--card-bg)', color: 'var(--tg-theme-text-color)', border: '1px solid var(--border-color)' }}
                                onClick={() => navigate(`/chat/${task.id}`)}
                            >
                                <MessageSquare size={18} /> Чат с исполнителем
                            </button>
                            <button
                                className="tg-button"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--success-color)' }}
                                onClick={() => setShowReviewModal(true)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Завершение...' : <><Star size={18} fill="white" /> Принять и оплатить</>}
                            </button>
                        </div>
                    )}

                    {isOwner && isAccepted && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <button
                                className="tg-button"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)' }}
                                onClick={() => navigate(`/chat/${task.id}`)}
                            >
                                <MessageSquare size={18} /> Чат с исполнителем
                            </button>
                            <div className="action-warning">
                                Задание принято исполнителем. Ожидайте выполнения.
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ReviewModal
                open={showReviewModal}
                taskTitle={task.title}
                onClose={() => setShowReviewModal(false)}
                onConfirm={handleApprove}
            />

            <ConfirmModal
                open={showAbandonModal}
                title="Отказаться от задания?"
                message="Задание вернётся в ленту и станет доступно другим исполнителям. Это не повлияет на ваш рейтинг."
                confirmText="Да, отказаться"
                cancelText="Нет, продолжить"
                danger
                onConfirm={handleAbandon}
                onCancel={() => setShowAbandonModal(false)}
            />

            <ConfirmModal
                open={showCancelModal}
                title="Отменить задание?"
                message={`Задание будет снято с публикации. ${task.reward} ★ вернутся на ваш баланс.`}
                confirmText="Да, отменить"
                cancelText="Нет, оставить"
                danger
                onConfirm={handleCancelOwn}
                onCancel={() => setShowCancelModal(false)}
            />
        </div>
    );
};

export default TaskDetails;
