
             import { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { NotificationContext } from '../context/NotificationContext';
import { Sun, Moon, LogOut, LayoutDashboard, Shield, Ticket, User as UserIcon, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  
  const ThemeIcon = theme === 'light' ? Moon : Sun;

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setIsNotificationsOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
        markAsRead(notification._id);
    }
    setIsNotificationsOpen(false);
    navigate(notification.link || '/');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 text-xl font-bold">
              
              <img src="Screenshot 2025-07-28 at 10.43.16 AM.png" alt="Task Pilot Logo" className="h-8 w-8" />
              <span>Task Pilot</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {user && (
              <>
                <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 flex items-center gap-1"><Ticket size={18}/> Board</Link>
                {user.role === 'admin' && (
                  <>
                    <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 flex items-center gap-1"><LayoutDashboard size={18}/> Dashboard</Link>
                    <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 flex items-center gap-1"><Shield size={18} /> Admin</Link>
                  </>
                )}
              </>
            )}

            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
              <ThemeIcon size={20} />
            </button>
            
            {user ? (
              <>
                {/* Notification bell for ALL users */}
                <div className="relative" ref={notificationRef}>
                    <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 justify-center items-center text-white text-[10px]">{unreadCount}</span></span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 border dark:border-gray-700">
                            <div className="py-2 px-4 flex justify-between items-center border-b dark:border-gray-700">
                                <h3 className="font-semibold">Notifications</h3>
                                {unreadCount > 0 && <button onClick={markAllAsRead} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Mark all as read</button>}
                            </div>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <li key={n._id} onClick={() => handleNotificationClick(n)} className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${!n.read ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''}`}>
                                        <p className="text-sm">{n.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                                    </li>
                                )) : <li className="p-4 text-center text-sm text-gray-500">No new notifications</li>}
                            </ul>
                        </div>
                    )}
                </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-800 dark:text-gray-200 hidden sm:block"><UserIcon size={16} className="inline-block mr-1" /> {user.name}</span>
                <button onClick={handleLogout} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"><LogOut size={20} /></button>
              </div>
              </>
            ) : (
              <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400">Login</Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;