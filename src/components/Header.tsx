import { useState, useEffect, useRef } from 'react';
import { Search, Bell, MessageSquare } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';

const Header = () => {
  const [query, setQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${query.trim()}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const userAvatar = user?.profilePictureUrl || user?.avatar || `https://placehold.co/50x50/1a202c/ffffff?text=${user?.fullName?.charAt(0) || 'U'}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Logo */}
        <Link to="/feed" className="text-2xl font-bold text-white hover:text-indigo-400 transition-colors flex-shrink-0">
          StageScout
        </Link>

        {/* Center: Search Bar Form - Hidden on small screens */}
        <div className="hidden md:flex flex-grow justify-center px-4">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full p-2 pl-10 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </form>
        </div>

        {/* Right Side: Icons */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Icon for Mobile - Hidden on medium screens and up */}
          <Link to="/search" className="p-2 rounded-full hover:bg-gray-700 md:hidden" title="Search">
            <Search className="text-gray-300" size={20} />
          </Link>

          {/* Notifications Bell Icon with Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-gray-700"
              title="Notifications"
            >
              <Bell className="text-gray-300" />
            </button>
            {showNotifications && <NotificationsDropdown />}
          </div>

          {/* Messages Icon */}
          <Link to="/messages" className="p-2 rounded-full hover:bg-gray-700" title="Messages">
            <MessageSquare className="text-gray-300" />
          </Link>

          {/* User Profile Icon */}
          <Link
            to={user ? `/profile/${user._id}` : '/login'}
            className="p-1 rounded-full hover:bg-gray-700"
            title="My Profile"
          >
            <img
              src={userAvatar}
              alt={user?.fullName || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
