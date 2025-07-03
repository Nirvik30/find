import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Send,
  Users,
  Phone,
  Video,
  MoreHorizontal,
  Paperclip,
  Clock,
  CheckCircle,
  User,
  Filter,
  ChevronRight,
  X,
  Calendar,
  CheckCheck,
  Check,
  Star,
  Archive,
  Trash2,
  Reply,
  MoreVertical,
  Circle,
  Loader2,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Re-use the same interfaces as applicant Messages for compatibility
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
  jobPosition?: string; // Added for job applicant info
  matchScore?: number; // Added for job applicant info
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: Message;
  unreadCount: number;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  archived: boolean;
  appliedDate?: string; // Added for recruiter context
  status?: string; // Added for application status
}

export default function RecruiterMessages() {
  const { user } = useAuth();
  
  // Mock data instead of using useChat()
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      participants: [
        {
          id: 'user1',
          name: 'John Doe',
          role: 'applicant',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          isOnline: true,
          jobPosition: 'Senior Frontend Developer'
        }
      ],
      lastMessage: {
        id: 'msg1',
        conversationId: '1',
        senderId: 'user1',
        senderName: 'John Doe',
        senderRole: 'applicant',
        subject: '',
        content: "Thank you for considering my application. I'm excited about the opportunity.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
        starred: false,
        messageType: 'general',
        priority: 'medium'
      },
      unreadCount: 1,
      jobId: '1',
      jobTitle: 'Senior Frontend Developer',
      archived: false,
      status: 'reviewing'
    },
    {
      id: '2',
      participants: [
        {
          id: 'user2',
          name: 'Sarah Johnson',
          role: 'applicant',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          jobPosition: 'UI/UX Designer',
          matchScore: 88
        }
      ],
      lastMessage: {
        id: 'msg2',
        conversationId: '2',
        senderId: 'user2',
        senderName: 'Sarah Johnson',
        senderRole: 'applicant',
        subject: '',
        content: "What time would work for a video interview next week?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: false,
        starred: false,
        messageType: 'interview',
        priority: 'high'
      },
      unreadCount: 2,
      jobId: '2',
      jobTitle: 'UI/UX Designer',
      archived: false,
      status: 'interview'
    },
    {
      id: '3',
      participants: [
        {
          id: 'user3',
          name: 'Michael Chen',
          role: 'applicant',
          avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
          isOnline: true
        }
      ],
      lastMessage: {
        id: 'msg3',
        conversationId: '3',
        senderId: 'user3',
        senderName: 'Michael Chen',
        senderRole: 'applicant',
        subject: '',
        content: "Yes, I can provide those additional code samples by tomorrow.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
        starred: false,
        messageType: 'general',
        priority: 'medium'
      },
      unreadCount: 0,
      jobId: '3',
      jobTitle: 'React Developer',
      archived: false,
      status: 'offer'
    }
  ]);
  
  const [messages, setMessages] = useState<{[key: string]: Message[]}>({
    '1': [
      {
        id: '1-1',
        conversationId: '1',
        senderId: 'user1',
        senderName: 'John Doe',
        senderRole: 'applicant',
        senderAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        subject: 'Application for Senior Frontend Developer',
        content: "Hello! Thank you for considering my application for the Senior Frontend Developer position at your company. I'm excited about the opportunity to contribute to your team.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        read: true,
        starred: false,
        messageType: 'general',
        priority: 'medium'
      },
      {
        id: '1-2',
        conversationId: '1',
        senderId: 'current-user',
        senderName: 'Recruiter',
        senderRole: 'recruiter',
        subject: 'Re: Application for Senior Frontend Developer',
        content: "Hi John! Thanks for your application. We're impressed with your qualifications and would like to schedule an interview.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
        starred: false,
        messageType: 'general',
        priority: 'medium'
      },
      {
        id: '1-3',
        conversationId: '1',
        senderId: 'user1',
        senderName: 'John Doe',
        senderRole: 'applicant',
        senderAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        subject: '',
        content: "Thank you for considering my application. I'm excited about the opportunity.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
        starred: false,
        messageType: 'general',
        priority: 'medium'
      }
    ],
    '2': [
      {
        id: '2-1',
        conversationId: '2',
        senderId: 'user2',
        senderName: 'Sarah Johnson',
        senderRole: 'applicant',
        senderAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        subject: 'Interview Schedule',
        content: "Hi there! I'm available for an interview any day next week in the afternoons.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        read: true,
        starred: true,
        messageType: 'interview',
        priority: 'high'
      },
      {
        id: '2-2',
        conversationId: '2',
        senderId: 'current-user',
        senderName: 'Recruiter',
        senderRole: 'recruiter',
        subject: '',
        content: "Perfect! How about next Tuesday at 2pm? We'll send you a calendar invite with the Zoom details.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
        starred: false,
        messageType: 'interview',
        priority: 'medium'
      },
      {
        id: '2-3',
        conversationId: '2',
        senderId: 'user2',
        senderName: 'Sarah Johnson',
        senderRole: 'applicant',
        senderAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        subject: '',
        content: "What time would work for a video interview next week?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: false,
        starred: false,
        messageType: 'interview',
        priority: 'high'
      }
    ]
  });
  
  const [loadingConversations, setLoadingConversations] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<{[key: string]: boolean}>({});
  const [isConnected, setIsConnected] = useState<boolean>(true);
  
  // Mock implementations of chat functions
  const selectChatConversation = (conversation: Conversation) => {
    setLoadingMessages(prev => ({ ...prev, [conversation.id]: true }));
    
    // Simulate API delay
    setTimeout(() => {
      setLoadingMessages(prev => ({ ...prev, [conversation.id]: false }));
    }, 500);
  };
  
  const markAsRead = (conversationId: string, messageId: string) => {
    // Update messages to mark as read
    setMessages(prev => ({
      ...prev,
      [conversationId]: prev[conversationId]?.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ) || []
    }));
    
    // Update unread count
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - 1) } 
          : conv
      )
    );
  };
  
  const startTyping = (conversationId: string) => {
    // Mock typing indicator
    // In a real implementation, this would emit a socket event
  };
  
  const stopTyping = (conversationId: string) => {
    // Mock typing stop
    // In a real implementation, this would emit a socket event
  };
  
  const sendMessage = async (conversationId: string, content: string) => {
    const newMessage: Message = {
      id: `new-${Date.now()}`,
      conversationId,
      senderId: 'current-user',
      senderName: 'You',
      senderRole: 'recruiter',
      subject: '',
      content,
      timestamp: new Date().toISOString(),
      read: true,
      starred: false,
      messageType: 'general',
      priority: 'medium'
    };
    
    // Add message to the conversation
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }));
    
    // Update last message in the conversations list
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, lastMessage: newMessage } 
          : conv
      )
    );
    
    return Promise.resolve();
  };
  
  // Calculate total unread count
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  // Keep your original refs and states
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // When conversation is selected, load its messages and mark as read
  useEffect(() => {
    if (selectedConversation) {
      // Call the context's selectConversation to fetch messages
      //selectChatConversation(selectedConversation);
      
      const conversationMessages = messages[selectedConversation.id] || [];
      
      // Mark unread messages as read
      conversationMessages.forEach(message => {
        if (!message.read && message.senderId !== user?.id) {
          markAsRead(selectedConversation.id, message.id);
        }
      });
      
      // Scroll to bottom
      scrollToBottom();
    }
  }, [selectedConversation, messages, selectChatConversation, user?.id, markAsRead]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [messages, selectedConversation]);

  // Handle typing indicator with debounce
  useEffect(() => {
    if (!selectedConversation || !newMessage) return;
    
    // Start typing
    startTyping(selectedConversation.id);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout for typing end
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedConversation.id);
    }, 2000);
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, selectedConversation]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      await sendMessage(selectedConversation.id, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleStar = (messageId: string) => {
    // Implement message starring
    // TODO: Connect to backend service via ChatContext
  };

  const archiveConversation = (conversationId: string) => {
    // TODO: Connect to backend service via ChatContext
  };

  const deleteConversation = (conversationId: string) => {
    // TODO: Connect to backend service via ChatContext
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'interview':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'offer':
        return <Star className="h-4 w-4 text-green-500" />;
      case 'rejection':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'application_update':
        return <MessageCircle className="h-4 w-4 text-yellow-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'interview':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'offer':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejection':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'application_update':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'system':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };
  
  const getStatusColor = (status: string) => {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'reviewing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'interview':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'offer':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'accepted':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    // Filter by search term
    const matchesSearch = !searchTerm || 
      (conv.participants[0]?.name && conv.participants[0].name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (conv.jobTitle && conv.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (conv.lastMessage?.content && conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by job
    const matchesJob = !jobFilter || conv.jobId === jobFilter;
    
    // Filter by status
    const matchesStatus = !statusFilter || conv.status === statusFilter;
    
    return matchesSearch && matchesJob && matchesStatus && !conv.archived;
  });

  const [jobs] = useState<{id: string; title: string}[]>([
    { id: '1', title: 'Senior Frontend Developer' },
    { id: '2', title: 'UI/UX Designer' },
    { id: '3', title: 'React Developer' },
    { id: '4', title: 'Backend Developer' },
    { id: '5', title: 'DevOps Engineer' },
  ]);

  if (loadingConversations) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/recruiter/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Messages</h1>
                <p className="text-muted-foreground mt-1">
                  Communicate with candidates
                  {totalUnread > 0 && (
                    <span className="ml-2 text-primary">
                      ({totalUnread} unread)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Filters - Recruiter specific filters */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Job Position</label>
                <Select value={jobFilter} onValueChange={setJobFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Jobs</SelectItem>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Application Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setJobFilter('');
                    setStatusFilter('');
                    setSearchTerm('');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Connection Status Indicator */}
        <div className={`flex items-center justify-end mb-2 ${isConnected ? 'text-green-500' : 'text-amber-500'}`}>
          <div className="flex items-center gap-2 text-sm">
            <Circle className={`h-2 w-2 ${isConnected ? 'fill-green-500' : 'fill-amber-500'}`} />
            <span>{isConnected ? 'Connected' : 'Reconnecting...'}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-300px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Candidates
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0">
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-border cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-primary/10'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar with Online Status Indicator */}
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {conversation.participants[0]?.avatar ? (
                              <img 
                                src={conversation.participants[0].avatar} 
                                alt={conversation.participants[0].name}
                                className="w-10 h-10 rounded-full object-cover" 
                              />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          {/* Online Status Indicator */}
                          {conversation.participants[0]?.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                          )}
                          {/* Unread Badge */}
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-xs text-primary-foreground font-semibold">
                                {conversation.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-medium truncate ${
                              conversation.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {conversation.participants[0]?.name || "Applicant"}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                          
                          {conversation.jobTitle && (
                            <div className="flex items-center gap-1 mb-1">
                              <Briefcase className="h-3 w-3 text-primary" />
                              <p className="text-xs text-primary truncate">
                                {conversation.jobTitle}
                              </p>
                            </div>
                          )}
                          
                          {/* Status badge for application status */}
                          {conversation.status && (
                            <div className="mb-1">
                              <Badge 
                                variant="outline"
                                className={`text-xs ${getStatusColor(conversation.status)}`}
                              >
                                {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Display typing indicator */}
                          {conversation.participants.some(p => p.isTyping) ? (
                            <p className="text-sm text-primary italic">
                              Typing...
                            </p>
                          ) : (
                            <p className={`text-sm truncate ${
                              conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                            }`}>
                              {conversation.lastMessage.content}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            {/* Message type indicator */}
                            <div className="flex items-center gap-1">
                              {getMessageTypeIcon(conversation.lastMessage.messageType)}
                              <span className="text-xs text-muted-foreground">
                                {conversation.lastMessage.messageType.replace('_', ' ')}
                              </span>
                            </div>
                            
                            {/* Priority indicator */}
                            {conversation.lastMessage.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                High Priority
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredConversations.length === 0 && (
                    <div className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No conversations found
                      </h3>
                      <p className="text-muted-foreground">
                        {conversations.length === 0
                          ? "You don't have any messages yet"
                          : "Try adjusting your search or filters"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar with online status */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {selectedConversation.participants[0]?.avatar ? (
                            <img 
                              src={selectedConversation.participants[0].avatar} 
                              alt={selectedConversation.participants[0].name}
                              className="w-10 h-10 rounded-full object-cover" 
                            />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        {selectedConversation.participants[0]?.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {selectedConversation.participants[0]?.name}
                          </h3>
                          {selectedConversation.participants[0]?.matchScore && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              {selectedConversation.participants[0].matchScore}% Match
                            </Badge>
                          )}
                        </div>
                        {selectedConversation.jobTitle && (
                          <p className="text-sm text-muted-foreground">
                            Applicant for <span className="text-primary">{selectedConversation.jobTitle}</span>
                          </p>
                        )}
                        {selectedConversation.status && (
                          <Badge 
                            variant="outline"
                            className={`mt-1 ${getStatusColor(selectedConversation.status)}`}
                          >
                            {selectedConversation.status.charAt(0).toUpperCase() + selectedConversation.status.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/recruiter/applications?candidateId=${selectedConversation.participants[0]?.id}`}>
                          <User className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => archiveConversation(selectedConversation.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-auto p-6">
                  {loadingMessages[selectedConversation.id] ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Loading messages...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Display messages */}
                      {messages[selectedConversation.id]?.map((message) => (
                        <div key={message.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                {message.senderAvatar ? (
                                  <img 
                                    src={message.senderAvatar} 
                                    alt={message.senderName}
                                    className="w-8 h-8 rounded-full object-cover" 
                                  />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <span className="font-medium text-foreground">
                                {message.senderName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatTime(message.timestamp)}
                              </span>
                              <Badge 
                                variant="outline"
                                className={`text-xs ${getMessageTypeColor(message.messageType)}`}
                              >
                                {message.messageType.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleStar(message.id)}
                              >
                                <Star className={`h-4 w-4 ${message.starred ? 'fill-current text-yellow-500' : 'text-muted-foreground'}`} />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Reply className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="bg-muted/50 rounded-lg p-4 ml-10">
                            {message.subject && (
                              <h4 className="font-semibold text-foreground mb-2">
                                {message.subject}
                              </h4>
                            )}
                            <p className="text-foreground whitespace-pre-wrap">
                              {message.content}
                            </p>

                            {/* Display attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium text-foreground">Attachments:</p>
                                {message.attachments.map((attachment) => (
                                  <div 
                                    key={attachment.id}
                                    className="flex items-center gap-2 p-2 bg-background rounded border border-border"
                                  >
                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-foreground">{attachment.name}</span>
                                    <span className="text-xs text-muted-foreground">({attachment.size})</span>
                                    <Button variant="ghost" size="sm" className="ml-auto">
                                      Download
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-10 text-xs text-muted-foreground">
                            {message.read ? (
                              <CheckCheck className="h-3 w-3 text-blue-500" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            <span>
                              {message.read ? 'Read' : 'Delivered'}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Typing indicator */}
                      {selectedConversation.participants.some(p => p.isTyping) && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              {selectedConversation.participants[0]?.avatar ? (
                                <img 
                                  src={selectedConversation.participants[0].avatar} 
                                  alt={selectedConversation.participants[0].name}
                                  className="w-8 h-8 rounded-full object-cover" 
                                />
                              ) : (
                                <User className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium text-foreground">
                              {selectedConversation.participants[0]?.name}
                            </span>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4 ml-10">
                            <div className="flex space-x-1">
                              <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Auto-scroll anchor */}
                      <div ref={messageEndRef}></div>
                    </div>
                  )}
                </CardContent>

                {/* Message Input */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type your message..."
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none"
                        rows={3}
                        disabled={sendingMessage || !isConnected}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage || !isConnected}
                        size="sm"
                      >
                        {sendingMessage ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Choose a candidate conversation from the list to start messaging. Send messages about interviews, job offers, or respond to candidate inquiries.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}