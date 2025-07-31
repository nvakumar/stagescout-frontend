import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { Link } from 'react-router-dom';
import CreateGroupModal from '../components/CreateGroupModal';
import { Users, Menu, X } from 'lucide-react'; // Import necessary icons

// Define the shape of the Group data
interface GroupAdmin {
  _id: string;
  fullName: string;
}

interface Group {
  _id: string;
  name: string;
  description: string;
  members: string[];
  admin: GroupAdmin;
  coverImage: string;
}

// A new component for the loading state skeleton UI
const GroupCardSkeleton = () => (
  <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg animate-pulse border border-gray-700/50">
    <div className="w-full h-32 bg-gray-700"></div>
    <div className="p-4">
      <div className="w-3/4 h-6 bg-gray-700 rounded mb-2"></div>
      <div className="w-full h-4 bg-gray-700 rounded mb-1"></div>
      <div className="w-5/6 h-4 bg-gray-700 rounded mb-3"></div>
      <div className="w-1/4 h-3 bg-gray-700 rounded"></div>
      <div className="w-full h-10 bg-gray-700 rounded-md mt-4"></div>
    </div>
  </div>
);

const GroupsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar
  const { token } = useAuth();

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await api.get('/api/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <>
      <div className="bg-gray-900 min-h-screen text-white">
        <Header />

        {/* Mobile Sidebar Drawer */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
            <div className="w-64 bg-gray-900 border-r border-gray-800 h-full p-4 overflow-y-auto">
              <div className="flex justify-end mb-4">
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-gray-700">
                  <X size={24} />
                </button>
              </div>
              <LeftSidebar />
            </div>
            <div className="flex-1 bg-black/60" onClick={() => setIsSidebarOpen(false)}></div>
          </div>
        )}

        <main className="pt-20 container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
            {/* Desktop Left Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-20">
                <LeftSidebar />
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-9">
               {/* Mobile Menu Button */}
               <div className="lg:hidden flex items-center mb-4">
                <button onClick={() => setIsSidebarOpen(true)} className="flex items-center p-2 rounded-md hover:bg-gray-700">
                  <Menu size={24} />
                  <span className="ml-2 font-semibold">Menu</span>
                </button>
              </div>

              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Discover Groups</h1>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transform hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Users size={16} />
                  <span>Create Group</span>
                </button>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <GroupCardSkeleton />
                  <GroupCardSkeleton />
                  <GroupCardSkeleton />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.length > 0 ? (
                    groups.map(group => (
                      <div key={group._id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700/50 transition-transform hover:-translate-y-1">
                          <img src={group.coverImage} alt={`${group.name} cover`} className="w-full h-32 object-cover" />
                          <div className="p-4 flex flex-col flex-grow">
                              <h2 className="text-xl font-bold text-white truncate">{group.name}</h2>
                              <p className="text-gray-400 text-sm mt-1 h-10 overflow-hidden flex-grow">{group.description}</p>
                              <p className="text-xs text-gray-500 mt-2">{group.members.length} members</p>
                              <Link to={`/groups/${group._id}`} className="mt-4 inline-block w-full text-center py-2 font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors">
                                  View Group
                              </Link>
                          </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                      <Users size={48} className="mx-auto text-indigo-400" />
                      <h3 className="text-xl font-semibold mt-4">No Groups Found</h3>
                      <p className="text-gray-400 mt-2">Why not be the first to create one?</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {isModalOpen && (
        <CreateGroupModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            fetchGroups();
          }} 
        />
      )}
    </>
  );
};

export default GroupsPage;
