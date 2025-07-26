import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import io, { Socket } from 'socket.io-client';
import api from '@/lib/api';

interface Attachment {
  name: string;
  url: string;
  size: string;
  type: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  attachments?: Attachment[];
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
  lastActivity?: number;
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
  applicationId?: string;
  applicationStatus?: string;
  appliedDate?: string;
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
  const sentMessagesRef = useRef<Set<string>>(new Set());
  
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
    
    // Initialize data with proper error handling
    const initializeData = async () => {
      try {
        // Always fetch conversations first
        await fetchConversations();
        
        // Then fetch chat partners if we don't have cached data
        if (!chatPartnersCache.current || Date.now() - chatPartnersCache.current.timestamp > 300000) {
          await fetchChatPartners();
        } else {
          setChatPartners(chatPartnersCache.current.data);
        }
      } catch (error) {
        console.error('Error initializing chat data:', error);
      }
    };
    
    initializeData();
    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user?.id]);
  
  // Socket event handling
  const setupSocketEvents = (socket: Socket) => {
    socket.on('new_message', (data: { message: Message }) => {
      const { message } = data;
      
      // Check if we just sent this message ourselves
      const messageKey = `${message.senderId}-${message.content}-${message.timestamp}`;
      if (sentMessagesRef.current.has(messageKey)) {
        sentMessagesRef.current.delete(messageKey);
        return;
      }
      
      setMessages(prev => ({
        ...prev,
        [message.conversationId]: [
          ...(prev[message.conversationId] || []),
          message
        ]
      }));
      
      // Update conversations and sort them
      setConversations(prev => {
        const updatedConversations = prev.map(conv => {
          if (conv.id === message.conversationId) {
            const unreadCount = message.senderId !== user?.id 
              ? conv.unreadCount + 1 
              : conv.unreadCount;
              
            return {
              ...conv,
              lastMessage: message,
              unreadCount,
              lastActivity: new Date(message.timestamp).getTime()
            };
          }
          return conv;
        });
        
        // Sort by most recent activity
        return updatedConversations.sort((a, b) => {
          const aTime = a.lastActivity || (a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0);
          const bTime = b.lastActivity || (b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0);
          return bTime - aTime;
        });
      });
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
      const { messageId, conversationId } = data;
      
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
      console.log('Fetching conversations...');
      
      const response = await api.get('/messages/conversations');
      
      if (response.data && response.data.data && response.data.data.conversations) {
        const conversations = response.data.data.conversations;
        console.log(`Loaded ${conversations.length} conversations`);
        setConversations(conversations);
      } else {
        console.log('No conversations data in response');
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };
  
  const fetchChatPartners = async () => {
    try {
      // Check cache first (increase cache time to 5 minutes)
      const now = Date.now();
      if (chatPartnersCache.current && (now - chatPartnersCache.current.timestamp) < 300000) {
        setChatPartners(chatPartnersCache.current.data);
        return;
      }
      
      // Prevent multiple simultaneous requests
      if (loadingChatPartners) {
        return;
      }
      
      setLoadingChatPartners(true);
      console.log('Fetching chat partners...');
      
      const response = await api.get('/messages/chat-partners');
      
      const partnersData = response.data.data.chatPartners || [];
      console.log(`Loaded ${partnersData.length} chat partners`);
      
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
    if (fetchingMessages.current.has(conversationId)) return;
    
    try {
      fetchingMessages.current.add(conversationId);
      setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));
      
      const response = await api.get(`/messages/${conversationId}`);
      const messagesList = response.data.data.messages || [];
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: messagesList
      }));
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
  
  const selectConversation = useCallback(async (conversation: Conversation) => {
    console.log(`Selecting conversation ${conversation.id}`);
    
    setLoadingMessages(prev => ({ ...prev, [conversation.id]: true }));
    
    try {
      // Initialize the messages array for this conversation even if empty
      if (!messages[conversation.id]) {
        setMessages(prev => ({
          ...prev,
          [conversation.id]: [] // Initialize with empty array
        }));
      }
      
      // Fetch messages
      const response = await api.get(`/messages/${conversation.id}`);
      const messagesList = response.data.data.messages || [];
      
      setMessages(prev => ({
        ...prev,
        [conversation.id]: messagesList
      }));
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversation.id}:`, error);
      // Still initialize with empty array on error
      setMessages(prev => ({
        ...prev,
        [conversation.id]: []
      }));
    } finally {
      setLoadingMessages(prev => ({ ...prev, [conversation.id]: false }));
    }
  }, [messages]);
  
  const sendMessage = async (conversationId: string, content: string, messageType: string = 'general') => {
    try {
      const response = await api.post(`/messages/${conversationId}`, {
        content,
        messageType,
        priority: 'medium'
      });
      
      const sentMessage = response.data.data.message;
      
      // Track message to prevent duplication
      const messageKey = `${sentMessage.senderId}-${sentMessage.content}-${sentMessage.timestamp}`;
      sentMessagesRef.current.add(messageKey);
      
      setTimeout(() => {
        sentMessagesRef.current.delete(messageKey);
      }, 5000);
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), sentMessage]
      }));
      
      // Update conversations with sorting
      setConversations(prev => {
        const updatedConversations = prev.map(conv => 
          conv.id === conversationId ? {
            ...conv,
            lastMessage: sentMessage,
            lastActivity: new Date(sentMessage.timestamp).getTime()
          } : conv
        );
        
        return updatedConversations.sort((a, b) => {
          const aTime = a.lastActivity || (a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0);
          const bTime = b.lastActivity || (b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0);
          return bTime - aTime;
        });
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error sending message:', error);
      return Promise.reject(error);
    }
  };
  
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
      
      // Refresh conversations
      await fetchConversations();
      
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };
  
  const markAsRead = (conversationId: string, messageId: string) => {
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    }));
    
    api.post(`/messages/${conversationId}/read`, { messageId }).catch(error => {
      console.error('Error marking message as read:', error);
    });
    
    if (socket && socket.connected) {
      socket.emit('message_read', { conversationId, messageId });
    }
  };
  
  // Add this new function to batch mark messages as read
  const markAllAsRead = useCallback(async (conversationId: string, messageIds: string[]) => {
    if (!messageIds.length) return;
    
    try {
      // Call API only once with all message IDs
      await api.post(`/messages/${conversationId}/read`, { messageIds });
      
      // Update local message state
      setMessages(prev => {
        const conversationMessages = prev[conversationId] || [];
        if (!conversationMessages.length) return prev;
        
        const updatedMessages = conversationMessages.map(msg => {
          if (messageIds.includes(msg.id) && !msg.read) {
            return { ...msg, read: true };
          }
          return msg;
        });
        
        return {
          ...prev,
          [conversationId]: updatedMessages
        };
      });
      
      // Update conversation unread count
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);
  
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
      await api.post(`/messages/${conversationId}/archive`);
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, archived: true } : conv
        )
      );
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };
  
  const deleteConversation = async (conversationId: string) => {
    try {
      await api.delete(`/messages/${conversationId}`);
      
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[conversationId];
        return newMessages;
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };
  
  // Add to ChatContext
  const refreshConversations = async () => {
    console.log('Refreshing conversations...');
    await fetchConversations();
  };
  
  // Add to the context value
  return (
    <ChatContext.Provider value={{
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
      fetchChatPartners,
      refreshConversations, // Add this
      markAllAsRead, // Add this new function
    }}>
      {children}
    </ChatContext.Provider>
  );
}