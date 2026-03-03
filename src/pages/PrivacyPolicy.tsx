import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="page-container" style={{ padding: '0', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <div className="top-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                </button>
                <div className="top-header-title">Конфиденциальность</div>
                <div style={{ width: 36 }} />
            </div>

            <div style={{ padding: '0 20px 40px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div className="header-icon" style={{ margin: '20px auto', width: 60, height: 60, borderRadius: '20px' }}>
                    <Shield size={32} />
                </div>

                <div className="detail-section">
                    <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>1. Сбор данных</h2>
                    <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)', lineHeight: 1.6 }}>
                        Easy Quest получает доступ к ограниченным данным вашего профиля Telegram (ID, имя, имя пользователя, фото профиля) для обеспечения работы приложения и персонализации вашего опыта.
                    </p>
                </div>

                <div className="detail-section">
                    <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>2. Геолокация</h2>
                    <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)', lineHeight: 1.6 }}>
                        Мы запрашиваем доступ к вашему местоположению исключительно для отображения заданий рядом с вами и отправки уведомлений о новых заданиях в вашем городе. Мы не храним историю ваших перемещений.
                    </p>
                </div>

                <div className="detail-section">
                    <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>3. Платежи и Stars</h2>
                    <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)', lineHeight: 1.6 }}>
                        Все операции по покупке Stars проходят через официальную платформу Telegram. Мы не имеем доступа к данным ваших банковских карт или кошельков. Вывод средств осуществляется на предоставленный вами адрес TON кошелька.
                    </p>
                </div>

                <div className="detail-section">
                    <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>4. Верификация (KYC)</h2>
                    <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)', lineHeight: 1.6 }}>
                        Фотографии, предоставленные для верификации, используются только модератором для подтверждения реальности вашего профиля. Эти данные не передаются третьим лицам.
                    </p>
                </div>

                <div className="detail-section">
                    <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>5. Удаление данных</h2>
                    <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color)', lineHeight: 1.6 }}>
                        Вы можете в любой момент прекратить использование приложения. Для полного удаления ваших данных из нашей базы обратитесь в поддержку @EasyQuestSupportBot.
                    </p>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', textAlign: 'center', marginTop: '10px' }}>
                    Последнее обновление: Март 2026
                </p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
