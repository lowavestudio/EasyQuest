import { useState, useEffect } from 'react';
import { Settings2, Navigation, MapPin, Clock, Plus } from 'lucide-react';
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

const FILTER_CHIPS = ['Все', 'Рядом', 'Экпресс', 'Высокая награда', 'Быстрое'];

const Feed = () => {
    const navigate = useNavigate();
    const { tasks, role, user, userLocation, setUserLocation, fetchTasks } = useAppStore();
    const [isLocating, setIsLocating] = useState(false);
    const [activeChip, setActiveChip] = useState('Все');

    useEffect(() => {
        fetchTasks();
        if (!userLocation) {
            handleLocateMe();
        }
    }, [fetchTasks]);

    // Haversine formula to calculate distance in km
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
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

    // Simple client-side filter
    const filteredTasks = (tasks || []).map(task => {
        let distance = null;
        if (userLocation) {
            distance = getDistance(userLocation[0], userLocation[1], task.lat, task.lng);
        }
        return { ...task, distanceValue: distance };
    }).filter(task => {
        // Don't show your own tasks in the feed when looking for work
        if (role === 'executor' && task.customerId === user?.id) return false;

        if (activeChip === 'Все') return true;
        if (activeChip === 'Рядом') {
            return task.distanceValue !== null && task.distanceValue <= 5; // Within 5km
        }
        if (activeChip === 'Высокая награда') return task.reward >= 80;
        return true;
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
                    Лента заданий
                </div>
                <button className="filter-btn">
                    <Settings2 size={20} />
                </button>
            </div>

            {/* Filter chips */}
            <div className="chips-row">
                {FILTER_CHIPS.map(chip => (
                    <button
                        key={chip}
                        className={`chip ${activeChip === chip ? 'active' : ''}`}
                        onClick={() => setActiveChip(chip)}
                    >
                        {chip}
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
                    {tasks.map(task => (
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
                            <Popup>Вы здесь</Popup>
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
                    {role === 'customer' ? 'Ваши задания' : 'Задания рядом'}
                </div>
                <div className="badge">{filteredTasks.length} доступно</div>
            </div>

            <div className="task-feed" style={{ padding: '0 16px 16px' }}>
                {filteredTasks.map((task, i) => (
                    <div
                        key={task.id}
                        className="task-card fade-up"
                        style={{ animationDelay: `${i * 0.05}s` }}
                        onClick={() => navigate(`/task/${task.id}`)}
                    >
                        <div className="task-info">
                            <div className="task-title">{task.title}</div>
                            <div className="task-meta">
                                <span className="task-meta-item">
                                    <MapPin size={13} /> {task.distanceValue !== undefined && task.distanceValue !== null ? `${task.distanceValue.toFixed(1)} км` : 'рядом'}
                                </span>
                                <span className="task-meta-item">
                                    <Clock size={13} /> {task.timeAllowed || '15 мин'}
                                </span>
                            </div>
                        </div>
                        <div className="task-reward-box">
                            <div className="reward-badge">
                                {task.reward} <span>★</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Feed;
