import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { X } from 'lucide-react';

type CreateCastingCallModalProps = {
  onClose: () => void;
  onSuccess: () => void; // To refresh the list after successful creation
};

const CreateCastingCallModal = ({ onClose, onSuccess }: CreateCastingCallModalProps) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectType: 'Feature Film',
    roleDescription: '',
    roleType: 'Lead',
    location: '',
    applicationDeadline: '',
    contactEmail: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/api/casting-calls', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess(); // Call the success callback to refresh the list
      onClose();   // Close the modal
    } catch (err: any) {
      console.error('Failed to create casting call:', err);
      const message = err.response?.data?.message || 'Failed to create casting call. Please check the form and try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Post a New Casting Call</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {error && <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-md">{error}</div>}
          
          <div>
            <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-300">Project Title</label>
            <input type="text" name="projectTitle" id="projectTitle" value={formData.projectTitle} onChange={handleChange} required className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label htmlFor="projectType" className="block text-sm font-medium text-gray-300">Project Type</label>
            <select name="projectType" id="projectType" value={formData.projectType} onChange={handleChange} className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Feature Film</option>
              <option>Short Film</option>
              <option>Web Series</option>
              <option>Advertisement</option>
              <option>Theatre</option>
            </select>
          </div>

          <div>
            <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-300">Role Description</label>
            <textarea name="roleDescription" id="roleDescription" value={formData.roleDescription} onChange={handleChange} required rows={4} className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>

          <div>
            <label htmlFor="roleType" className="block text-sm font-medium text-gray-300">Role Type</label>
            <select name="roleType" id="roleType" value={formData.roleType} onChange={handleChange} className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Lead</option>
              <option>Supporting</option>
              <option>Cameo</option>
              <option>Background</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300">Location</label>
              <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-300">Application Deadline</label>
              <input type="date" name="applicationDeadline" id="applicationDeadline" value={formData.applicationDeadline} onChange={handleChange} required className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-300">Contact Email</label>
            <input type="email" name="contactEmail" id="contactEmail" value={formData.contactEmail} onChange={handleChange} required className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">
            Cancel
          </button>
          <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500">
            {isSubmitting ? 'Posting...' : 'Post Casting Call'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCastingCallModal;
