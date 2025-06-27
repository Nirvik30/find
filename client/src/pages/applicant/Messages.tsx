import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext'; // Import our new hook
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
  Search,
  MessageCircle,
  Building2,
  Clock,
  Send,
  Paperclip,
  Phone,
  Video,
  Star,
  Archive,
  Trash2,
  ArrowLeft,
  User,
  Calendar,
  CheckCheck,
  Check,
  AlertCircle,
  Filter,
  MoreVertical,
  Reply,
  Forward,
  Circle, // For online status indicator
  Loader2 // For loading state
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Import or define the required interfaces
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

export default function Messages() {
  const { user } = useAuth();
  
  // Use the real-time chat context
  const { 
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
    selectConversation: selectChatConversation
  } = useChat();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  
  // Refs
  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // When conversation is selected, load its messages and call the ChatContext's selectConversation
  useEffect(() => {
    if (selectedConversation && selectChatConversation) {
      // Call the context's selectConversation to fetch messages
      selectChatConversation(selectedConversation);
      
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
    // For now we'll keep your existing implementation
    if (!selectedConversation) return;
    
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
    // Re-use your existing implementation
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
    // Re-use your existing implementation
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

  const formatTime = (timestamp: string) => {
    // Re-use your existing implementation
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
    const matchesSearch = 
      conv.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || conv.lastMessage?.messageType === filterType;
    
    return matchesSearch && matchesType && !conv.archived;
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (loadingConversations) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading messages...</p>
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
                <Link to="/applicant/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Messages</h1>
                <p className="text-muted-foreground mt-1">
                  Communicate with recruiters and hiring managers
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

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Message Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="application_update">Application Update</SelectItem>
                    <SelectItem value="offer">Job Offer</SelectItem>
                    <SelectItem value="rejection">Rejection</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterType('');
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
        {/* Connection Status Indicator - New */}
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
                  Conversations
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
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
                        {/* Avatar with Online Status Indicator - Enhanced */}
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
                          {/* Online Status Indicator - New */}
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
                              {conversation.participants[0]?.name || conversation.company}
                            </h4>
                            <div className="flex items-center gap-1">
                              {getMessageTypeIcon(conversation.lastMessage.messageType)}
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conversation.lastMessage.timestamp)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-1">
                            {conversation.company}
                          </p>
                          
                          {conversation.jobTitle && (
                            <p className="text-xs text-primary mb-2">
                              {conversation.jobTitle}
                            </p>
                          )}
                          
                          {/* Display typing indicator - New */}
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
                            <Badge 
                              variant="outline"
                              className={`text-xs ${getMessageTypeColor(conversation.lastMessage.messageType)}`}
                            >
                              {conversation.lastMessage.messageType.replace('_', ' ')}
                            </Badge>
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

          {/* Message Thread - With Real-Time Enhancements */}
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
                        {/* Online Status Indicator - New */}
                        {selectedConversation.participants[0]?.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {selectedConversation.participants[0]?.name || selectedConversation.company}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.participants[0]?.role} at {selectedConversation.company}
                        </p>
                        {selectedConversation.jobTitle && (
                          <p className="text-sm text-primary">
                            Re: {selectedConversation.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteConversation(selectedConversation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
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