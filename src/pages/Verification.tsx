import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Camera, UploadCloud, ShieldCheck, ArrowLeft, Clock, XCircle } from 'lucide-react';

const Verification = () => {
    const { user, uploadPhoto, submitVerification, t } = useAppStore();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const verifT = t('verification');

    if (!user) return null;

    const status = user.verificationStatus;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadPhoto(file);
            if (url) {
                await submitVerification(url);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const renderContent = () => {
        if (status === 'verified') {
            return (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <ShieldCheck size={40} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{verifT.verified_title}</h2>
                    <p style={{ color: 'var(--tg-theme-hint-color)', lineHeight: '1.5' }}>
                        {verifT.verified_desc}
                    </p>
                </div>
            );
        }

        if (status === 'pending') {
            return (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Clock size={40} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{verifT.pending_title}</h2>
                    <p style={{ color: 'var(--tg-theme-hint-color)', lineHeight: '1.5' }}>
                        {verifT.pending_desc}
                    </p>
                </div>
            );
        }

        if (status === 'rejected') {
            return (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <XCircle size={40} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{verifT.rejected_title}</h2>
                    <p style={{ color: 'var(--tg-theme-hint-color)', lineHeight: '1.5', marginBottom: '20px' }}>
                        {verifT.rejected_desc}
                    </p>
                    <button className="primary-btn" onClick={() => { setFile(null); setPreviewUrl(null); }}>
                        {verifT.retry}
                    </button>
                </div>
            );
        }

        // Default 'none' status
        return (
            <div style={{ padding: '0 16px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-button-color)', width: '64px', height: '64px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <ShieldCheck size={32} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{verifT.top_title}</h2>
                    <p style={{ color: 'var(--tg-theme-hint-color)', lineHeight: '1.5', fontSize: '14px' }}>
                        {verifT.top_desc}
                    </p>
                </div>

                <div style={{ background: 'var(--tg-theme-secondary-bg-color)', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>{verifT.how_to}</h3>
                    <ul style={{ paddingLeft: '20px', color: 'var(--tg-theme-hint-color)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                        {verifT.steps.map((step: string, i: number) => (
                            <li key={i}>{step}</li>
                        ))}
                    </ul>
                </div>

                <div className="form-group">
                    {!previewUrl ? (
                        <label className="photo-upload-area" style={{ height: '200px' }}>
                            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            <Camera size={32} color="var(--tg-theme-hint-color)" style={{ marginBottom: '12px' }} />
                            <span style={{ color: 'var(--tg-theme-hint-color)', fontSize: '14px', fontWeight: '500' }}>
                                {verifT.upload_hint}
                            </span>
                        </label>
                    ) : (
                        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '300px' }}>
                            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                                onClick={() => { setFile(null); setPreviewUrl(null); }}
                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '8px' }}
                            >
                                {verifT.change_photo}
                            </button>
                        </div>
                    )}
                </div>

                <button
                    className="primary-btn mt-4"
                    onClick={handleSubmit}
                    disabled={!file || isUploading}
                    style={{ opacity: (!file || isUploading) ? 0.5 : 1 }}
                >
                    {isUploading ? verifT.submitting : verifT.submit}
                    {!isUploading && file && <UploadCloud size={18} />}
                </button>
            </div>
        );
    };

    return (
        <div className="page-container" style={{ paddingBottom: '90px' }}>
            <div className="tg-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--tg-theme-bg-color)', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--tg-theme-secondary-bg-color)' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--tg-theme-text-color)', padding: 0 }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{verifT.title}</div>
            </div>

            <div style={{ paddingTop: '16px' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default Verification;
