import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, Info, CheckCircle2, XCircle, Star, MessageSquare, Truck, Camera, Heart, Monitor, Megaphone, HelpCircle, Upload, ShieldCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../store/useAppStore';
import ConfirmModal from '../components/ConfirmModal';
import ReviewModal from '../components/ReviewModal';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const CATEGORY_META: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
    delivery: { label: 'Доставка', Icon: Truck, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    photo: { label: 'Фото/Видео', Icon: Camera, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    help: { label: 'Помощь', Icon: Heart, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    it: { label: 'IT', Icon: Monitor, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    promo: { label: 'Промо', Icon: Megaphone, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    other: { label: 'Другое', Icon: HelpCircle, color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

const pinIcon = L.divIcon({
    className: '',
    html: `<div style="
        width:28px;height:28px;
        background:linear-gradient(135deg,#3b82f6,#8b5cf6);
        border:3px solid white;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 10px rgba(59,130,246,0.4);">
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

const TaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { tasks, acceptTask, abandonTask, cancelOwnTask, approveTask, completeTask, uploadPhoto, user } = useAppStore();
    const [showAbandonModal, setShowAbandonModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const task = tasks.find(t => t.id === Number(id));

    if (!task) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="empty-state-icon"><Info size={28} /></div>
                    <div className="empty-state-title">Задание не найдено</div>
                    <button className="tg-button" style={{ marginTop: '12px', width: 'auto', padding: '12px 28px' }} onClick={() => navigate('/feed')}>
                        К ленте
                    </button>
                </div>
            </div>
        );
    }

    const isOwner = task.customerId === user?.id;
    const isExecutor = task.executorId === user?.id;
    const isAccepted = task.status === 'accepted';
    const isAvailable = task.status === 'available';
    const isCancelled = task.status === 'cancelled';
    const isUnderReview = task.status === 'under_review';
    const isCompleted = task.status === 'completed';

    const catMeta = CATEGORY_META[task.category || 'other'] || CATEGORY_META.other;
    const CatIcon = catMeta.Icon;

    const handleAccept = async () => {
        setIsProcessing(true);
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
        await acceptTask(task.id);
        setIsProcessing(false);
        navigate('/tasks');
    };

    const handleAbandon = async () => {
        setIsProcessing(true);
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
        await abandonTask(task.id);
        setShowAbandonModal(false);
        setIsProcessing(false);
        navigate('/feed');
    };

    const handleCancelOwn = async () => {
        setIsProcessing(true);
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
        await cancelOwnTask(task.id);
        setShowCancelModal(false);
        setIsProcessing(false);
        navigate('/feed');
    };

    const handleApprove = async (rating: number, comment: string) => {
        setIsProcessing(true);
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        await approveTask(task.id, rating, comment);
        setShowReviewModal(false);
        setIsProcessing(false);
        navigate('/feed');
    };

    const handlePhotoSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
        const url = await uploadPhoto(file);
        if (url) {
            await completeTask(task.id, url);
        }
        setIsUploading(false);
    };

    const mapPosition: [number, number] = [task.lat, task.lng];

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

                {/* Hero card */}
                <div className="detail-card">
                    {/* Category + Status row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
                            padding: '4px 10px', borderRadius: '8px',
                            background: catMeta.bg, color: catMeta.color,
                        }}>
                            <CatIcon size={12} /> {catMeta.label}
                        </span>
                        <div>
                            {isCancelled && <span className="status-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Отменено</span>}
                            {isUnderReview && <span className="status-badge reviewing">На проверке</span>}
                            {isAccepted && <span className="status-badge accepted">В работе</span>}
                            {isCompleted && <span className="status-badge completed">Завершено</span>}
                        </div>
                    </div>

                    <div className="d-title">{task.title}</div>

                    <div className="d-meta-row" style={{ marginTop: '10px' }}>
                        <div className="d-meta-item">
                            <MapPin size={14} />
                            <span style={{ fontSize: '13px' }}>
                                {task.address || task.distance || 'рядом'}
                            </span>
                        </div>
                        <div className="d-meta-item">
                            <Clock size={14} />
                            <span>~{task.timeAllowed || '15 мин'}</span>
                        </div>
                    </div>

                    <div className="d-reward-big">
                        <span className="reward-label">Награда</span>
                        <div className="reward-amount">{task.reward} <span>★</span></div>
                    </div>
                </div>

                {/* Mini Map */}
                <div style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '180px', position: 'relative' }}>
                    <MapContainer
                        center={mapPosition}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        attributionControl={false}
                        dragging={false}
                        doubleClickZoom={false}
                        scrollWheelZoom={false}
                        touchZoom={false}
                    >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <Marker position={mapPosition} icon={pinIcon} />
                    </MapContainer>
                    {/* Address overlay */}
                    {task.address && (
                        <div style={{
                            position: 'absolute', bottom: '8px', left: '8px', right: '8px', zIndex: 800,
                            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                            borderRadius: '10px', padding: '7px 12px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}>
                            <MapPin size={13} color="var(--accent-color)" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                                {task.address}
                            </span>
                        </div>
                    )}
                </div>

                {/* Proof photo */}
                {task.proofPhotoUrl && (
                    <div className="detail-section">
                        <div className="section-heading">Отчёт исполнителя</div>
                        <div style={{ marginTop: '12px', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <img
                                src={`${API_BASE}${task.proofPhotoUrl}`}
                                alt="Proof"
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="detail-section">
                    <div className="section-heading">
                        <Info size={17} /> Описание и инструкции
                    </div>
                    <p className="d-description">{task.description}</p>
                </div>

                {/* Requirements */}
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

                {/* Customer info */}
                {task.customer && (
                    <div className="detail-section">
                        <div className="section-heading">
                            <Star size={17} /> Заказчик
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                            {task.customer.photoUrl ? (
                                <img src={task.customer.photoUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '22px', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '44px', height: '44px', borderRadius: '22px', background: 'var(--tg-theme-secondary-bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                    {task.customer.firstName.charAt(0)}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '15px' }}>
                                    {task.customer.firstName}
                                    {task.customer.verificationStatus === 'verified' && (
                                        <ShieldCheck size={16} color="#007aff" fill="#007aff" />
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#f59e0b', marginTop: '2px' }}>
                                    <Star size={12} fill="#f59e0b" />
                                    {task.customer.rating?.toFixed(1)} • {task.customer.reviewCount ?? 0} отзывов
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom actions */}
            {!isCancelled && !isCompleted && (
                <div className="fixed-bottom-action">

                    {/* Executor: available → accept */}
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

                    {/* Executor: accepted → chat + submit photo + abandon */}
                    {isAccepted && isExecutor && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <button
                                className="tg-button"
                                style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => navigate(`/chat/${task.id}`)}
                            >
                                <MessageSquare size={18} /> Чат с заказчиком
                            </button>
                            <label style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '14px', borderRadius: '14px', fontSize: '15px', fontWeight: 700,
                                background: 'var(--success-color)', color: 'white', cursor: 'pointer',
                                opacity: isUploading ? 0.7 : 1,
                            }}>
                                <Upload size={18} />
                                {isUploading ? 'Загрузка...' : 'Сдать задание (загрузить фото)'}
                                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoSubmit} disabled={isUploading} />
                            </label>
                            <button
                                className="tg-button danger"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => setShowAbandonModal(true)}
                                disabled={isProcessing}
                            >
                                <XCircle size={18} /> Отказаться от задания
                            </button>
                        </div>
                    )}

                    {/* Executor: under_review → chat */}
                    {isUnderReview && isExecutor && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <div className="action-warning" style={{ background: 'rgba(251,191,36,0.12)', color: '#d97706' }}>
                                ⏳ Ваша работа на проверке у заказчика
                            </div>
                            <button
                                className="tg-button"
                                style={{ background: 'var(--card-bg)', color: 'var(--tg-theme-text-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => navigate(`/chat/${task.id}`)}
                            >
                                <MessageSquare size={18} /> Чат с заказчиком
                            </button>
                        </div>
                    )}

                    {/* Customer: cancel own available task */}
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

                    {/* Customer: accepted → waiting */}
                    {isOwner && isAccepted && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <button
                                className="tg-button"
                                style={{ background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => navigate(`/chat/${task.id}`)}
                            >
                                <MessageSquare size={18} /> Чат с исполнителем
                            </button>
                            <div className="action-warning">Задание принято. Ожидайте выполнения.</div>
                        </div>
                    )}

                    {/* Customer: under_review → approve */}
                    {isOwner && isUnderReview && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <button
                                className="tg-button"
                                style={{ background: 'var(--card-bg)', color: 'var(--tg-theme-text-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => navigate(`/chat/${task.id}`)}
                            >
                                <MessageSquare size={18} /> Чат с исполнителем
                            </button>
                            <button
                                className="tg-button"
                                style={{ background: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={() => setShowReviewModal(true)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Завершение...' : <><Star size={18} fill="white" /> Принять и оплатить</>}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <ReviewModal open={showReviewModal} taskTitle={task.title} onClose={() => setShowReviewModal(false)} onConfirm={handleApprove} />
            <ConfirmModal open={showAbandonModal} title="Отказаться от задания?" message="Задание вернётся в ленту. Это не повлияет на ваш рейтинг." confirmText="Да, отказаться" cancelText="Нет, продолжить" danger onConfirm={handleAbandon} onCancel={() => setShowAbandonModal(false)} />
            <ConfirmModal open={showCancelModal} title="Отменить задание?" message={`Задание будет снято с публикации. ${task.reward} ★ вернутся на ваш баланс.`} confirmText="Да, отменить" cancelText="Нет, оставить" danger onConfirm={handleCancelOwn} onCancel={() => setShowCancelModal(false)} />
        </div>
    );
};

export default TaskDetails;
