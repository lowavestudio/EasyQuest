import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ChevronLeft, Send, Truck, Camera, Heart, Monitor, Megaphone, HelpCircle, Search, X, MapPin, Loader2, Crown } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});



interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

// Sub-component: flies the map to a new position
function FlyTo({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(position, 16, { animate: true, duration: 0.8 });
    }, [position, map]);
    return null;
}

// Sub-component: draggable marker that updates position on click or drag
function DraggableMarker({
    position,
    onMove,
}: {
    position: [number, number];
    onMove: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            onMove(e.latlng.lat, e.latlng.lng);
        },
    });

    const markerIcon = L.divIcon({
        className: '',
        html: `<div style="
            width:32px; height:32px;
            background: linear-gradient(135deg,#3b82f6,#8b5cf6);
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(59,130,246,0.5);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    return (
        <Marker
            position={position}
            icon={markerIcon}
            draggable
            eventHandlers={{
                dragend(e) {
                    const latlng = (e.target as L.Marker).getLatLng();
                    onMove(latlng.lat, latlng.lng);
                },
            }}
        />
    );
}

const CreateTask = () => {
    const navigate = useNavigate();
    const { addTask, userLocation, balance, t, language, haptic } = useAppStore();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState('50');
    const [category, setCategory] = useState('other');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const ctT = t('create_task');
    const commonT = t('common');

    const categories = [
        { id: 'delivery', label: language === 'ru' ? 'Доставка' : 'Delivery', icon: Truck, color: '#f59e0b' },
        { id: 'photo', label: language === 'ru' ? 'Фото/Видео' : 'Photo/Video', icon: Camera, color: '#8b5cf6' },
        { id: 'help', label: language === 'ru' ? 'Помощь' : 'Help', icon: Heart, color: '#ef4444' },
        { id: 'it', label: language === 'ru' ? 'IT' : 'IT', icon: Monitor, color: '#3b82f6' },
        { id: 'promo', label: language === 'ru' ? 'Промо' : 'Promo', icon: Megaphone, color: '#10b981' },
        { id: 'other', label: language === 'ru' ? 'Другое' : 'Other', icon: HelpCircle, color: '#64748b' },
    ];

    // Location state
    const defaultPos: [number, number] = userLocation ?? [55.7558, 37.6173];
    const [markerPos, setMarkerPos] = useState<[number, number]>(defaultPos);
    const [flyToPos, setFlyToPos] = useState<[number, number] | null>(null);
    const [address, setAddress] = useState('');

    // Address search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [paymentType, setPaymentType] = useState<'stars' | 'cash'>('stars');
    const [cashAmount, setCashAmount] = useState('');
    const [isOnline, setIsOnline] = useState(false);
    const [isPremium, setIsPremium] = useState(false);

    const rewardNum = Number(reward) || 0;
    const isCash = paymentType === 'cash';
    const baseCost = isCash ? 20 : Math.max(rewardNum, 1);
    const vipCost = isPremium ? 50 : 0;
    const cost = baseCost + vipCost;
    const canSubmit = title.trim() && description.trim() && (isCash ? cashAmount.trim() : rewardNum > 0) && cost <= balance && !isSubmitting;

    // Reverse geocode when marker moves
    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${language}`,
                { headers: { 'Accept-Language': language } }
            );
            const data = await res.json();
            if (data.display_name) {
                // Shorten to city + street
                const parts = data.display_name.split(', ');
                setAddress(parts.slice(0, 3).join(', '));
            }
        } catch {
            setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
    }, [language]);

    const handleMarkerMove = useCallback((lat: number, lng: number) => {
        setMarkerPos([lat, lng]);
        reverseGeocode(lat, lng);
    }, [reverseGeocode]);

    // Set initial address
    useEffect(() => {
        reverseGeocode(defaultPos[0], defaultPos[1]);
    }, []);

    // Address search with debounce
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        if (!q.trim()) { setSearchResults([]); setShowResults(false); return; }
        searchDebounce.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=${language}`,
                    { headers: { 'Accept-Language': language } }
                );
                const data: NominatimResult[] = await res.json();
                setSearchResults(data);
                setShowResults(true);
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);
    };

    const handleSelectResult = (result: NominatimResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setMarkerPos([lat, lng]);
        setFlyToPos([lat, lng]);
        const parts = result.display_name.split(', ');
        setAddress(parts.slice(0, 3).join(', '));
        setSearchQuery('');
        setShowResults(false);
        setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsSubmitting(true);

        await addTask({
            title: title.trim(),
            description: description.trim(),
            reward: rewardNum,
            lat: markerPos[0],
            lng: markerPos[1],
            category,
            address: address || undefined,
            paymentType,
            cashAmount: isCash ? cashAmount.trim() : undefined,
            isOnline,
            isPremium,
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
                <div className="detail-title">{ctT.title}</div>
                <div style={{ width: 36 }} />
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    {/* Category picker */}
                    <div className="form-group">
                        <label className="form-label">{ctT.category}</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {categories.map(cat => {
                                const Icon = cat.icon;
                                const isActive = category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                            padding: '12px 8px', borderRadius: '14px',
                                            border: `2px solid ${isActive ? cat.color : 'var(--border-color)'}`,
                                            background: isActive ? `${cat.color}18` : 'var(--card-bg)',
                                            cursor: 'pointer', transition: 'all 0.18s ease',
                                            transform: isActive ? 'scale(1.03)' : 'scale(1)',
                                        }}
                                    >
                                        <Icon size={20} color={isActive ? cat.color : 'var(--tg-theme-hint-color)'} />
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: isActive ? cat.color : 'var(--tg-theme-hint-color)', fontFamily: "'Inter', sans-serif" }}>
                                            {cat.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label className="form-label">{ctT.task_title}</label>
                        <input
                            autoFocus
                            className="form-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={ctT.placeholders.title}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label">{ctT.description}</label>
                        <textarea
                            className="form-input"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            style={{ resize: 'none' }}
                            placeholder={ctT.placeholders.description}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Payment Type */}
                    <div className="form-group">
                        <label className="form-label">{ctT.payment_type}</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setPaymentType('stars')}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px',
                                    border: `2px solid ${paymentType === 'stars' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                    background: paymentType === 'stars' ? 'var(--accent-light)' : 'var(--card-bg)',
                                    color: paymentType === 'stars' ? 'var(--accent-color)' : 'var(--tg-theme-text-color)',
                                    fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                            >
                                ★ {ctT.payment_stars}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('cash')}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px',
                                    border: `2px solid ${paymentType === 'cash' ? '#10b981' : 'var(--border-color)'}`,
                                    background: paymentType === 'cash' ? 'rgba(16, 185, 129, 0.1)' : 'var(--card-bg)',
                                    color: paymentType === 'cash' ? '#10b981' : 'var(--tg-theme-text-color)',
                                    fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                            >
                                💵 {ctT.payment_cash}
                            </button>
                        </div>
                    </div>

                    {/* Reward */}
                    {paymentType === 'stars' ? (
                        <div className="form-group">
                            <label className="form-label">{ctT.reward} ({commonT.stars})</label>
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
                                    {ctT.insufficient_funds} ({balance} ★)
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="form-group" style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <label className="form-label" style={{ color: '#059669' }}>{ctT.cash_amount_label} 💵</label>
                            <input
                                type="text"
                                className="form-input"
                                value={cashAmount}
                                onChange={e => setCashAmount(e.target.value)}
                                placeholder={ctT.placeholders.cash}
                                disabled={isSubmitting}
                                style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
                                    {ctT.commission_fee}
                                </span>
                                {cost > balance && (
                                    <span style={{ fontSize: '12px', color: 'var(--danger-color)', fontWeight: '600' }}>
                                        {ctT.insufficient_funds} ({balance} ★)
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Online Task Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--card-bg)', borderRadius: '14px', border: '1.5px solid var(--border-color)', marginTop: '4px' }}>
                        <div
                            onClick={() => setIsOnline(!isOnline)}
                            style={{
                                width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0,
                                background: isOnline ? 'var(--accent-color)' : 'var(--tg-theme-hint-color)',
                                position: 'relative', cursor: 'pointer', transition: '0.2s', opacity: isOnline ? 1 : 0.5
                            }}
                        >
                            <div style={{
                                width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                                position: 'absolute', top: '2px', left: isOnline ? '22px' : '2px', transition: '0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--tg-theme-text-color)' }}>{ctT.is_online_label}</span>
                    </div>

                    {/* VIP Toggle */}
                    <div style={{
                        marginTop: '4px', background: 'var(--star-bg)', border: '1px solid rgba(251,191,36,0.3)',
                        borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#fbbf24', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Crown size={20} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#b45309' }}>
                                    {language === 'ru' ? 'VIP-задание' : 'VIP Task'} (+50 ★)
                                </div>
                                <div style={{ fontSize: '11px', color: '#d97706', marginTop: '2px', lineHeight: 1.3 }}>
                                    {language === 'ru' ? 'Выделяется золотым цветом, привлекает больше исполнителей.' : 'Highlighted in gold, attracts more executors.'}
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                width: '46px', height: '26px', borderRadius: '13px',
                                background: isPremium ? '#fbbf24' : 'var(--border-color)',
                                position: 'relative', cursor: 'pointer', transition: '0.3s'
                            }}
                            onClick={() => {
                                haptic('selection');
                                setIsPremium(!isPremium);
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: '2px', left: isPremium ? '22px' : '2px',
                                width: '22px', height: '22px', borderRadius: '50%',
                                background: 'white', transition: '0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                            }} />
                        </div>
                    </div>

                    {/* Location Section */}
                    {!isOnline && (
                        <div className="form-group">
                            <label className="form-label">{ctT.location}</label>

                            {/* Address Search */}
                            <div style={{ position: 'relative', marginBottom: '10px' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    background: 'var(--card-bg)', border: '1.5px solid var(--border-color)',
                                    borderRadius: '12px', padding: '10px 14px',
                                }}>
                                    {isSearching
                                        ? <Loader2 size={16} color="var(--accent-color)" className="spin-anim" style={{ flexShrink: 0 }} />
                                        : <Search size={16} color="var(--tg-theme-hint-color)" style={{ flexShrink: 0 }} />
                                    }
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                        placeholder={ctT.placeholders.address}
                                        style={{
                                            flex: 1, border: 'none', background: 'transparent', outline: 'none',
                                            fontSize: '14px', color: 'var(--tg-theme-text-color)',
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    />
                                    {searchQuery && (
                                        <button type="button" onClick={() => { setSearchQuery(''); setShowResults(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                            <X size={16} color="var(--tg-theme-hint-color)" />
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown results */}
                                {showResults && searchResults.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000,
                                        background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                                        borderRadius: '12px', overflow: 'hidden',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    }}>
                                        {searchResults.map(result => {
                                            const parts = result.display_name.split(', ');
                                            return (
                                                <button
                                                    key={result.place_id}
                                                    type="button"
                                                    onClick={() => handleSelectResult(result)}
                                                    style={{
                                                        width: '100%', padding: '12px 14px', textAlign: 'left',
                                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                                        borderBottom: '1px solid var(--border-color)', display: 'flex',
                                                        alignItems: 'flex-start', gap: '10px',
                                                        transition: 'background 0.1s',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-light)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <MapPin size={14} color="var(--accent-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tg-theme-text-color)', fontFamily: "'Inter', sans-serif" }}>
                                                            {parts[0]}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--tg-theme-hint-color)', marginTop: '2px', fontFamily: "'Inter', sans-serif" }}>
                                                            {parts.slice(1, 4).join(', ')}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Interactive Map */}
                            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid var(--border-color)', height: '220px', position: 'relative' }}>
                                <MapContainer
                                    center={markerPos}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                    attributionControl={false}
                                >
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                    <DraggableMarker position={markerPos} onMove={handleMarkerMove} />
                                    {flyToPos && <FlyTo position={flyToPos} />}
                                </MapContainer>

                                {/* Map hint overlay */}
                                <div style={{
                                    position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
                                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                                    color: 'white', fontSize: '11px', fontWeight: 600,
                                    padding: '5px 12px', borderRadius: '20px', zIndex: 800,
                                    pointerEvents: 'none', whiteSpace: 'nowrap',
                                }}>
                                    {ctT.map_hint}
                                </div>
                            </div>

                            {/* Current address display */}
                            {address && (
                                <div style={{
                                    marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px',
                                    padding: '10px 12px', background: 'var(--accent-light)', borderRadius: '10px',
                                }}>
                                    <MapPin size={14} color="var(--accent-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span style={{ fontSize: '13px', color: 'var(--accent-color)', fontWeight: 600, lineHeight: 1.4 }}>
                                        {address}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="tg-button"
                        disabled={!canSubmit}
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        {isSubmitting
                            ? <><Loader2 size={17} className="spin-anim" /> {commonT.loading}</>
                            : <><Send size={17} /> {ctT.publish_btn}</>
                        }
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateTask;
