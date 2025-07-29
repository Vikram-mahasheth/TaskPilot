import { useContext, useState, useEffect, useRef, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { NotificationContext } from '../context/NotificationContext';
import { FilterContext } from '../context/FilterContext';
import { Sun, Moon, LogOut, LayoutDashboard, Shield, Ticket, User as UserIcon, Bell, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Fixed NotificationBell component with proper state management
const NotificationBell = forwardRef((props, ref) => {
    const { user, unreadCount, notifications, markAllAsRead, markAsRead } = props;
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const bellRef = useRef(null);

    // Combine forwarded ref with local ref
    useEffect(() => {
        if (ref) {
            if (typeof ref === 'function') {
                ref(bellRef.current);
            } else {
                ref.current = bellRef.current;
            }
        }
    }, [ref]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    const handleNotificationClick = (notification) => {
        navigate(notification.link || '/');
        setIsOpen(false);
        if (!notification.read) {
            markAsRead(notification._id);
        }
    };

    return (
        <div className="relative" ref={bellRef}>
            <button 
                onClick={() => setIsOpen(prev => !prev)} 
                className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 justify-center items-center text-white text-[10px]">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="fixed sm:absolute right-0 top-16 sm:top-10 sm:mt-2 w-full sm:w-80 max-h-[calc(100vh-5rem)] bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 border dark:border-gray-700">
                    <div className="py-2 px-4 flex justify-between items-center border-b dark:border-gray-700">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && <button onClick={markAllAsRead} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Mark all as read</button>}
                    </div>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[calc(100vh-10rem)] overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(n => (
                            <li 
                                key={n._id} 
                                onClick={() => handleNotificationClick(n)} 
                                className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${!n.read ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''}`}
                            >
                                <p className="text-sm">{n.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                            </li>
                        )) : <li className="p-4 text-center text-sm text-gray-500">No new notifications</li>}
                    </ul>
                </div>
            )}
        </div>
    );
});
NotificationBell.displayName = 'NotificationBell';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);
  const { resetFilters } = useContext(FilterContext);
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notificationRef = useRef(null);
  
  const ThemeIcon = theme === 'light' ? Moon : Sun;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    setIsMobileMenuOpen(false);
  };
  
  const handleLogoClick = () => {
    resetFilters();
    setIsMobileMenuOpen(false);
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md relative z-10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link 
              to="/" 
              onClick={handleLogoClick} 
              className="flex-shrink-0 flex items-center gap-2 text-xl font-bold"
            >
              <img src="/logo.svg" alt="Project Phoenix Logo" className="h-8 w-8" />
              <span className="hidden sm:inline">Project Phoenix</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <Link 
                  to="/" 
                  onClick={handleLogoClick} 
                  className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 flex items-center gap-1"
                >
                  <Ticket size={18}/> Board
                </Link>
                {user.role === 'admin' && (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 flex items-center gap-1"
                    >
                      <LayoutDashboard size={18}/> Dashboard
                    </Link>
                    <Link 
                      to="/admin" 
                      className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 flex items-center gap-1"
                    >
                      <Shield size={18} /> Admin
                    </Link>
                  </>
                )}
              </>
            )}

            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ThemeIcon size={20} />
            </button>
            
            {user ? (
              <>
                <NotificationBell
                    ref={notificationRef}
                    user={user}
                    unreadCount={unreadCount}
                    notifications={notifications}
                    markAllAsRead={markAllAsRead}
                    markAsRead={markAsRead}
                />
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800 dark:text-gray-200 hidden sm:block">
                    <UserIcon size={16} className="inline-block mr-1" /> {user && user.name}
                  </span>
                  <button 
                    onClick={handleLogout} 
                    className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                className="text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
             <button 
               onClick={toggleTheme} 
               className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
             >
              <ThemeIcon size={20} />
            </button>
            <NotificationBell
                ref={notificationRef}
                user={user}
                unreadCount={unreadCount}
                notifications={notifications}
                markAllAsRead={markAllAsRead}
                markAsRead={markAsRead}
            />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 rounded-md text-gray-600 dark:text-gray-300"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 z-40">
            <div className="flex flex-col space-y-2">
              {user && (
                <>
                  <Link 
                    to="/" 
                    onClick={handleLogoClick} 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Board
                  </Link>
                  {user.role === 'admin' && (
                    <>
                      <Link 
                        to="/dashboard" 
                        onClick={handleLinkClick} 
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/admin" 
                        onClick={handleLinkClick} 
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        Admin
                      </Link>
                    </>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="font-medium">{user && user.name}</span>
                    <button 
                      onClick={handleLogout} 
                      className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              )}
              {!user && (
                  <Link 
                    to="/login" 
                    onClick={handleLinkClick} 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Login
                  </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;