import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Navigation, ChevronLeft, Send } from 'lucide-react';

const CreateTask = () => {
    const navigate = useNavigate();
    const { addTask, userLocation, balance } = useAppStore();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState('50');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const rewardNum = Number(reward) || 0;
    const canSubmit = title.trim() && description.trim() && rewardNum > 0 && rewardNum <= balance && !isSubmitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);
        const lat = userLocation ? userLocation[0] : 51.505;
        const lng = userLocation ? userLocation[1] : -0.09;

        await addTask({
            title: title.trim(),
            description: description.trim(),
            reward: rewardNum,
            lat,
            lng
        });

        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        navigate('/feed');
    };

    return (
        <div className="task-details-page">
            <div className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={22} />
                </button>
                <div className="detail-title">Новое задание</div>
                <div style={{ width: 36 }} />
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    <div className="form-group">
                        <label className="form-label">Название</label>
                        <input
                            autoFocus
                            className="form-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Например: Аудит витрины магазина"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Описание и инструкции</label>
                        <textarea
                            className="form-input"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            style={{ resize: 'none' }}
                            placeholder="Что должен сделать исполнитель?"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Награда (Stars)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={reward}
                            onChange={e => setReward(e.target.value)}
                            min={1}
                            disabled={isSubmitting}
                        />
                        {rewardNum > balance && (
                            <span style={{ fontSize: '12px', color: 'var(--danger-color)', fontWeight: '600' }}>
                                Недостаточно средств (баланс: {balance} ★)
                            </span>
                        )}
                    </div>

                    <div className="detail-section" style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.5 }}>
                            <Navigation size={16} color="var(--accent-color)" />
                            Задание будет привязано к вашей текущей GPS-локации
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="tg-button"
                        disabled={!canSubmit}
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        <Send size={17} /> {isSubmitting ? 'Публикация...' : 'Опубликовать задание'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateTask;
