import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import GroupAdminModal from '../components/GroupAdminModal';
import { LogOut, UserPlus, Camera, Settings, Loader2, Menu, X } from 'lucide-react';

// --- TYPE DEFINITIONS (FIXED to be comprehensive) ---
interface PostAuthor {
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

interface Post {
  _id: string;
  user: PostAuthor;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'Photo' | 'Video';
  likes: string[];
  comments: { _id: string; user: PostAuthor; text: string; createdAt: string; }[];
  reactions: any[];
  group?: { _id: string; admin: string };
}

interface GroupMember {
  _id: string;
  fullName:string;
  avatar?: string;
  role: string;
}

interface GroupDetails {
  _id: string;
  name: string;
  description: string;
  coverImage: string;
  admin: {
    _id: string;
    fullName: string;
  };
  members: GroupMember[];
}

// --- SKELETON LOADER ---
const GroupDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 md:h-80 bg-gray-700 mt-16"></div>
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
        <aside className="hidden lg:block lg:col-span-3">
            <div className="space-y-4">
                <div className="h-48 bg-gray-700 rounded-lg"></div>
                <div className="h-64 bg-gray-700 rounded-lg"></div>
            </div>
        </aside>
        <div className="col-span-12 lg:col-span-9">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-grow space-y-6">
                    <div className="h-32 bg-gray-700 rounded-lg"></div>
                    <div className="h-80 bg-gray-700 rounded-lg"></div>
                </div>
                <div className="w-full md:w-80 lg:w-96 flex-shrink-0 space-y-6">
                    <div className="h-20 bg-gray-700 rounded-lg"></div>
                    <div className="h-64 bg-gray-700 rounded-lg"></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
);


const GroupDetailPage = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchGroupData = useCallback(async () => {
    if (!groupId || !token) return;
    try {
      const [groupRes, postsRes] = await Promise.all([
        api.get(`/api/groups/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/api/groups/${groupId}/posts`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setGroup(groupRes.data);
      setPosts(postsRes.data);

      if (user && groupRes.data.members.some((member: GroupMember) => member._id === user._id)) {
        setIsMember(true);
      } else {
        setIsMember(false);
      }
    } catch (error) {
      console.error("Failed to fetch group data:", error);
      navigate('/groups');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, token, user, navigate]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handlePostDeleted = (postId: string) => {
    setPosts(currentPosts => currentPosts.filter(p => p._id !== postId));
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(currentPosts =>
      currentPosts.map(p => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handleJoinLeave = async () => {
    if (!groupId || !token) return;
    setIsProcessing(true);
    const endpoint = isMember ? `/api/groups/${groupId}/leave` : `/api/groups/${groupId}/join`;
    try {
      await api.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchGroupData();
    } catch (error) {
      console.error(`Failed to ${isMember ? 'leave' : 'join'} group:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && groupId) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('coverImage', file);
      setIsUploadingCover(true);
      try {
        const response = await api.put(`/api/groups/${groupId}/cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        setGroup(response.data);
      } catch (error) {
        console.error("Failed to upload cover image:", error);
        alert("Failed to upload cover image.");
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  const isAdmin = !!(user && group && user._id === group.admin._id);

  if (isLoading) {
    return (
      <div className="bg-gray-900 min-h-screen text-white">
        <Header />
        <GroupDetailSkeleton />
      </div>
    );
  }

  if (!group) return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">Group not found.</div>;

  return (
    <>
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

        <div className="h-64 md:h-80 relative mt-16">
          <img src={group.coverImage} alt={`${group.name} cover`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-4 md:p-8">
            <h1 className="text-3xl md:text-5xl font-bold text-white">{group.name}</h1>
            <p className="text-md md:text-lg text-gray-300 mt-2">{group.description}</p>
          </div>
          {isAdmin && (
            <div className="absolute top-4 right-4 flex flex-col sm:flex-row gap-2">
              <input type="file" ref={fileInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingCover} className="bg-black/50 text-white py-2 px-3 rounded-lg flex items-center text-sm hover:bg-black/75 transition-colors">
                <Camera size={16} className="mr-2" />
                <span>{isUploadingCover ? 'Uploading...' : 'Change Cover'}</span>
              </button>
              <button onClick={() => setIsAdminModalOpen(true)} className="bg-black/50 text-white py-2 px-3 rounded-lg flex items-center text-sm hover:bg-black/75 transition-colors">
                <Settings size={16} className="mr-2" />
                <span>Manage</span>
              </button>
            </div>
          )}
        </div>

        <main className="container mx-auto px-4 py-6">
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
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-grow">
                  {isMember && <CreatePost onPostCreated={fetchGroupData} groupId={groupId} />}
                  <div className="space-y-6 mt-6">
                    {posts.length > 0 ? posts.map(post => (
                      <PostCard
                        key={post._id}
                        post={post}
                        groupAdminId={group.admin._id}
                        onPostDeleted={handlePostDeleted}
                        onPostUpdated={handlePostUpdated}
                      />
                    )) : (
                      <div className="text-center py-12 bg-gray-800 rounded-lg">
                        <p className="text-gray-400">No posts in this group yet. Be the first to share!</p>
                      </div>
                    )}
                  </div>
                </div>
                <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 space-y-6">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <button
                      onClick={handleJoinLeave}
                      disabled={isProcessing || isAdmin}
                      className={`w-full flex items-center justify-center py-2 px-4 font-bold rounded-md transition-colors ${isAdmin ? 'bg-gray-600 cursor-not-allowed' : isMember ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : isAdmin ? 'You are the Admin' : isMember ? <><LogOut size={18} className="mr-2" />Leave Group</> : <><UserPlus size={18} className="mr-2" />Join Group</>}
                    </button>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-4">Members ({group.members.length})</h3>
                    <ul className="space-y-3 max-h-96 overflow-y-auto">
                      {group.members.slice(0, 10).map((member) => (
                        <li key={member._id}>
                          <Link to={`/profile/${member._id}`} className="flex items-center space-x-3 hover:bg-gray-700/50 p-2 rounded-md">
                            <img src={member.avatar || `https://placehold.co/100x100/1a202c/ffffff?text=${member.fullName?.charAt(0) || 'U'}`} alt={member.fullName} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="font-semibold">{member.fullName}</p>
                              <p className="text-sm text-gray-400">{member.role}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </main>
      </div>
      {isAdminModalOpen && (
        <GroupAdminModal
          group={group}
          onClose={() => setIsAdminModalOpen(false)}
          onGroupUpdate={fetchGroupData}
        />
      )}
    </>
  );
};

export default GroupDetailPage;
