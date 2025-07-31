import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { XCircle, MapPin, Search, Menu, X } from 'lucide-react';

// Define the shape of the User object we expect from the search API
interface SearchedUser {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
  profilePictureUrl?: string;
  location?: string;
}

// All possible roles
const allRoles = [
  'All Roles', 'Actor', 'Model', 'Filmmaker', 'Director', 'Writer',
  'Photographer', 'Editor', 'Musician', 'Creator', 'Student', 'Production House'
];

// Skeleton loader for search results
const UserCardSkeleton = () => (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center text-center space-y-3 animate-pulse">
        <div className="w-24 h-24 rounded-full bg-gray-700"></div>
        <div className="w-3/4 h-6 bg-gray-700 rounded"></div>
        <div className="w-1/2 h-4 bg-gray-700 rounded"></div>
    </div>
);

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || 'All Roles');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');

  const [results, setResults] = useState<SearchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchResults = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      setError('You must be logged in to search.');
      return;
    }
    
    if (!query.trim() && selectedRole === 'All Roles' && !locationFilter.trim()) { 
      setResults([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      let queryString = `q=${encodeURIComponent(query.trim())}`;
      if (selectedRole !== 'All Roles') {
        queryString += `&role=${encodeURIComponent(selectedRole)}`;
      }
      if (locationFilter.trim()) {
        queryString += `&location=${encodeURIComponent(locationFilter.trim())}`;
      }

      const response = await api.get(`/api/users/search?${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load search results.");
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedRole, locationFilter, token]);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSelectedRole(searchParams.get('role') || 'All Roles');
    setLocationFilter(searchParams.get('location') || '');
  }, [searchParams]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams();
    if (query.trim()) newSearchParams.set('q', query.trim());
    if (selectedRole !== 'All Roles') newSearchParams.set('role', selectedRole);
    if (locationFilter.trim()) newSearchParams.set('location', locationFilter.trim());
    
    navigate(`/search?${newSearchParams.toString()}`);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <Header />

      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
          <div className="w-64 bg-gray-900 border-r border-gray-800 h-full p-4 overflow-y-auto">
            <div className="flex justify-end mb-4"><button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-gray-700"><X size={24} /></button></div>
            <LeftSidebar />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setIsSidebarOpen(false)}></div>
        </div>
      )}

      <main className="pt-20 container mx-auto px-4 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20"><LeftSidebar /></div>
          </aside>
          
          <div className="col-span-12 lg:col-span-9">
            <div className="lg:hidden flex items-center mb-4">
              <button onClick={() => setIsSidebarOpen(true)} className="flex items-center p-2 rounded-md hover:bg-gray-700">
                <Menu size={24} /><span className="ml-2 font-semibold">Menu</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold mb-6">Discover Talent</h1>

            <form onSubmit={handleSearchSubmit} className="bg-gray-800 p-6 rounded-lg mb-6 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, role, or keywords..."
                  className="w-full p-3 pl-10 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-300 mb-1">Filter by Role</label>
                  <select id="roleFilter" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full p-3 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {allRoles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-300 mb-1">Filter by Location</label>
                  <div className="relative">
                    <input type="text" id="locationFilter" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="e.g., Hyderabad" className="w-full p-3 pl-10 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full px-6 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                Apply Filters
              </button>
            </form>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <UserCardSkeleton key={i} />)}
              </div>
            ) : error ? (
              <p className="text-red-400 flex items-center justify-center py-10"><XCircle size={16} className="mr-2"/> {error}</p>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((user) => (
                  <Link to={`/profile/${user._id}`} key={user._id} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center text-center space-y-3 hover:bg-gray-700 transition-colors transform hover:-translate-y-1">
                    <img 
                      src={user.profilePictureUrl || user.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${user.fullName?.charAt(0) || 'U'}`}
                      alt={user.fullName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500"
                    />
                    <div>
                      <p className="font-semibold text-lg text-white">{user.fullName}</p>
                      <p className="text-gray-400 text-sm">{user.role}</p>
                      {user.location && <p className="text-gray-500 text-xs flex items-center justify-center mt-1"><MapPin size={12} className="mr-1"/> {user.location}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-10">
                {query.trim() || selectedRole !== 'All Roles' || locationFilter.trim() ? `No users found matching your criteria.` : 'Start by searching for talent!'}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchResultsPage;
