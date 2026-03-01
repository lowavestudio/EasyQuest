import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useState } from 'react';

const ToastContainer = () => {
    const { notifications, dismissNotification } = useAppStore();

    return (
        <div className="toast-container">
            {notifications.map((n) => (
                <ToastItem
                    key={n.id}
                    notification={n}
                    onDismiss={() => dismissNotification(n.id)}
                />
            ))}
        </div>
    );
};

const ToastItem = ({ notification, onDismiss }: { notification: any, onDismiss: () => void }) => {
    const [isLeaving, setIsLeaving] = useState(false);

    const handleDismiss = () => {
        setIsLeaving(true);
        setTimeout(onDismiss, 300);
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'success': return <CheckCircle2 size={18} color="#10b981" />;
            case 'warning': return <AlertCircle size={18} color="#f59e0b" />;
            case 'error': return <XCircle size={18} color="#ef4444" />;
            default: return <Info size={18} color="#3b82f6" />;
        }
    };

    return (
        <div className={`toast-item ${notification.type} ${isLeaving ? 'leaving' : ''}`}>
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-message">{notification.message}</div>
            <button className="toast-close" onClick={handleDismiss}>
                <X size={14} />
            </button>
        </div>
    );
};

export default ToastContainer;
