import { NavLink, Link } from 'react-router-dom';
import { Home, MessageSquare, Users, Briefcase, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LeftSidebar = () => {
  const { user, logout } = useAuth();

  const userAvatar = user?.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${user?.fullName?.charAt(0) || 'U'}`;

  return (
    // The parent container will control the width, this component is now flexible within it.
    <aside className="w-full p-4 flex-shrink-0 h-full flex flex-col">
      <div className="space-y-6 flex-grow">
        {/* User Profile Snippet */}
        {user && (
          <Link to={`/profile/${user._id}`} className="flex flex-col items-center p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200">
            <img 
              src={userAvatar} 
              alt={user.fullName} 
              // Responsive avatar size
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-indigo-500" 
            />
            {/* Responsive text size */}
            <p className="font-semibold text-white mt-3 text-base md:text-lg text-center">{user.fullName}</p>
            <p className="text-sm text-gray-400">{user.role}</p>
          </Link>
        )}

        {/* Main Navigation */}
        <nav className="space-y-2">
          <NavLink 
            to="/feed" 
            className={({ isActive }) => 
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Home size={20} /> <span>Home</span>
          </NavLink>
          <NavLink 
            to="/casting-calls" 
            className={({ isActive }) => 
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Briefcase size={20} /> <span>Casting Calls</span>
          </NavLink>
          <NavLink 
            to="/messages" 
            className={({ isActive }) => 
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <MessageSquare size={20} /> <span>Messages</span>
          </NavLink>
          <NavLink 
            to="/groups" 
            className={({ isActive }) => 
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Users size={20} /> <span>Groups</span>
          </NavLink>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Settings size={20} /> <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* Logout Button */}
      <div className="mt-6">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-3 p-3 rounded-lg bg-gray-700 text-red-400 hover:bg-red-900/50 transition-colors duration-200"
        >
          <LogOut size={20} /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;
