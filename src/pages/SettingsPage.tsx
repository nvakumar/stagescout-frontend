import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { Key, Mail, Trash2, CheckCircle, XCircle, Menu, X } from 'lucide-react'; // Added Menu and X icons

const SettingsPage = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  // State for Change Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // State for Change Email form
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // State for Delete Account form
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // State for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  // Handle Change Password Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setIsChangingPassword(true);

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      setIsChangingPassword(false);
      return;
    }

    try {
      await api.put('/api/auth/change-password', { currentPassword, newPassword }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      console.error("Change password failed:", err);
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Change Email Submission
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);
    setIsChangingEmail(true);

    try {
      const response = await api.put('/api/auth/change-email', { newEmail, password: emailPassword }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmailMessage({ type: 'success', text: `Email updated to ${response.data.newEmail} successfully!` });
      setNewEmail('');
      setEmailPassword('');
    } catch (err: any) {
      console.error("Change email failed:", err);
      setEmailMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change email.' });
    } finally {
      setIsChangingEmail(false);
    }
  };

  // Handle Delete Account Submission
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteMessage(null);
    setIsDeletingAccount(true);

    if (!window.confirm('Are you absolutely sure you want to delete your account? This action is irreversible.')) {
      setIsDeletingAccount(false);
      return;
    }

    try {
      await api.delete('/api/auth/delete-account', {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: deletePassword }
      });
      setDeleteMessage({ type: 'success', text: 'Account deleted successfully. Redirecting...' });
      setDeletePassword('');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error("Delete account failed:", err);
      setDeleteMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete account.' });
    } finally {
      setIsDeletingAccount(false);
    }
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
            <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

            {/* Change Password Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Key size={20} className="mr-2 text-indigo-400" /> Change Password
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordMessage && (
                  <div className={`p-3 rounded-md text-sm flex items-center space-x-2 ${
                    passwordMessage.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-500/50' : 'bg-red-900/50 text-red-200 border border-red-500/50'
                  }`}>
                    {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300">Current Password</label>
                  <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">New Password</label>
                  <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-300">Confirm New Password</label>
                  <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button type="submit" disabled={isChangingPassword} className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500">
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Change Email Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Mail size={20} className="mr-2 text-indigo-400" /> Change Email
              </h2>
              <form onSubmit={handleChangeEmail} className="space-y-4">
                {emailMessage && (
                  <div className={`p-3 rounded-md text-sm flex items-center space-x-2 ${
                    emailMessage.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-500/50' : 'bg-red-900/50 text-red-200 border border-red-500/50'
                  }`}>
                    {emailMessage.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>{emailMessage.text}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium text-gray-300">New Email Address</label>
                  <input type="email" id="newEmail" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="emailPassword" className="block text-sm font-medium text-gray-300">Your Password</label>
                  <input type="password" id="emailPassword" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} required className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button type="submit" disabled={isChangingEmail} className="px-5 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500">
                  {isChangingEmail ? 'Updating...' : 'Update Email'}
                </button>
              </form>
            </div>

            {/* Delete Account Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Trash2 size={20} className="mr-2 text-red-400" /> Delete Account
              </h2>
              <p className="text-gray-400 mb-4">
                Permanently delete your Stage Scout account and all your data. This action is irreversible.
              </p>
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                {deleteMessage && (
                  <div className={`p-3 rounded-md text-sm flex items-center space-x-2 ${
                    deleteMessage.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-500/50' : 'bg-red-900/50 text-red-200 border border-red-500/50'
                  }`}>
                    {deleteMessage.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>{deleteMessage.text}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-300">Your Password</label>
                  <input type="password" id="deletePassword" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required className="mt-1 w-full p-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button type="submit" disabled={isDeletingAccount} className="px-5 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-500">
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
