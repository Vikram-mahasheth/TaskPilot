// FILE: frontend/src/context/NotificationContext.jsx

import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import useApi from '../hooks/useApi';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useContext(AuthContext); // Get the user from AuthContext
    const api = useApi();

    // Memoize the function to prevent re-renders
    const fetchNotifications = useCallback(async () => {
        // ** THE FIX IS HERE **
        // Do not run if there is no user, or if the user is not an admin
        if (!user || user.role !== 'admin') {
            setNotifications([]);
            setUnreadCount(0);
            return;
        };

        try {
            const res = await api('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.read).length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error.message);
        }
    }, [api, user]); // Add user as a dependency

    useEffect(() => {
        fetchNotifications();
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