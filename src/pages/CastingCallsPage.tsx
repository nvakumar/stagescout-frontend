import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import CastingCallCard from '../components/CastingCallCard';
import CreateCastingCallModal from '../components/CreateCastingCallModal';
import { Briefcase, Menu, X } from 'lucide-react'; // Import necessary icons

// Define the shape of the Casting Call data
interface CastingCallUser {
  _id: string;
  fullName: string;
  role: string;
}
interface CastingCall {
  _id: string;
  user: CastingCallUser;
  projectTitle: string;
  projectType: string;
  roleDescription: string;
  roleType: string;
  location: string;
  applicationDeadline: string;
  contactEmail: string;
}

// A new component for the loading state skeleton UI
const CastingCallSkeleton = () => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-pulse border border-gray-700/50">
    <div className="w-3/4 h-6 bg-gray-700 rounded mb-2"></div>
    <div className="w-1/2 h-4 bg-gray-700 rounded mb-4"></div>
    <div className="space-y-2">
      <div className="w-full h-4 bg-gray-700 rounded"></div>
      <div className="w-full h-4 bg-gray-700 rounded"></div>
      <div className="w-5/6 h-4 bg-gray-700 rounded"></div>
    </div>
    <div className="w-full h-10 bg-gray-700 rounded-md mt-6"></div>
  </div>
);

const CastingCallsPage = () => {
  const [castingCalls, setCastingCalls] = useState<CastingCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar
  const { token } = useAuth();

  const fetchCastingCalls = useCallback(async (isInitialLoad = false) => {
    if (!token) {
      if (isInitialLoad) setIsLoading(false);
      return;
    }
    if (isInitialLoad) setIsLoading(true);
    try {
      const response = await api.get('/api/casting-calls', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCastingCalls(response.data);
    } catch (error) {
      console.error("Failed to fetch casting calls:", error);
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCastingCalls(true);
  }, [fetchCastingCalls]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchCastingCalls(false); // Refresh silently
  };

  return (
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
              <h1 className="text-2xl sm:text-3xl font-bold">Casting Calls</h1>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transform hover:scale-105 transition-transform"
              >
                Post a Call
              </button>
            </div>
            
            {isLoading ? (
              <div className="space-y-6">
                <CastingCallSkeleton />
                <CastingCallSkeleton />
              </div>
            ) : (
              <div className="space-y-6">
                {castingCalls.length > 0 ? (
                  castingCalls.map(call => (
                    <CastingCallCard key={call._id} call={call} />
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                    <Briefcase size={48} className="mx-auto text-indigo-400" />
                    <h3 className="text-xl font-semibold mt-4">No Casting Calls Yet</h3>
                    <p className="text-gray-400 mt-2">
                      Be the first to post a casting call and discover new talent!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <CreateCastingCallModal 
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default CastingCallsPage;
