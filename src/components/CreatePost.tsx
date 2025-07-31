import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ImagePlus } from 'lucide-react';

type CreatePostProps = {
  onPostCreated: () => void;
  groupId?: string;
};

const CreatePost = ({ onPostCreated, groupId }: CreatePostProps) => {
  const { user, token } = useAuth(); // Get user to display avatar
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter some text for your post.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    if (groupId) {
      formData.append('groupId', groupId);
    }
    if (file) {
      formData.append('file', file);
    }

    try {
      await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      
      setTitle('');
      setFile(null);
      onPostCreated();

    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const userAvatar = user?.profilePictureUrl || user?.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${user?.fullName?.charAt(0) || 'U'}`;

  return (
    <div className="bg-gray-800 p-3 sm:p-4 rounded-lg mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
          <img 
            src={userAvatar} 
            alt={user?.fullName || 'User'} 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
          />
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder={groupId ? "Post to the group..." : "Share your work..."}
            rows={3}
            required
          />
        </div>
        
        {/* Responsive controls container */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:pl-16">
          <div className="flex space-x-4 mb-4 sm:mb-0">
            <label htmlFor="file-upload" className="flex items-center space-x-2 cursor-pointer text-gray-400 hover:text-white">
              <ImagePlus size={20} /> 
              <span className="text-sm sm:text-base">Add Photo/Video</span>
            </label>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* File preview and error messages */}
        <div className="sm:pl-16 mt-2">
          {file && <p className="text-sm text-gray-400">Selected: {file.name}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
