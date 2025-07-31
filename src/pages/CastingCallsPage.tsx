import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import CastingCallCard from '../components/CastingCallCard';
import CreateCastingCallModal from '../components/CreateCastingCallModal';

// Define the shape of the Casting Call data locally
interface CastingCallUser {
  _id: string;
  fullName: string;
  role: string;
}
interface CastingCall {
  _id:string;
  user: CastingCallUser;
  projectTitle: string;
  projectType: string;
  roleDescription: string;
  roleType: string;
  location: string;
  applicationDeadline: string;
  contactEmail: string; // Ensure this matches the child component
}

const CastingCallsPage = () => {
  const [castingCalls, setCastingCalls] = useState<CastingCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuth();

  const fetchCastingCalls = useCallback(async (isInitialLoad = false) => {
    if (!token) {
      setIsLoading(false);
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
      <main className="pt-16 container mx-auto px-4">
        <div className="flex">
          <LeftSidebar />
          <div className="flex-grow p-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Casting Calls</h1>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Post a Casting Call
              </button>
            </div>
            {isLoading ? (
              <p>Loading casting calls...</p>
            ) : (
              <div className="space-y-6">
                {castingCalls.length > 0 ? (
                  castingCalls.map(call => (
                    <CastingCallCard key={call._id} call={call} />
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">No active casting calls at the moment.</p>
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
