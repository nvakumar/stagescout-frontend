import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, ChevronRight, Loader2, XCircle } from 'lucide-react'; // Import necessary icons

// Define the shape of a leaderboard entry
interface LeaderboardEntry {
  userId: string;
  fullName: string;
  role: string;
  avatar?: string;
  totalLikes: number;
  totalPosts: number;
  engagementScore: number;
}

// Define the roles for the filter dropdown
const roles = [
  'All Roles', 'Actor', 'Model', 'Filmmaker', 'Director', 'Writer',
  'Photographer', 'Editor', 'Musician', 'Creator', 'Student', 'Production House'
];

const LeaderboardWidget = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const { token } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!token) {
        setError('Not authenticated.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const queryParams = selectedRole !== 'All Roles' ? `?role=${selectedRole}` : '';
        const response = await api.get(`/api/leaderboard${queryParams}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeaderboard(response.data);
      } catch (err: any) {
        console.error("Failed to fetch leaderboard:", err);
        setError(err.response?.data?.message || "Failed to load leaderboard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token, selectedRole]);

  return (
    // Responsive padding for the main container
    <div className="bg-gray-800 p-3 sm:p-4 rounded-lg shadow-lg">
      {/* Responsive title font size */}
      <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center">
        <Award size={24} className="mr-2 text-yellow-400" /> Top Talent
      </h2>

      {/* Role Filter */}
      <div className="mb-4">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full p-2 text-sm text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center text-gray-400 p-4">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span>Loading...</span>
        </div>
      ) : error ? (
        <div className="flex items-center text-red-400 bg-red-900/20 p-3 rounded-md">
          <XCircle size={18} className="mr-2" />
          <p className="text-sm">{error}</p>
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <Link
              to={`/profile/${entry.userId}`}
              key={entry.userId}
              className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                {/* Responsive rank font size */}
                <span className="font-bold text-base sm:text-lg text-indigo-400 w-6 text-center">{index + 1}.</span>
                {/* Responsive avatar size */}
                <img
                  src={entry.avatar || `https://placehold.co/50x50/1a202c/ffffff?text=${entry.fullName.charAt(0)}`}
                  alt={entry.fullName}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-700"
                />
                <div>
                  {/* Responsive name font size */}
                  <p className="font-semibold text-white text-sm sm:text-base">{entry.fullName}</p>
                  <p className="text-xs sm:text-sm text-gray-400">{entry.role}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300 font-medium">{entry.engagementScore.toFixed(0)} pts</span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center p-4">No entries on the leaderboard yet.</p>
      )}
    </div>
  );
};

export default LeaderboardWidget;
