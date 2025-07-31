import { useState, useEffect } from 'react';
import { X, UploadCloud, FileText } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// FIX: This interface now matches the full UserProfile object to prevent type errors
interface UserProfile {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  followers: string[];
  following: string[];
  resumeUrl?: string;
  profilePictureUrl?: string;
  location?: string;
  coverPhotoUrl?: string;
}

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void; 
  initialData: UserProfile; 
};

const EditProfileModal = ({ isOpen, onClose, onSuccess, initialData }: EditProfileModalProps) => {
  const { user, token, login } = useAuth();
  
  const [fullName, setFullName] = useState(initialData.fullName || '');
  const [username, setUsername] = useState(initialData.username || '');
  const [location, setLocation] = useState(initialData.location || '');
  const [bio, setBio] = useState(initialData.bio || '');
  const [skills, setSkills] = useState(initialData.skills ? initialData.skills.join(', ') : '');
  
  const [profilePictureUrl, setProfilePictureUrl] = useState(initialData.profilePictureUrl || '');
  const [resumeUrl, setResumeUrl] = useState(initialData.resumeUrl || '');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || '');
      setUsername(initialData.username || '');
      setLocation(initialData.location || '');
      setBio(initialData.bio || '');
      setSkills(initialData.skills ? initialData.skills.join(', ') : '');
      setProfilePictureUrl(initialData.profilePictureUrl || '');
      setResumeUrl(initialData.resumeUrl || '');
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setError('');
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setError('');
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !token) return profilePictureUrl;
    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const response = await api.post('/api/users/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setProfilePictureUrl(response.data.profilePictureUrl);
      setAvatarFile(null);
      return response.data.profilePictureUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload profile picture.');
      throw err;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const uploadResume = async () => {
    if (!resumeFile || !token) return resumeUrl;
    setIsUploadingResume(true);
    const formData = new FormData();
    formData.append('resume', resumeFile);
    try {
      const response = await api.post('/api/users/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setResumeUrl(response.data.resumeUrl);
      setResumeFile(null);
      return response.data.resumeUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload resume.');
      throw err;
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const finalProfilePictureUrl = avatarFile ? await uploadAvatar() : profilePictureUrl;
      const finalResumeUrl = resumeFile ? await uploadResume() : resumeUrl;
      const updatedSkills = skills.split(',').map(s => s.trim()).filter(s => s);
      
      const response = await api.put('/api/users/me', {
        fullName,
        username,
        location,
        bio,
        skills: updatedSkills,
        profilePictureUrl: finalProfilePictureUrl,
        resumeUrl: finalResumeUrl,
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (user && token) {
        login(response.data, token);
      }
      
      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Edit Your Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {error && <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-md">{error}</div>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">Full Name</label>
              <input type="text" name="fullName" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
              <input type="text" name="username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300">Location</label>
            <input type="text" name="location" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Hyderabad, Mumbai" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img src={avatarFile ? URL.createObjectURL(avatarFile) : profilePictureUrl || 'https://placehold.co/150x150/1a202c/ffffff?text=Avatar'} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover border-2 border-gray-700" />
              <label htmlFor="avatar-upload" className="w-full sm:w-auto cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center space-x-2">
                <UploadCloud size={20} />
                <span>{isUploadingAvatar ? 'Uploading...' : 'Upload New Photo'}</span>
                <input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarFileChange} accept="image/*" disabled={isUploadingAvatar} />
              </label>
            </div>
            {avatarFile && <p className="text-sm text-gray-400 mt-2">Selected: {avatarFile.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Resume</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {resumeUrl ? (
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center space-x-2">
                  <FileText size={20} />
                  <span>View Current Resume</span>
                </a>
              ) : <p className="text-gray-400 text-sm">No resume uploaded.</p>}
              <label htmlFor="resume-upload" className="w-full sm:w-auto cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center space-x-2">
                <UploadCloud size={20} />
                <span>{isUploadingResume ? 'Uploading...' : 'Upload New Resume'}</span>
                <input id="resume-upload" type="file" className="hidden" onChange={handleResumeFileChange} accept=".pdf,.doc,.docx" disabled={isUploadingResume} />
              </label>
            </div>
            {resumeFile && <p className="text-sm text-gray-400 mt-2">Selected: {resumeFile.name}</p>}
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300">Bio</label>
            <textarea name="bio" id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" placeholder="Tell us about yourself..."></textarea>
            <p className="text-xs text-gray-400 text-right">{bio.length}/500</p>
          </div>

          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-300">Skills (comma-separated)</label>
            <input type="text" name="skills" id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Acting, Voice Over" />
          </div>
        </form>

        <div className="p-4 sm:p-6 border-t border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting || isUploadingAvatar || isUploadingResume} className="w-full sm:w-auto px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
