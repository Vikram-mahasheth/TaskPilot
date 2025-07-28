import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import useApi from '../hooks/useApi';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useContext(AuthContext);
    const api = useApi();

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.read).length);
        } catch (error) {
            // Don't show a toast for this, as it's a background fetch
            console.error("Failed to fetch notifications:", error.message);
        }
    }, [api, user]);

    useEffect(() => {
        fetchNotifications();
        // Set up polling to check for new notifications periodically
        const interval = setInterval(fetchNotifications, 60000); // 1 minute
        return () => clearInterval(interval);
    }, [fetchNotifications]);
    
    const markAsRead = async (notificationId) => {
        try {
            await api(`/notifications/${notificationId}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n._id === notificationId ? {...n, read: true} : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error("Failed to mark notification as read.");
        }
    };
    
    const markAllAsRead = async () => {
        try {
            await api(`/notifications/read-all`, { method: 'POST' });
            setNotifications(prev => prev.map(n => ({...n, read: true})));
            setUnreadCount(0);
        } catch (error) {
            toast.error("Failed to mark all as read.");
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};