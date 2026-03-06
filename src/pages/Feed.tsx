import { useState, useEffect } from 'react';
import { Settings2, Navigation, MapPin, Clock, Plus, Truck, Camera, Heart, Monitor, Megaphone, HelpCircle, Search, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

// Fix for default Leaflet icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function MapFlyTo({ position }: { position: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { animate: true, duration: 1 });
        }
    }, [position, map]);
    return null;
}

export const CATEGORY_META: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
    delivery: { label: 'Доставка', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', Icon: Truck },
    photo: { label: 'Фото/Видео', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', Icon: Camera },
    help: { label: 'Помощь', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', Icon: Heart },
    it: { label: 'IT', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', Icon: Monitor },
    promo: { label: 'Промо', color: '#10b981', bg: 'rgba(16,185,129,0.12)', Icon: Megaphone },
    other: { label: 'Другое', color: '#64748b', bg: 'rgba(100,116,139,0.12)', Icon: HelpCircle },
};

const FILTER_CHIPS = [
    { id: 'all', label: 'Все' },
    { id: 'near', label: 'Рядом' },
    { id: 'delivery', label: 'Доставка' },
    { id: 'photo', label: 'Фото/Видео' },
    { id: 'help', label: 'Помощь' },
    { id: 'it', label: 'IT' },
    { id: 'promo', label: 'Промо' },
    { id: 'reward', label: 'Высокая награда' },
];

const Feed = () => {
    const navigate = useNavigate();
    const { tasks, role, user, userLocation, setUserLocation, fetchTasks, notify, t } = useAppStore();
    const [isLocating, setIsLocating] = useState(false);
    const [activeChip, setActiveChip] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const feedT = t('feed');
    const commonT = t('common');

    useEffect(() => {
        fetchTasks();
        if (!userLocation) {
            handleLocateMe();
        }
    }, [fetchTasks]);

    // Haversine formula
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const centerPosition: [number, number] = [51.505, -0.09];

    const filteredTasks = (tasks || []).map(task => {
        let distance = null;
        if (userLocation) {
            distance = getDistance(userLocation[0], userLocation[1], task.lat, task.lng);
        }
        return { ...task, distanceValue: distance };
    }).filter(task => {
        if (role === 'executor' && task.customerId === user?.id) return false;
        // text search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            if (!task.title.toLowerCase().includes(q) && !task.description?.toLowerCase().includes(q)) return false;
        }
        if (activeChip === 'all') return true;
        if (activeChip === 'near') return task.distanceValue !== null && task.distanceValue <= 5;
        if (activeChip === 'reward') return task.reward >= 80;
        return task.category === activeChip;
    });

    const createCustomIcon = (reward: number) => {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-price">${reward}★</div>`,
            iconSize: [40, 24],
            iconAnchor: [20, 24],
        });
    };

    const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 12px rgba(59,130,246,0.6);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                setIsLocating(false);
            },
            () => {
                setIsLocating(false);
                setUserLocation([51.51, -0.12]);
            },
            { timeout: 5000, enableHighAccuracy: true }
        );
    };

    return (
        <div className="page-container" style={{ padding: '0', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <div className="top-header">
                <div className="top-header-title">
                    <div className="header-icon">
                        <Navigation size={18} />
                    </div>
                    {feedT.title}
                </div>
                <button
                    className="filter-btn"
                    onClick={() => notify(t('common.error') === 'Ошибка' ? 'Расширенные фильтры будут доступны скоро!' : 'Advanced filters coming soon! ', 'info')}
                >
                    <Settings2 size={20} />
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '0 16px 4px', position: 'relative' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'var(--card-bg)', border: '1.5px solid var(--border-color)',
                    borderRadius: '14px', padding: '10px 14px',
                    transition: 'border-color 0.18s',
                }}>
                    <Search size={16} color="var(--tg-theme-hint-color)" style={{ flexShrink: 0 }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={feedT.search}
                        style={{
                            flex: 1, border: 'none', background: 'transparent', outline: 'none',
                            fontSize: '14px', color: 'var(--tg-theme-text-color)',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex' }}
                        >
                            <X size={16} color="var(--tg-theme-hint-color)" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter chips */}
            <div className="chips-row">
                {FILTER_CHIPS.map(chip => (
                    <button
                        key={chip.id}
                        className={`chip ${activeChip === chip.id ? 'active' : ''}`}
                        onClick={() => setActiveChip(chip.id)}
                    >
                        {feedT.chips[chip.id as keyof typeof feedT.chips] || chip.label}
                    </button>
                ))}
            </div>

            <div className="map-container" style={{ position: 'relative', height: '300px', flexShrink: 0 }}>
                <MapContainer
                    center={centerPosition}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    {filteredTasks.map(task => (
                        <Marker
                            key={task.id}
                            position={[task.lat, task.lng]}
                            icon={createCustomIcon(task.reward)}
                            eventHandlers={{
                                click: () => navigate(`/task/${task.id}`)
                            }}
                        >
                            <Popup>{task.title}</Popup>
                        </Marker>
                    ))}
                    {userLocation && (
                        <Marker position={userLocation} icon={userIcon}>
                            <Popup>{t('common.error') === 'Ошибка' ? 'Вы здесь' : 'You are here'}</Popup>
                        </Marker>
                    )}
                    <MapFlyTo position={userLocation} />
                    <ZoomControl position="topleft" />
                </MapContainer>

                {role === 'customer' && (
                    <button
                        className="map-locate-btn"
                        style={{ right: '64px', background: 'var(--accent-gradient)', color: 'white', border: 'none', boxShadow: 'var(--shadow-accent)' }}
                        onClick={() => navigate('/create-task')}
                    >
                        <Plus size={22} />
                    </button>
                )}

                <button
                    className="map-locate-btn"
                    onClick={handleLocateMe}
                    style={{ opacity: isLocating ? 0.7 : 1 }}
                >
                    <Navigation size={18} className={isLocating ? 'spin-anim' : ''} />
                </button>
            </div>

            <div className="section-header" style={{ marginTop: '0', padding: '16px 16px 8px' }}>
                <div className="section-title">
                    {role === 'customer' ? feedT.my_tasks : feedT.nearby}
                </div>
                <div className="badge">{filteredTasks.length} {feedT.available}</div>
            </div>

            <div className="task-feed" style={{ padding: '0 16px 16px' }}>
                {filteredTasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <MapPin size={28} />
                        </div>
                        <div className="empty-state-title">{feedT.no_tasks}</div>
                        <div className="empty-state-text">
                            {feedT.no_tasks_text}
                        </div>
                    </div>
                ) : (
                    filteredTasks.map((task, i) => {
                        const catMeta = CATEGORY_META[task.category || 'other'] || CATEGORY_META.other;
                        const CatIcon = catMeta.Icon;
                        return (
                            <div
                                key={task.id}
                                className="task-card fade-up"
                                style={{ animationDelay: `${i * 0.05}s` }}
                                onClick={() => navigate(`/task/${task.id}`)}
                            >
                                <div className="task-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
                                            padding: '3px 8px', borderRadius: '6px',
                                            background: catMeta.bg, color: catMeta.color,
                                        }}>
                                            <CatIcon size={10} />
                                            {feedT.chips[(task.category || 'other') as keyof typeof feedT.chips] || catMeta.label}
                                        </span>
                                    </div>
                                    <div className="task-title">{task.title}</div>
                                    <div className="task-meta">
                                        <span className="task-meta-item" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <MapPin size={13} />
                                            {task.address
                                                ? task.address
                                                : task.distanceValue !== undefined && task.distanceValue !== null
                                                    ? `${task.distanceValue.toFixed(1)} ${commonT.km}`
                                                    : (t('common.error') === 'Ошибка' ? 'рядом' : 'nearby')}
                                        </span>
                                        <span className="task-meta-item">
                                            <Clock size={13} /> {task.timeAllowed || `15 ${commonT.min}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="task-reward-box">
                                    {task.paymentType === 'cash' ? (
                                        <div className="reward-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                            {task.cashAmount} <span>💵</span>
                                        </div>
                                    ) : (
                                        <div className="reward-badge">
                                            {task.reward} <span>★</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Feed;
