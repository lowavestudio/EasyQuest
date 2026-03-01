import { useState } from 'react';
import { Star, X, MessageSquare } from 'lucide-react';

interface ReviewModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (rating: number, comment: string) => void;
    taskTitle: string;
}

const ReviewModal = ({ open, onClose, onConfirm, taskTitle }: ReviewModalProps) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card scale-in" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}><X size={20} /></button>

                <div className="modal-icon-top" style={{ background: 'var(--success-bg)', color: 'var(--success-color)' }}>
                    <Star size={24} fill="currentColor" />
                </div>

                <div className="modal-title">Принять работу?</div>
                <div className="modal-message">
                    Вы завершаете задание "<b>{taskTitle}</b>". Пожалуйста, оцените исполнителя.
                </div>

                <div className="rating-selector">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            className={`star-btn ${star <= rating ? 'active' : ''}`}
                            onClick={() => setRating(star)}
                        >
                            <Star size={28} fill={star <= rating ? 'currentColor' : 'none'} />
                        </button>
                    ))}
                </div>

                <div className="comment-input-wrapper">
                    <MessageSquare size={16} className="comment-icon" />
                    <textarea
                        className="comment-textarea"
                        placeholder="Оставьте отзыв (необязательно)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={200}
                    />
                </div>

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <button className="modal-btn primary" onClick={() => onConfirm(rating, comment)}>
                        Подтвердить и оплатить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
