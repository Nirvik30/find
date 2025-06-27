import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getSocket, initializeSocket, useSocket } from '@/lib/socket';

// Types from your Messages component
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'recruiter' | 'hr' | 'hiring_manager' | 'system';
  senderCompany: string;
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

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: Message;
  unreadCount: number;
  jobId?: string;
  jobTitle?: string;
  company: string;
  archived: boolean;
}

interface Participant {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  isOnline?: boolean;
  isTyping?: boolean;
  lastSeen?: string;
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

interface ChatContextType {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string, messageId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  onlineUsers: string[];
  typingUsers: Record<string, boolean>;
  isConnected: boolean;
  loadingConversations: boolean;
  loadingMessages: Record<string, boolean>;
  selectConversation: (conversation: Conversation) => void; // Added this
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const { isConnected } = useSocket(user?.id || '', token || '');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  
  // Update the useEffect that initializes socket connections
  useEffect(() => {
    // Get token from localStorage if not available from context
    const authToken = token || localStorage.getItem('token');
    const userId = user?.id;
    
    if (!userId || !authToken) return;
    
    const socket = initializeSocket(userId, authToken);
    if (!socket) return;
    
    // Initialize listeners for real-time events
    socket.on("new_message", (message: Message) => {
      // Add to messages
      setMessages(prev => ({
        ...prev,
        [message.conversationId]: [
          ...(prev[message.conversationId] || []),
          message
        ]
      }));
      
      // Update last message in conversation
      setConversations(prev => prev.map(conv => 
        conv.id === message.conversationId 
          ? { 
              ...conv, 
              lastMessage: message, 
              unreadCount: message.senderId !== user.id 
                ? conv.unreadCount + 1 
                : conv.unreadCount 
            }
          : conv
      ));
    });
    
    socket.on("message_read", ({ conversationId, messageId, userId }) => {
      if (userId === user.id) return; // Skip if this user read the message
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      }));
    });
    
    socket.on("typing_start", ({ conversationId, userId, userName }) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: true
      }));
      
      // Update participant typing status
      setConversations(prev => prev.map(conv => {
        if (conv.id !== conversationId) return conv;
        
        return {
          ...conv,
          participants: conv.participants.map(p => 
            p.id === userId ? { ...p, isTyping: true } : p
          )
        };
      }));
    });
    
    socket.on("typing_end", ({ conversationId, userId }) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: false
      }));
      
      // Update participant typing status
      setConversations(prev => prev.map(conv => {
        if (conv.id !== conversationId) return conv;
        
        return {
          ...conv,
          participants: conv.participants.map(p => 
            p.id === userId ? { ...p, isTyping: false } : p
          )
        };
      }));
    });
    
    socket.on("user_online", ({ userId, isOnline }) => {
      if (isOnline) {
        setOnlineUsers(prev => [...prev, userId]);
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      }
      
      // Update participant online status
      setConversations(prev => prev.map(conv => ({
        ...conv,
        participants: conv.participants.map(p => 
          p.id === userId ? { ...p, isOnline } : p
        )
      })));
    });
    
    // Fetch initial conversations
    fetchConversations();
    
    return () => {
      socket.off("new_message");
      socket.off("message_read");
      socket.off("typing_start");
      socket.off("typing_end");
      socket.off("user_online");
    };
  }, [user, token]);
  
  // Fetch conversations (replace with your API call)
  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      // Mock data - replace with API call later
      setTimeout(() => {
        const mockConversations: Conversation[] = [
          {
            id: 'conv1',
            participants: [
              {
                id: 'rec1',
                name: 'Sarah Johnson',
                role: 'HR Manager',
                company: 'TechCorp Inc',
                avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
                isOnline: true,
                isTyping: false,
                lastSeen: new Date().toISOString()
              }
            ],
            lastMessage: {
              id: 'msg1',
              conversationId: 'conv1',
              senderId: 'rec1',
              senderName: 'Sarah Johnson',
              senderRole: 'hr',
              senderCompany: 'TechCorp Inc',
              subject: 'Interview Invitation',
              content: 'Hi! We\'d like to invite you for an interview for the Frontend Developer position.',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              read: false,
              starred: false,
              messageType: 'interview',
              priority: 'high'
            },
            unreadCount: 1,
            jobId: 'job1',
            jobTitle: 'Senior Frontend Developer',
            company: 'TechCorp Inc',
            archived: false
          },
          {
            id: 'conv2',
            participants: [
              {
                id: 'rec2',
                name: 'Michael Chen',
                role: 'Technical Recruiter',
                company: 'StartupXYZ',
                avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                isOnline: false,
                isTyping: false,
                lastSeen: new Date(Date.now() - 86400000).toISOString()
              }
            ],
            lastMessage: {
              id: 'msg2',
              conversationId: 'conv2',
              senderId: 'rec2',
              senderName: 'Michael Chen',
              senderRole: 'recruiter',
              senderCompany: 'StartupXYZ',
              subject: 'Application Status Update',
              content: 'Your application for React Developer position is now under review.',
              timestamp: new Date(Date.now() - 172800000).toISOString(),
              read: true,
              starred: true,
              messageType: 'application_update',
              priority: 'medium'
            },
            unreadCount: 0,
            jobId: 'job2',
            jobTitle: 'React Developer',
            company: 'StartupXYZ',
            archived: false
          },
          {
            id: 'conv3',
            participants: [
              {
                id: 'rec3',
                name: 'Emily Davis',
                role: 'Hiring Manager',
                company: 'Enterprise Solutions',
                avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
                isOnline: true,
                isTyping: false,
                lastSeen: new Date().toISOString()
              }
            ],
            lastMessage: {
              id: 'msg3',
              conversationId: 'conv3',
              senderId: 'rec3',
              senderName: 'Emily Davis',
              senderRole: 'hiring_manager',
              senderCompany: 'Enterprise Solutions',
              subject: 'Job Offer',
              content: 'We\'re pleased to offer you the position of Senior Software Engineer!',
              timestamp: new Date(Date.now() - 259200000).toISOString(),
              read: true,
              starred: false,
              messageType: 'offer',
              priority: 'high'
            },
            unreadCount: 0,
            jobId: 'job3',
            jobTitle: 'Senior Software Engineer',
            company: 'Enterprise Solutions',
            archived: false
          }
        ];
        
        setConversations(mockConversations);
        setLoadingConversations(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoadingConversations(false);
    }
  };
  
  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));
    try {
      // Mock data - replace with API call later
      setTimeout(() => {
        const mockMessages: Record<string, Message[]> = {
          'conv1': [
            {
              id: 'msg1-1',
              conversationId: 'conv1',
              senderId: 'rec1',
              senderName: 'Sarah Johnson',
              senderRole: 'hr',
              senderCompany: 'TechCorp Inc',
              senderAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
              subject: 'Interview Invitation',
              content: 'Hi! We\'d like to invite you for an interview for the Frontend Developer position. Are you available this Thursday at 2 PM?',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              read: false,
              starred: false,
              messageType: 'interview',
              priority: 'high',
            }
          ],
          'conv2': [
            {
              id: 'msg2-1',
              conversationId: 'conv2',
              senderId: 'rec2',
              senderName: 'Michael Chen',
              senderRole: 'recruiter',
              senderCompany: 'StartupXYZ',
              senderAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
              subject: 'Application Received',
              content: 'Thank you for your application to the React Developer position at StartupXYZ.',
              timestamp: new Date(Date.now() - 259200000).toISOString(),
              read: true,
              starred: false,
              messageType: 'application_update',
              priority: 'medium',
            },
            {
              id: 'msg2-2',
              conversationId: 'conv2',
              senderId: 'rec2',
              senderName: 'Michael Chen',
              senderRole: 'recruiter',
              senderCompany: 'StartupXYZ',
              senderAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
              subject: 'Application Status Update',
              content: 'Your application for the React Developer position is now under review. We\'ll get back to you soon.',
              timestamp: new Date(Date.now() - 172800000).toISOString(),
              read: true,
              starred: true,
              messageType: 'application_update',
              priority: 'medium',
            },
            {
              id: 'msg2-3',
              conversationId: 'conv2',
              senderId: user?.id || 'current-user',
              senderName: user?.name || 'You',
              senderRole: 'recruiter',
              senderCompany: 'JobFinder',
              subject: 'Re: Application Status Update',
              content: 'Thank you for the update. I\'m looking forward to hearing back from you.',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              read: true,
              starred: false,
              messageType: 'general',
              priority: 'medium',
            }
          ],
          'conv3': [
            {
              id: 'msg3-1',
              conversationId: 'conv3',
              senderId: 'rec3',
              senderName: 'Emily Davis',
              senderRole: 'hiring_manager',
              senderCompany: 'Enterprise Solutions',
              senderAvatar: 'https://randomuser.me/api/portraits/women/22.jpg',
              subject: 'Job Offer',
              content: 'We\'re pleased to offer you the position of Senior Software Engineer! The salary is $135,000 per year with benefits including health insurance, 401k matching, and flexible work hours.',
              timestamp: new Date(Date.now() - 259200000).toISOString(),
              read: true,
              starred: false,
              messageType: 'offer',
              priority: 'high',
              attachments: [
                {
                  id: 'att1',
                  name: 'Offer_Letter.pdf',
                  size: '1.2 MB',
                  type: 'application/pdf',
                  url: '#'
                }
              ]
            }
          ]
        };
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: mockMessages[conversationId] || []
        }));
        
        setLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
        
        // Mark conversation as read
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        ));
      }, 500);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
    }
  }, []);
  
  // Send a new message
  const sendMessage = async (conversationId: string, content: string) => {
    if (!content.trim() || !conversationId) return;
    
    const socket = getSocket();
    if (!socket) return;
    
    try {
      // Generate a temporary id for optimistic updates
      const tempId = `temp-${Date.now()}`;
      
      // Create a message object
      const message: Message = {
        id: tempId,
        conversationId,
        senderId: user?.id || 'current-user',
        senderName: user?.name || 'You',
        senderRole: 'recruiter', // Default
        senderCompany: 'JobFinder',
        subject: 'Reply',
        content,
        timestamp: new Date().toISOString(),
        read: true,
        starred: false,
        messageType: 'general',
        priority: 'medium'
      };
      
      // Optimistic update
      setMessages(prev => ({
        ...prev,
        [conversationId]: [
          ...(prev[conversationId] || []),
          message
        ]
      }));
      
      // Update conversation's last message
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, lastMessage: message }
          : conv
      ));
      
      // Send via socket
      socket.emit("send_message", { message, conversationId });
      
      // Handle response - normally would replace temp ID with real ID
      socket.once("message_sent", (response: { tempId: string, realMessage: Message }) => {
        if (response.tempId === tempId) {
          // Replace temp message with real one
          setMessages(prev => ({
            ...prev,
            [conversationId]: prev[conversationId].map(msg => 
              msg.id === tempId ? response.realMessage : msg
            )
          }));
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Mark a message as read
  const markAsRead = (conversationId: string, messageId: string) => {
    const socket = getSocket();
    if (!socket) return;
    
    socket.emit("mark_read", { conversationId, messageId });
    
    // Optimistic update
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    }));
  };
  
  // Typing indicators
  const startTyping = (conversationId: string) => {
    const socket = getSocket();
    if (!socket) return;
    
    socket.emit("typing_start", { conversationId });
  };
  
  const stopTyping = (conversationId: string) => {
    const socket = getSocket();
    if (!socket) return;
    
    socket.emit("typing_end", { conversationId });
  };
  
  // Fix 2: Define the selectConversation function directly in the component
  const selectConversation = useCallback((conversation: Conversation) => {
    if (!messages[conversation.id]) {
      fetchMessages(conversation.id);
    }
  }, [messages, fetchMessages]);
  
  // Fix 3: Include selectConversation in the value object from the start
  const value = useMemo(() => ({
    conversations,
    messages,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    onlineUsers,
    typingUsers,
    isConnected,
    loadingConversations,
    loadingMessages,
    selectConversation
  }), [
    conversations,
    messages,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    onlineUsers,
    typingUsers,
    isConnected,
    loadingConversations,
    loadingMessages,
    selectConversation
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};