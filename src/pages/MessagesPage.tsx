import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate} from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { Send, XCircle,  Menu, X, ArrowLeft, MessageSquare, Search } from 'lucide-react';

// --- TYPE DEFINITIONS ---
interface Participant {
  _id: string;
  fullName: string;
  avatar?: string;
  profilePictureUrl?: string;
  role: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  sender: Participant;
  receiver: string;
  text: string;
  createdAt: string;
}

// --- SKELETON LOADER COMPONENTS ---
const ConversationSkeleton = () => (
  <div className="flex items-center space-x-3 p-3 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-gray-700"></div>
    <div className="flex-1 space-y-2">
      <div className="w-3/4 h-4 bg-gray-700 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-700 rounded"></div>
    </div>
  </div>
);

const MessageSkeleton = () => (
  <>
    <div className="flex justify-start"><div className="w-2/5 h-12 bg-gray-700 rounded-lg"></div></div>
    <div className="flex justify-end"><div className="w-1/2 h-16 bg-indigo-700/50 rounded-lg"></div></div>
    <div className="flex justify-start"><div className="w-1/3 h-8 bg-gray-700 rounded-lg"></div></div>
  </>
);


const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!token) {
      setError('Not authenticated. Please log in.');
      setIsLoadingConversations(false);
      return;
    }
    setIsLoadingConversations(true);
    setError('');
    try {
      const response = await api.get('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data);
      setFilteredConversations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // BUG FIX: This useEffect now waits for the initial conversation load to finish before running.
  useEffect(() => {
    if (isLoadingConversations) return; // Don't run while initial conversations are loading

    const recipientId = searchParams.get('with');
    if (recipientId && currentUser && recipientId !== currentUser._id && !isCreatingConversation) {
      const existingConv = conversations.find(conv =>
        conv.participants.some(p => p._id === recipientId)
      );

      if (existingConv) {
        setSelectedConversation(existingConv);
        navigate('/messages', { replace: true });
      } else {
        setIsCreatingConversation(true);
        const createNewConversation = async () => {
          try {
            const response = await api.post('/api/messages/conversations', { receiverId: recipientId }, {
              headers: { Authorization: `Bearer ${token}` },
            });
            // Add the new conversation and de-duplicate the list
            setConversations(prev => Array.from(new Map([...prev, response.data].map(c => [c._id, c])).values()));
            setSelectedConversation(response.data);
          } catch (err: any) {
            setError(err.response?.data?.message || "Failed to start new conversation.");
          } finally {
            setIsCreatingConversation(false);
            navigate('/messages', { replace: true });
          }
        };
        createNewConversation();
      }
    }
  }, [searchParams, conversations, currentUser, token, navigate, isCreatingConversation, isLoadingConversations]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation || !token) {
        setMessages([]);
        return;
      }
      setIsLoadingMessages(true);
      setError('');
      try {
        const response = await api.get(`/api/messages/${selectedConversation._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load messages.");
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedConversation, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter conversations based on search input
  useEffect(() => {
    if (conversationSearch.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const searchLower = conversationSearch.toLowerCase();
      setFilteredConversations(
        conversations.filter(conv => {
          const otherParticipant = getOtherParticipant(conv);
          return otherParticipant?.fullName.toLowerCase().includes(searchLower);
        })
      );
    }
  }, [conversationSearch, conversations]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedConversation || !currentUser || !token) return;
    try {
      const recipient = selectedConversation.participants.find(p => p._id !== currentUser._id);
      if (!recipient) {
        setError("Recipient not found.");
        return;
      }
      const response = await api.post('/api/messages', {
        conversationId: selectedConversation._id,
        receiver: recipient._id,
        text: newMessageText,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => [...prev, { ...response.data, sender: currentUser }]);
      setNewMessageText('');
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send message.");
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== currentUser?._id);
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
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 h-full">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20"><LeftSidebar /></div>
          </aside>

          <div className="col-span-12 lg:col-span-9 h-full">
            <div className="lg:hidden flex items-center mb-4">
              <button onClick={() => setIsSidebarOpen(true)} className="flex items-center p-2 rounded-md hover:bg-gray-700">
                <Menu size={24} /><span className="ml-2 font-semibold">Menu</span>
              </button>
            </div>
            
            <div className="flex bg-gray-800 rounded-lg shadow-lg h-[calc(100vh-10rem)] overflow-hidden">
              {/* Conversation List */}
              <div className={`w-full md:w-1/3 border-r border-gray-700 flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                  <h2 className="text-xl font-bold mb-4">Conversations</h2>
                  <div className="relative">
                    <input type="text" placeholder="Search conversations..." value={conversationSearch} onChange={(e) => setConversationSearch(e.target.value)} className="w-full p-2 pl-8 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                {isLoadingConversations ? (
                  <div className="p-2 space-y-2">{[...Array(5)].map((_, i) => <ConversationSkeleton key={i} />)}</div>
                ) : error ? (
                  <p className="p-4 text-red-400 flex items-center"><XCircle size={16} className="mr-2"/> {error}</p>
                ) : filteredConversations.length > 0 ? (
                  <div className="flex-grow overflow-y-auto space-y-1 p-2">
                    {filteredConversations.map(conv => {
                      const otherParticipant = getOtherParticipant(conv);
                      if (!otherParticipant) return null;
                      return (
                        <button key={conv._id} onClick={() => setSelectedConversation(conv)} className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors duration-200 ${selectedConversation?._id === conv._id ? 'bg-indigo-700' : 'hover:bg-gray-700'}`}>
                          <img src={otherParticipant.profilePictureUrl || otherParticipant.avatar || `https://placehold.co/50x50/1a202c/ffffff?text=${otherParticipant.fullName.charAt(0)}`} alt={otherParticipant.fullName} className="w-12 h-12 rounded-full object-cover" />
                          <div>
                            <p className="font-semibold text-white">{otherParticipant.fullName}</p>
                            <p className="text-sm text-gray-400">{otherParticipant.role}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="p-4 text-gray-400 text-center">No conversations found.</p>
                )}
              </div>

              {/* Chat Window */}
              <div className={`w-full md:w-2/3 flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                {selectedConversation ? (
                  <>
                    <div className="border-b border-gray-700 p-4 flex items-center flex-shrink-0">
                      <button onClick={() => setSelectedConversation(null)} className="md:hidden mr-4 p-2 rounded-full hover:bg-gray-700"><ArrowLeft size={20} /></button>
                      <h3 className="text-xl font-bold text-white">Chat with {getOtherParticipant(selectedConversation)?.fullName}</h3>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-4 p-4">
                      {isLoadingMessages ? (
                         <div className="space-y-4 animate-pulse"><MessageSkeleton /></div>
                      ) : messages.length > 0 ? (
                        messages.map(msg => (
                          <div key={msg._id} className={`flex ${msg.sender._id === currentUser?._id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender._id === currentUser?._id ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                              <p className="text-sm text-white">{msg.text}</p>
                              <p className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center pt-10">Send a message to start the conversation!</p>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 flex space-x-2 border-t border-gray-700 flex-shrink-0">
                      <textarea value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} placeholder="Type your message..." rows={1} className="flex-grow p-3 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                      <button type="submit" disabled={!newMessageText.trim()} className="p-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 text-white transition-colors"><Send size={20} /></button>
                    </form>
                  </>
                ) : (
                  <div className="flex-grow flex-col items-center justify-center text-gray-400 hidden md:flex">
                    <MessageSquare size={48} className="mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold">Select a conversation</h3>
                    <p>...or start a new one from a user's profile.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
