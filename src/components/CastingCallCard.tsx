// src/components/CastingCallCard.tsx
import { useState } from 'react';
import { MapPin, Calendar, Film, UserCheck, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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

type CastingCallCardProps = {
  call: CastingCall;
};

const CastingCallCard = ({ call }: CastingCallCardProps) => {
  const { token } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false); // State to track application status
  const [error, setError] = useState('');

  const handleApply = async () => {
    setIsApplying(true);
    setError('');
    try {
      // This endpoint would create an in-app notification for the casting director
      // NOTE: The backend for this endpoint needs to be created.
      await api.post(`/api/casting-calls/${call._id}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsApplied(true); // Update state on success
    } catch (err) {
      console.error("Failed to apply:", err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    // ENHANCED RESPONSIVENESS: Increased gap on larger screens for better spacing.
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 lg:gap-8">
      <div className="flex-grow w-full">
        {/* Header */}
        <div className="flex items-center mb-2">
          <p className="text-sm text-gray-400">Posted by <Link to={`/profile/${call.user._id}`} className="font-semibold text-indigo-400 hover:underline">{call.user.fullName}</Link></p>
        </div>
        
        {/* Main Info */}
        <h2 className="text-xl sm:text-2xl font-bold text-white break-words">{call.projectTitle}</h2>
        <p className="text-lg text-indigo-300 font-medium mt-1">{call.roleType} Role</p>
        <p className="text-gray-300 mt-3 break-words">{call.roleDescription}</p>

        {/* Details */}
        {/* ENHANCED RESPONSIVENESS: Uses a grid for small-to-medium screens for better alignment, then flex for larger screens. */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row md:flex-wrap items-start md:items-center gap-y-3 gap-x-6 text-sm text-gray-400">
          <span className="flex items-center"><Film size={16} className="mr-2 text-indigo-400 flex-shrink-0" /> {call.projectType}</span>
          <span className="flex items-center"><MapPin size={16} className="mr-2 text-indigo-400 flex-shrink-0" /> {call.location}</span>
          <span className="flex items-center"><Calendar size={16} className="mr-2 text-indigo-400 flex-shrink-0" /> Apply by {new Date(call.applicationDeadline).toLocaleDateString()}</span>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Action Button */}
      {/* ENHANCED RESPONSIVENESS: Added explicit vertical alignment for medium screens. */}
      <div className="flex-shrink-0 w-full md:w-auto md:self-center mt-4 md:mt-0">
        <button 
          onClick={handleApply}
          disabled={isApplying || isApplied}
          className={`w-full md:w-auto px-6 py-3 font-bold text-white rounded-md transition-colors duration-200 flex items-center justify-center ${
            isApplied 
              ? 'bg-green-600 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } ${isApplying ? 'bg-indigo-800 cursor-wait' : ''}`}
        >
          {isApplied ? (
            <>
              <CheckCircle size={18} className="mr-2" />
              Applied
            </>
          ) : (
            <>
              <UserCheck size={18} className="mr-2" />
              {isApplying ? 'Submitting...' : 'Apply Now'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CastingCallCard;
