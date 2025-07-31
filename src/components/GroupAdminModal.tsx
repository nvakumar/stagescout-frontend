import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X, UserX, ShieldAlert, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GroupMember {
  _id: string;
  fullName: string;
}

interface Group {
  _id: string;
  admin: { _id: string };
  members: GroupMember[];
}

interface GroupAdminModalProps {
  group: Group;
  onClose: () => void;
  onGroupUpdate: () => void;
}

// Define a type for the confirmation state
type ConfirmationState = {
  action: 'removeMember' | 'deleteGroup' | null;
  memberId?: string;
  message: string;
  confirmText: string;
};

const GroupAdminModal = ({ group, onClose, onGroupUpdate }: GroupAdminModalProps) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);

  const handleRemoveMember = async (memberId: string) => {
    try {
      await api.post(`/api/groups/${group._id}/remove-member`, { memberId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onGroupUpdate(); // Refresh group details
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert('Failed to remove member.');
    } finally {
      setConfirmation(null); // Close confirmation dialog
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await api.delete(`/api/groups/${group._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Group deleted successfully.');
      navigate('/groups'); // Navigate away after deletion
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert('Failed to delete group.');
    } finally {
      setConfirmation(null);
    }
  };

  // Function to trigger the confirmation modal
  const requestConfirmation = (state: ConfirmationState) => {
    setConfirmation(state);
  };

  // Function to handle the final confirmed action
  const onConfirm = () => {
    if (!confirmation) return;
    if (confirmation.action === 'removeMember' && confirmation.memberId) {
      handleRemoveMember(confirmation.memberId);
    } else if (confirmation.action === 'deleteGroup') {
      handleDeleteGroup();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">Manage Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <h3 className="font-semibold text-white">Members ({group.members.length})</h3>
          <ul className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {group.members.map(member => (
              <li key={member._id} className="flex justify-between items-center p-2 rounded hover:bg-gray-700/50">
                <span className="text-gray-300">{member.fullName}</span>
                {member._id !== group.admin._id && (
                  <button 
                    onClick={() => requestConfirmation({ action: 'removeMember', memberId: member._id, message: 'Are you sure you want to remove this member?', confirmText: 'Remove' })} 
                    title="Remove member" 
                    className="text-red-400 hover:text-red-600"
                  >
                    <UserX size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-700 pt-4">
            <h3 className="font-semibold text-red-500 flex items-center"><ShieldAlert size={18} className="mr-2"/> Danger Zone</h3>
            <p className="text-xs text-gray-400 mt-1">These actions are permanent and cannot be undone.</p>
            <button 
              onClick={() => requestConfirmation({ action: 'deleteGroup', message: 'Delete this group and all its posts permanently?', confirmText: 'Delete Group' })} 
              className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors"
            >
              <Trash2 size={16} className="mr-2"/> Delete Group Permanently
            </button>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
            <h3 className="text-xl font-bold text-white">Confirm Action</h3>
            <p className="text-gray-300">{confirmation.message}</p>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => setConfirmation(null)}
                className="px-6 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-6 py-2 font-bold text-white rounded-md ${confirmation.action === 'deleteGroup' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {confirmation.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupAdminModal;
