import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import io, { Socket } from 'socket.io-client';
import api from '@/lib/api';

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'recruiter' | 'hr' | 'hiring_manager' | 'system' | 'applicant';
  senderCompany?: string;
  senderAvatar?: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  attachments?: Attachment[];
  jobId?: string;
  jobTitle?: string;
  messageType: 'interview' | 'application_update' | 'general' | 'offer' | 'rejection' | 'system';
  priority: 'high' | 'medium' | 'low';
}

interface Participant {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar?: string;
  isOnline?: boolean;
  isTyping?: boolean;
  lastSeen?: string;
  jobPosition?: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: Message | null;
  unreadCount: number;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  archived: boolean;
  status?: string;
}

interface ChatPartner {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  company?: string;
  jobTitle?: string;
  jobId?: string;
  applicationStatus?: string;
}

interface ChatContextType {
  conversations: Conversation[];
  messages: { [key: string]: Message[] };
  chatPartners: ChatPartner[];
  sendMessage: (conversationId: string, content: string, messageType?: string) => Promise<void>;
  selectConversation: (conversation: Conversation) => void;
  createConversation: (partnerId: string, jobId?: string, initialMessage?: string) => Promise<string>;
  markAsRead: (conversationId: string, messageId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  toggleStar: (messageId: string) => void;
  archiveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  onlineUsers: Set<string>;
  isConnected: boolean;
  loadingConversations: boolean;
  loadingMessages: { [key: string]: boolean };
  loadingChatPartners: boolean;
  fetchChatPartners: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [chatPartners, setChatPartners] = useState<ChatPartner[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<{ [key: string]: boolean }>({});
  const [loadingChatPartners, setLoadingChatPartners] = useState<boolean>(false);
  
  const socketRef = useRef<Socket | null>(null);
  const chatPartnersCache = useRef<{ data: ChatPartner[]; timestamp: number } | null>(null);
  const fetchingMessages = useRef<Set<string>>(new Set());
  const checkedEmptyConversations = useRef<Set<string>>(new Set());
  const lastFetchTimestamps = useRef<{ [key: string]: number }>({});
  
  // Initialize socket connection
  useEffect(() => {
    if (!user?.id) return;
    
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const socketUrl = baseUrl.replace('/api', '');
    
    const newSocket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket']
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });
    
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setIsConnected(false);
    });
    
    setupSocketEvents(newSocket);
    
    setSocket(newSocket);
    socketRef.current = newSocket;
    
    // Fetch initial data
    fetchConversations();
    fetchChatPartners();
    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user?.id]);
  
  // Socket event handling remains the same
  const setupSocketEvents = (socket: Socket) => {
    socket.on('new_message', (data: { message: Message }) => {
      const { message } = data;
      
      // Remove from empty conversations set if we receive a message
      if (checkedEmptyConversations.current.has(message.conversationId)) {
        checkedEmptyConversations.current.delete(message.conversationId);
      }
      
      setMessages(prev => ({
        ...prev,
        [message.conversationId]: [
          ...(prev[message.conversationId] || []),
          message
        ]
      }));
      
      setConversations(prev => 
        prev.map(conv => {
          if (conv.id === message.conversationId) {
            const unreadCount = message.senderId !== user?.id 
              ? conv.unreadCount + 1 
              : conv.unreadCount;
              
            return {
              ...conv,
              lastMessage: message,
              unreadCount
            };
          }
          return conv;
        })
      );
    });
    
    socket.on('user_online', (data: { userId: string }) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
      
      setConversations(prev => 
        prev.map(conv => ({
          ...conv,
          participants: conv.participants.map(p => 
            p.id === data.userId ? { ...p, isOnline: true } : p
          )
        }))
      );
    });
    
    socket.on('user_offline', (data: { userId: string }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      
      setConversations(prev => 
        prev.map(conv => ({
          ...conv,
          participants: conv.participants.map(p => 
            p.id === data.userId ? { ...p, isOnline: false, lastSeen: new Date().toISOString() } : p
          )
        }))
      );
    });
    
    socket.on('typing_started', (data: { userId: string; conversationId: string }) => {
      setConversations(prev => 
        prev.map(conv => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              participants: conv.participants.map(p => 
                p.id === data.userId ? { ...p, isTyping: true } : p
              )
            };
          }
          return conv;
        })
      );
    });
    
    socket.on('typing_stopped', (data: { userId: string; conversationId: string }) => {
      setConversations(prev => 
        prev.map(conv => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              participants: conv.participants.map(p => 
                p.id === data.userId ? { ...p, isTyping: false } : p
              )
            };
          }
          return conv;
        })
      );
    });
    
    socket.on('message_read', (data: { messageId: string, conversationId: string, readBy: string }) => {
      const { messageId, conversationId, readBy } = data;
      
      // Update the message's read status
      setMessages(prev => {
        const conversationMessages = prev[conversationId];
        if (!conversationMessages) return prev;
        
        return {
          ...prev,
          [conversationId]: conversationMessages.map(msg => 
            msg.id === messageId ? { ...msg, read: true } : msg
          )
        };
      });
    });
  };
  
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      // Use cache-busting header to ensure fresh data
      const response = await api.get('/messages/conversations', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      setConversations(response.data.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };
  
  const fetchChatPartners = async () => {
    try {
      // Check cache first (cache for 5 minutes)
      const now = Date.now();
      if (chatPartnersCache.current && (now - chatPartnersCache.current.timestamp) < 300000) {
        setChatPartners(chatPartnersCache.current.data);
        return;
      }
      
      setLoadingChatPartners(true);
      const response = await api.get('/messages/chat-partners', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const partnersData = response.data.data.chatPartners || [];
      
      // Update cache
      chatPartnersCache.current = {
        data: partnersData,
        timestamp: now
      };
      
      setChatPartners(partnersData);
    } catch (error) {
      console.error('Error fetching chat partners:', error);
      setChatPartners([]);
    } finally {
      setLoadingChatPartners(false);
    }
  };
  
  const fetchMessages = async (conversationId: string) => {
    // Don't fetch if we've already checked this conversation and found it empty
    if (checkedEmptyConversations.current.has(conversationId)) {
      setMessages(prev => ({
        ...prev,
        [conversationId]: []
      }));
      setLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
      return;
    }
    
    // Prevent multiple simultaneous requests for the same conversation
    if (fetchingMessages.current.has(conversationId)) {
      return;
    }
    
    try {
      fetchingMessages.current.add(conversationId);
      setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));
      
      const response = await api.get(`/messages/${conversationId}`, {
        // No cache headers to reduce redundant requests
        validateStatus: function (status) {
          return status < 500; // Only reject if server error
        }
      });
      
      if (response.status === 200) {
        const messagesList = response.data.data.messages || [];
        
        // If the conversation has no messages, mark it as checked
        if (messagesList.length === 0) {
          checkedEmptyConversations.current.add(conversationId);
        }
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: messagesList
        }));
      }
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      setMessages(prev => ({
        ...prev,
        [conversationId]: []
      }));
    } finally {
      fetchingMessages.current.delete(conversationId);
      setLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
    }
  };
  
  const selectConversation = useCallback((conversation: Conversation) => {
    // Only fetch messages if they don't exist yet
    if (!messages[conversation.id]) {
      fetchMessages(conversation.id);
    }
    
    // Do NOT update conversation unread count here, let the backend handle it
    // when messages are marked as read
  }, [messages]);
  
  const createConversation = async (partnerId: string, jobId?: string, initialMessage?: string): Promise<string> => {
    try {
      const response = await api.post('/messages', {
        participantId: partnerId,
        jobId,
        initialMessage: initialMessage ? {
          content: initialMessage,
          messageType: 'general',
          priority: 'medium'
        } : undefined
      });
      
      const conversationId = response.data.data.conversationId;
      
      // Remove from empty conversations if we had it there
      if (checkedEmptyConversations.current.has(conversationId)) {
        checkedEmptyConversations.current.delete(conversationId);
      }
      
      // Refresh conversations after creating new one
      await fetchConversations();
      
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };
  
  const sendMessage = async (conversationId: string, content: string, messageType: string = 'general') => {
    try {
      // Remove from empty conversations if we had it there
      if (checkedEmptyConversations.current.has(conversationId)) {
        checkedEmptyConversations.current.delete(conversationId);
      }
      
      const response = await api.post(`/messages/${conversationId}`, {
        content,
        messageType,
        priority: 'medium'
      });
      
      const sentMessage = response.data.data.message;
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), sentMessage]
      }));
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, lastMessage: sentMessage } : conv
        )
      );
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error sending message:', error);
      return Promise.reject(error);
    }
  };
  
  const markAsRead = (conversationId: string, messageId: string) => {
    // Update UI immediately
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    }));
    
    // Send API request to update on server
    api.post(`/messages/${conversationId}/read`, { messageId }).catch(error => {
      console.error('Error marking message as read:', error);
    });
    
    // Also emit socket event for real-time updates
    if (socket && socket.connected) {
      socket.emit('message_read', { conversationId, messageId });
    }
  };
  
  const startTyping = (conversationId: string) => {
    if (!socket || !socket.connected) return;
    socket.emit('typing_start', { conversationId });
  };
  
  const stopTyping = (conversationId: string) => {
    if (!socket || !socket.connected) return;
    socket.emit('typing_stop', { conversationId });
  };
  
  const toggleStar = (messageId: string) => {
    let targetConversationId = '';
    
    for (const [conversationId, messageList] of Object.entries(messages)) {
      const message = messageList.find(msg => msg.id === messageId);
      if (message) {
        targetConversationId = conversationId;
        break;
      }
    }
    
    if (!targetConversationId) return;
    
    setMessages(prev => ({
      ...prev,
      [targetConversationId]: prev[targetConversationId].map(msg => {
        if (msg.id === messageId) {
          const newStarred = !msg.starred;
          
          api.post(`/messages/${targetConversationId}/${messageId}/star`, { 
            starred: newStarred 
          }).catch(error => {
            console.error('Error toggling star:', error);
          });
          
          return { ...msg, starred: newStarred };
        }
        return msg;
      })
    }));
  };
  
  const archiveConversation = async (conversationId: string) => {
    try {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, archived: true } : conv
        )
      );
      
      await api.post(`/messages/${conversationId}/archive`);
      return Promise.resolve();
    } catch (error) {
      console.error('Error archiving conversation:', error);
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, archived: false } : conv
        )
      );
      
      return Promise.reject(error);
    }
  };
  
  const deleteConversation = async (conversationId: string) => {
    try {
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      await api.delete(`/messages/${conversationId}`);
      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      fetchConversations();
      return Promise.reject(error);
    }
  };
  
  return (
    <ChatContext.Provider
      value={{
        conversations,
        messages,
        chatPartners,
        sendMessage,
        selectConversation,
        createConversation,
        markAsRead,
        startTyping,
        stopTyping,
        toggleStar,
        archiveConversation,
        deleteConversation,
        onlineUsers,
        isConnected,
        loadingConversations,
        loadingMessages,
        loadingChatPartners,
        fetchChatPartners
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}