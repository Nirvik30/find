import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  MessageCircle,
  Briefcase,
  Send,
  ArrowLeft,
  User,
  CheckCheck,
  Check,
  Circle,
  Loader2,
  Plus,
  Filter,
  Phone,
  Video
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Messages() {
  const { user } = useAuth();
  const { 
    conversations, 
    messages, 
    chatPartners,
    sendMessage,
    selectConversation: selectChatConversation,
    createConversation,
    markAsRead,
    startTyping,
    stopTyping,
    onlineUsers,
    isConnected,
    loadingConversations,
    loadingMessages,
    loadingChatPartners,
    fetchChatPartners
  } = useChat();

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add the same pattern to the applicant Messages.tsx component
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());

  // Fetch chat partners on component mount
  useEffect(() => {
    if (!loadingChatPartners && chatPartners.length === 0) {
      fetchChatPartners();
    }
  }, [fetchChatPartners, loadingChatPartners, chatPartners.length]);

  // Handle conversation selection
  useEffect(() => {
    if (selectedConversation && selectChatConversation) {
      selectChatConversation(selectedConversation);
      scrollToBottom();
    }
  }, [selectedConversation, selectChatConversation]);

  // Separate effect for message reading
  useEffect(() => {
    if (selectedConversation?.id && messages[selectedConversation.id]?.length > 0) {
      const conversationMessages = messages[selectedConversation.id] || [];
      const unreadMessages = conversationMessages.filter(message => 
        !message.read && 
        message.senderId !== user?.id &&
        !processedMessageIds.has(message.id)
      );
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id);
        
        setProcessedMessageIds(prev => {
          const newSet = new Set(prev);
          messageIds.forEach(id => newSet.add(id));
          return newSet;
        });
        
        // Use batch mark all
        markAllAsRead(selectedConversation.id, messageIds);
      }
    }
  }, [selectedConversation?.id, messages[selectedConversation?.id || '']?.length]);

  // Clear processed message IDs when changing conversations
  useEffect(() => {
    if (!selectedConversation) {
      setProcessedMessageIds(new Set());
    }
  }, [selectedConversation?.id]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [messages, selectedConversation]);

  // Handle typing indicator
  useEffect(() => {
    if (!selectedConversation || !newMessage) return;
    
    startTyping(selectedConversation.id);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedConversation.id);
    }, 2000);
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, selectedConversation, startTyping, stopTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      await sendMessage(selectedConversation.id, newMessage);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartNewChat = async () => {
    if (!selectedPartner) return;

    try {
      const partner = chatPartners.find(p => p.id === selectedPartner);
      if (!partner) return;

      const conversationId = await createConversation(
        selectedPartner, 
        partner.jobId, 
        `Hello! I'd like to discuss the ${partner.jobTitle} position.`
      );
      
      // Find and select the new conversation
      const newConversation = conversations.find(c => c.id === conversationId);
      if (newConversation) {
        setSelectedConversation(newConversation);
      }
      
      setShowNewChatDialog(false);
      setSelectedPartner('');
    } catch (error) {
      console.error('Error starting new chat:', error);
      alert('Failed to start conversation. Please try again.');
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
    const matchesSearch = 
      (conv.participants[0]?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.lastMessage?.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || conv.lastMessage?.messageType === filterType;
    
    return matchesSearch && matchesType && !conv.archived;
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (loadingConversations) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  Communicate with recruiters
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
              {!loadingChatPartners && chatPartners.length > 0 && (
                <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Chat
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a recruiter to message" />
                        </SelectTrigger>
                        <SelectContent>
                          {chatPartners.map(partner => (
                            <SelectItem key={partner.id} value={partner.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                  {partner.avatar ? (
                                    <img 
                                      src={partner.avatar} 
                                      alt={partner.name}
                                      className="w-6 h-6 rounded-full object-cover" 
                                    />
                                  ) : (
                                    <User className="h-3 w-3" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium">{partner.name}</span>
                                  {partner.jobTitle && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                      - {partner.jobTitle}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleStartNewChat}
                          disabled={!selectedPartner}
                          className="flex-1"
                        >
                          Start Conversation
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowNewChatDialog(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
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
        {/* Connection Status */}
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
                  Recruiters
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
                          {conversation.participants[0]?.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                          )}
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
                              <span className="text-xs text-muted-foreground">
                                {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ''}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-1">
                            {conversation.company}
                          </p>
                          
                          {conversation.jobTitle && (
                            <div className="flex items-center gap-1 mb-2">
                              <Briefcase className="h-3 w-3 text-primary" />
                              <p className="text-xs text-primary truncate">
                                {conversation.jobTitle}
                              </p>
                            </div>
                          )}
                          
                          {conversation.participants.some(p => p.isTyping) ? (
                            <p className="text-sm text-primary italic">
                              Typing...
                            </p>
                          ) : (
                            <p className={`text-sm truncate ${
                              conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                            }`}>
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            {conversation.lastMessage && (
                              <Badge 
                                variant="outline"
                                className={`text-xs ${getMessageTypeColor(conversation.lastMessage.messageType)}`}
                              >
                                {conversation.lastMessage.messageType.replace('_', ' ')}
                              </Badge>
                            )}
                            {conversation.lastMessage?.priority === 'high' && (
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
                      <p className="text-muted-foreground mb-4">
                        {conversations.length === 0
                          ? "You don't have any messages yet"
                          : "Try adjusting your search or filters"}
                      </p>
                      {!loadingChatPartners && chatPartners.length > 0 && conversations.length === 0 && (
                        <Button 
                          onClick={() => setShowNewChatDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Start Your First Chat
                        </Button>
                      )}
                      {loadingChatPartners && (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading recruiters...</span>
                        </div>
                      )}
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
                    <div className="space-y-4">
                      {messages[selectedConversation.id]?.map((message) => (
                        <div key={message.id} className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            message.senderId === user?.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {message.senderId === user?.id ? 'You' : message.senderName}
                              </span>
                              <span className="text-xs opacity-70">
                                {formatTime(message.timestamp)}
                              </span>
                              <Badge 
                                variant="outline"
                                className={`text-xs ${getMessageTypeColor(message.messageType)}`}
                              >
                                {message.messageType.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            {message.subject && (
                              <h4 className="font-semibold mb-1 text-sm">
                                {message.subject}
                              </h4>
                            )}
                            
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                            
                            {message.senderId === user?.id && (
                              <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                                {message.read ? (
                                  <>
                                    <CheckCheck className="h-3 w-3" />
                                    <span>Seen</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3" />
                                    <span>Delivered</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Typing indicator */}
                      {selectedConversation.participants.some(p => p.isTyping) && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {selectedConversation.participants[0]?.name}
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
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
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={3}
                        disabled={sendingMessage || !isConnected}
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage || !isConnected}
                        size="sm"
                        className="h-10"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
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

// Mark message as read - completely revised to handle batch updates properly
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { messageId, messageIds } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }
    
    // Handle batch message marking
    if (Array.isArray(messageIds) && messageIds.length > 0) {
      const messages = await Message.find({ _id: { $in: messageIds } });
      
      // Update each message individually to avoid schema errors
      for (const message of messages) {
        if (!message.read || typeof message.read !== 'object') {
          message.read = {};
        }
        message.read[userId] = true;
        await message.save();
      }
      
      // Update conversation unread count
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { [`unreadCount.${userId}`]: 0 } }
      );
      
      res.status(200).json({
        status: 'success',
        data: { read: true, count: messageIds.length }
      });
      return;
    }
    
    // Handle single message marking (legacy support)
    if (!messageId) {
      res.status(400).json({
        status: 'fail',
        message: 'Message ID is required'
      });
      return;
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404).json({
        status: 'fail',
        message: 'Message not found'
      });
      return;
    }
    
    // Initialize read as empty object if it doesn't exist
    if (!message.read || typeof message.read !== 'object') {
      message.read = {};
    }
    
    // Set this user's read status
    message.read[userId] = true;
    await message.save();
    
    // Also update conversation unread count
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [`unreadCount.${userId}`]: 0 } }
    );
    
    res.status(200).json({
      status: 'success',
      data: { read: true }
    });
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};