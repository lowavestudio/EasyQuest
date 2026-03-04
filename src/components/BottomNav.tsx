import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, ClipboardList, Wallet, UserRound } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const BottomNav = () => {
    const { unreadCount, fetchUnreadCount, user, t } = useAppStore();
    const navT = t('nav');

    useEffect(() => {
        if (user?.id) {
            fetchUnreadCount();
            const interval = setInterval(() => {
                if (useAppStore.getState().user?.id) {
                    fetchUnreadCount();
                }
            }, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [user?.id, fetchUnreadCount]);

    return (
        <nav className="bottom-nav">
            <NavLink
                to="/feed"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <span className="nav-pip" />
                <Compass size={22} strokeWidth={2.5} />
                <span>{navT.feed}</span>
            </NavLink>

            <NavLink
                to="/tasks"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <span className="nav-pip" />
                <div style={{ position: 'relative', display: 'flex' }}>
                    <ClipboardList size={22} strokeWidth={2.5} />
                    {unreadCount > 0 && (
                        <div className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>
                    )}
                </div>
                <span>{navT.tasks}</span>
            </NavLink>

            <NavLink
                to="/wallet"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <span className="nav-pip" />
                <Wallet size={22} strokeWidth={2.5} />
                <span>{navT.wallet}</span>
            </NavLink>

            <NavLink
                to="/profile"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <span className="nav-pip" />
                <UserRound size={22} strokeWidth={2.5} />
                <span>{navT.profile}</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
