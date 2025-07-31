import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import UserListModal from '../components/UserListModal';
import {  FileText,  Award, XCircle, MapPin, Menu, X, LogOut, Camera } from 'lucide-react';

// --- TYPE DEFINITIONS ---
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

// FIX: Updated Post interface to be comprehensive and match PostCard's expected props
interface Post {
  _id: string;
  user: UserProfile;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'Photo' | 'Video';
  likes: string[];
  comments: any[];
  reactions: any[];
  group?: { _id: string; admin: string };
}

interface SimpleUser {
  _id: string;
  fullName: string;
  username: string;
  role: string;
  avatar?: string;
  location?: string;
}

interface LeaderboardEntry {
  userId: string;
}

// --- SKELETON LOADER ---
const ProfileSkeleton = () => (
    <div className="animate-pulse">
        <div className="bg-gray-800 rounded-lg mt-6">
            <div className="h-48 md:h-64 bg-gray-700 rounded-t-lg"></div>
            <div className="p-4 md:p-8">
                <div className="flex flex-col md:flex-row">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-700 -mt-20 md:-mt-24 border-4 border-gray-800"></div>
                    <div className="md:ml-8 mt-4 md:mt-0 w-full">
                        <div className="h-8 w-1/2 bg-gray-700 rounded"></div>
                        <div className="h-6 w-1/4 bg-gray-700 rounded mt-2"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, token, login, logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);


  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState<SimpleUser[]>([]);
  const [followingList, setFollowingList] = useState<SimpleUser[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [listError, setListError] = useState('');

  const [isOnLeaderboard, setIsOnLeaderboard] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/users/${id}`);
      const fetchedProfile: UserProfile = response.data.user;
      const fetchedPosts: Post[] = response.data.posts;

      setProfile(fetchedProfile);
      setPosts(fetchedPosts);
      setFollowersCount(fetchedProfile.followers.length);

      if (currentUser && fetchedProfile.followers.includes(currentUser._id)) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUser]);

  const fetchUserList = async (listType: 'followers' | 'following') => {
    if (!profile || !token) return;
    setIsLoadingLists(true);
    setListError('');
    try {
      const ids = listType === 'followers' ? profile.followers : profile.following;
      const userPromises = ids.map(userId => api.get(`/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } }));
      const userResponses = await Promise.all(userPromises);
      const fetchedUsers: SimpleUser[] = userResponses.map(res => ({
        _id: res.data.user._id,
        fullName: res.data.user.fullName,
        username: res.data.user.username,
        role: res.data.user.role,
        avatar: res.data.user.profilePictureUrl,
        location: res.data.user.location,
      }));

      if (listType === 'followers') setFollowersList(fetchedUsers);
      else setFollowingList(fetchedUsers);

    } catch (err: any) {
      setListError(`Failed to load ${listType}.`);
    } finally {
      setIsLoadingLists(false);
    }
  };

  useEffect(() => {
    const checkLeaderboardStatus = async () => {
      if (!id || !token) return;
      try {
        const response = await api.get('/api/leaderboard', { headers: { Authorization: `Bearer ${token}` } });
        setIsOnLeaderboard(response.data.some((entry: LeaderboardEntry) => entry.userId === id));
      } catch (err) {
        setIsOnLeaderboard(false);
      }
    };
    checkLeaderboardStatus();
  }, [id, token]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleFollowToggle = async () => {
    if (!currentUser || !token || !profile) return;
    setIsFollowing(!isFollowing);
    setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);
    try {
      const endpoint = isFollowing ? `/api/users/${profile._id}/follow` : `/api/users/${profile._id}/follow`;
      const method = isFollowing ? 'delete' : 'post';
      await api[method](endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchProfileData(); 
    }
    catch (err: any) {
      setIsFollowing(isFollowing);
      setFollowersCount(isFollowing ? followersCount + 1 : followersCount - 1);
      alert(err.response?.data?.message || 'Failed to update follow status.');
    }
  };

  const handleEditSuccess = (updatedUser: UserProfile) => {
    setProfile(updatedUser);
    if (currentUser && token && currentUser._id === updatedUser._id) {
        login(updatedUser, token);
    }
    setIsEditModalOpen(false);
  };

  const handleMessageUser = () => {
    if (profile) navigate(`/messages?with=${profile._id}`); 
  };
  
  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(currentPosts => currentPosts.filter(p => p._id !== deletedPostId));
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(currentPosts =>
      currentPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const openFollowersModal = () => {
    setShowFollowersModal(true);
    fetchUserList('followers');
  };

  const openFollowingModal = () => {
    setShowFollowingModal(true);
    fetchUserList('following');
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('cover', file);
      setIsUploadingCover(true);
      try {
        const response = await api.post('/api/users/upload/cover', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        setProfile(prev => prev ? { ...prev, coverPhotoUrl: response.data.coverPhotoUrl } : null);
      } catch (err) {
        alert('Failed to upload cover photo.');
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 min-h-screen text-white">
        <Header />
        <main className="pt-20 container mx-auto px-4"><ProfileSkeleton /></main>
      </div>
    );
  }

  if (error) {
    return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center"><XCircle size={24} className="mr-2"/> {error}</div>;
  }

  if (!profile) return null;
  
  const userAvatar = profile.profilePictureUrl || profile.avatar || `https://placehold.co/150x150/1a202c/ffffff?text=${profile.fullName.charAt(0)}`;
  const isOwnProfile = currentUser && currentUser._id === profile._id;

  return (
    <div className="bg-gray-900 min-h-screen text-white">
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
      <main className="pt-20 container mx-auto px-4">
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
            <div className="bg-gray-800 rounded-lg shadow-lg">
                <div className="h-32 md:h-48 bg-cover bg-center rounded-t-lg relative" style={{backgroundImage: `url(${profile.coverPhotoUrl || 'https://placehold.co/1200x400/1a202c/1a202c?text=+'})`}}>
                  {isOwnProfile && (
                    <>
                      <input type="file" ref={coverPhotoInputRef} onChange={handleCoverPhotoUpload} className="hidden" accept="image/*" />
                      <button onClick={() => coverPhotoInputRef.current?.click()} disabled={isUploadingCover} className="absolute top-4 right-4 bg-black/50 text-white py-1.5 px-3 rounded-lg flex items-center text-xs hover:bg-black/75 transition-colors">
                        <Camera size={14} className="mr-2" />
                        {isUploadingCover ? 'Uploading...' : 'Edit Cover'}
                      </button>
                    </>
                  )}
                </div>
                <div className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row">
                        <div className="relative flex-shrink-0 -mt-16 sm:-mt-24">
                            <img src={userAvatar} alt={profile.fullName} className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-gray-800 object-cover" />
                            {isOnLeaderboard && (
                                <div className="absolute bottom-2 right-2 bg-yellow-500 rounded-full p-1.5 border-2 border-gray-800" title="Top Talent">
                                    <Award size={20} className="text-white" />
                                </div>
                            )}
                        </div>
                        <div className="sm:ml-6 mt-4 sm:mt-0 w-full">
                            <div className="flex flex-col sm:flex-row items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                                    <p className="text-md text-gray-400">@{profile.username}</p>
                                    <p className="text-lg text-indigo-400 mt-1">{profile.role}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                    {isOwnProfile ? (
                                        <>
                                            <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-1.5 text-sm rounded-md font-semibold text-white bg-gray-700 hover:bg-gray-600 transition-colors">
                                                Edit Profile
                                            </button>
                                            <button onClick={logout} className="px-4 py-1.5 text-sm rounded-md font-semibold text-red-400 bg-gray-700 hover:bg-red-900/50 transition-colors flex items-center gap-2">
                                                <LogOut size={16} />
                                            </button>
                                        </>
                                    ) : currentUser && (
                                        <>
                                            <button onClick={handleFollowToggle} disabled={!token} className={`px-4 py-1.5 text-sm rounded-md font-semibold transition-colors ${isFollowing ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                            <button onClick={handleMessageUser} className="px-4 py-1.5 text-sm rounded-md font-semibold text-white bg-gray-700 hover:bg-gray-600 transition-colors">
                                                Message
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex space-x-6 mt-4 text-gray-300">
                                <div><span className="font-bold text-white">{posts.length}</span> posts</div>
                                <button onClick={openFollowersModal} className="hover:text-white transition-colors">
                                    <span className="font-bold text-white">{followersCount}</span> followers
                                </button>
                                <button onClick={openFollowingModal} className="hover:text-white transition-colors">
                                    <span className="font-bold text-white">{profile.following.length}</span> following
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 border-t border-gray-700 pt-4">
                        <p className="font-bold text-white">About</p>
                        {profile.location && (
                            <p className="text-gray-400 text-sm mt-1 flex items-center">
                                <MapPin size={14} className="mr-2" /> {profile.location}
                            </p>
                        )}
                        <p className="text-gray-300 mt-2 whitespace-pre-wrap text-sm">{profile.bio || 'This user has not added a bio yet.'}</p>
                        {profile.skills && profile.skills.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {profile.skills.map(skill => <span key={skill} className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">{skill}</span>)}
                            </div>
                        )}
                        {profile.resumeUrl && (
                            <div className="mt-4">
                                <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-400 hover:underline flex items-center">
                                    <FileText size={16} className="mr-2" /> View Resume
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Portfolio</h2>
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map(post => (
                    <PostCard
                        key={post._id}
                        post={post}
                        onPostDeleted={handlePostDeleted}
                        onPostUpdated={handlePostUpdated}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-800 rounded-lg"><p className="text-gray-400">This user hasn't posted any work yet.</p></div>
              )}
            </div>
          </div>
        </div>
      </main>
      {profile && isEditModalOpen && (
        <EditProfileModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            onSuccess={handleEditSuccess} 
            initialData={profile} 
        />
      )}
      <UserListModal isOpen={showFollowersModal} onClose={() => setShowFollowersModal(false)} title="Followers" users={followersList} isLoading={isLoadingLists} error={listError} />
      <UserListModal isOpen={showFollowingModal} onClose={() => setShowFollowingModal(false)} title="Following" users={followingList} isLoading={isLoadingLists} error={listError} />
    </div>
  );
};

export default ProfilePage;
