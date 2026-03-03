import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ChevronLeft, Send, Truck, Camera, Heart, Monitor, Megaphone, HelpCircle, Search, X, MapPin, Loader2 } from 'lucide-react';
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
    const { addTask, userLocation, balance, t, language } = useAppStore();

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
    const defaultPos: [number, number] = userLocation ?? [51.505, -0.09];
    const [markerPos, setMarkerPos] = useState<[number, number]>(defaultPos);
    const [flyToPos, setFlyToPos] = useState<[number, number] | null>(null);
    const [address, setAddress] = useState('');

    // Address search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const rewardNum = Number(reward) || 0;
    const canSubmit = title.trim() && description.trim() && rewardNum > 0 && rewardNum <= balance && !isSubmitting;

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

                    {/* Reward */}
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
                                {language === 'ru' ? `Недостаточно средств (баланс: ${balance} ★)` : `Insufficient funds (balance: ${balance} ★)`}
                            </span>
                        )}
                    </div>

                    {/* Location Section */}
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
                                {language === 'ru' ? 'Нажмите или перетащите метку' : 'Click or drag the marker'}
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
