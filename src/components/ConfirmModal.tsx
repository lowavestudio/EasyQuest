import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal = ({ open, title, message, confirmText = 'Подтвердить', cancelText = 'Отмена', danger = false, onConfirm, onCancel }: ConfirmModalProps) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-card scale-in" onClick={e => e.stopPropagation()}>
                <div className={`modal-icon ${danger ? 'danger' : ''}`}>
                    <AlertTriangle size={24} />
                </div>
                <div className="modal-title">{title}</div>
                <div className="modal-message">{message}</div>
                <div className="modal-actions">
                    <button className="modal-btn secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`modal-btn ${danger ? 'danger' : 'primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
