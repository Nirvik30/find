import React, { useState, useEffect, useRef } from 'react';
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
  Send,
  ArrowLeft,
  User,
  CheckCheck,
  Check,
  Circle,
  Loader2,
  Plus,
  Filter,
  Briefcase,
  Phone,
  Video,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function RecruiterMessages() {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    chatPartners,
    sendMessage,
    selectConversation: selectChatConversation,
    createConversation,
    markAsRead,
    markAllAsRead,
    startTyping,
    stopTyping,
    onlineUsers,
    isConnected,
    loadingConversations,
    loadingMessages,
    loadingChatPartners,
    fetchChatPartners,
    refreshConversations,
  } = useChat();

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [messageTypeFilter, setMessageTypeFilter] = useState('general');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<string>('');
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());

  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationSelectedRef = useRef<string | null>(null);
  const messageProcessedRef = useRef<Set<string>>(new Set());

  // Initialize chat data
  useEffect(() => {
    const initializeChatData = async () => {
      try {
        setInitializationError(null);

        // Wait a bit for the ChatContext to initialize
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Only fetch chat partners if we don't have any and aren't already loading
        if (chatPartners.length === 0 && !loadingChatPartners) {
          console.log('Fetching chat partners for recruiter...');
          await fetchChatPartners();
        }
      } catch (error) {
        console.error('Failed to initialize chat data:', error);
        setInitializationError('Failed to load chat data. Please refresh the page.');
      }
    };

    // Only initialize if we have a user
    if (user?.id) {
      initializeChatData();
    }
  }, [user?.id]); // Only depend on user ID

  // Controlled conversation selection
  useEffect(() => {
    if (selectedConversation && selectChatConversation) {
      // Only proceed if this is a new conversation selection
      if (conversationSelectedRef.current !== selectedConversation.id) {
        console.log('Selecting conversation in RecruiterMessages:', selectedConversation.id);
        conversationSelectedRef.current = selectedConversation.id;

        selectChatConversation(selectedConversation);
        scrollToBottom();
      }
    }
  }, [selectedConversation?.id, selectChatConversation]);

  // Handle message reading once messages are loaded (SEPARATE EFFECT)
  useEffect(() => {
    if (selectedConversation?.id && messages[selectedConversation.id]?.length > 0) {
      // Find unread messages from other users that haven't been processed yet
      const conversationMessages = messages[selectedConversation.id] || [];
      const unreadMessages = conversationMessages.filter(
        (message) =>
          !message.read &&
          message.senderId !== user?.id &&
          !processedMessageIds.has(message.id)
      );

      // Only proceed if there are new unread messages
      if (unreadMessages.length > 0) {
        console.log(`Found ${unreadMessages.length} unread messages to mark as read`);

        // Add to processed set immediately to prevent duplicate processing
        const messageIds = unreadMessages.map((msg) => msg.id);
        setProcessedMessageIds((prev) => {
          const newSet = new Set(prev);
          messageIds.forEach((id) => newSet.add(id));
          return newSet;
        });

        // Batch mark all unread messages at once
        markAllAsRead(selectedConversation.id, messageIds);
      }
    }
  }, [selectedConversation?.id, messages[selectedConversation?.id || '']?.length, markAllAsRead, processedMessageIds, user?.id]);

  // Clear processed message IDs when changing conversations
  useEffect(() => {
    return () => {
      // Only clear message IDs for this conversation if we change conversations
      if (selectedConversation?.id !== conversationSelectedRef.current) {
        setProcessedMessageIds(new Set());
      }
    };
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

  // Handle URL parameters for direct conversation access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const candidateId = urlParams.get('candidateId');

    if (candidateId && conversations.length > 0 && !selectedConversation) {
      const conversation = conversations.find((conv) =>
        conv.participants.some((p) => p.id === candidateId)
      );

      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [conversations, selectedConversation]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      await sendMessage(selectedConversation.id, newMessage, messageTypeFilter || 'general');
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartNewChat = async () => {
    if (!selectedApplicant) return;

    try {
      const applicant = chatPartners.find((p) => p.id === selectedApplicant);
      if (!applicant) return;

      const conversationId = await createConversation(
        selectedApplicant,
        applicant.jobId,
        `Hi ${applicant.name}! Thank you for your application to the ${applicant.jobTitle} position. I'd like to discuss your qualifications further.`
      );

      const newConversation = conversations.find((c) => c.id === conversationId);
      if (newConversation) {
        setSelectedConversation(newConversation);
      }

      setShowNewChatDialog(false);
      setSelectedApplicant('');
    } catch (error) {
      console.error('Error starting new chat:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const handleRefreshData = async () => {
    try {
      setInitializationError(null);
      await Promise.all([refreshConversations(), fetchChatPartners()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setInitializationError('Failed to refresh data. Please try again.');
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

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      (conv.participants[0]?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.lastMessage?.content || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || conv.status === statusFilter;
    const matchesMessageType = !messageTypeFilter || conv.lastMessage?.messageType === messageTypeFilter;

    return matchesSearch && matchesStatus && matchesMessageType && !conv.archived;
  });

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  // Show initialization error
  if (initializationError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Failed to Load Messages</h2>
          <p className="text-muted-foreground mb-4">{initializationError}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRefreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link to="/recruiter/dashboard">Go Back</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loadingConversations && conversations.length === 0) {
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
                <Link to="/recruiter/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Messages</h1>
                <p className="text-muted-foreground mt-1">
                  Communicate with job applicants
                  {totalUnread > 0 && (
                    <span className="ml-2 text-primary">
                      ({totalUnread} unread)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRefreshData}
                disabled={loadingConversations || loadingChatPartners}
              >
                {(loadingConversations || loadingChatPartners) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              {chatPartners.length > 0 && (
                <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Chat ({chatPartners.length} applicants)
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedApplicant} onValueChange={setSelectedApplicant}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select from ${chatPartners.length} applicants`} />
                        </SelectTrigger>
                        <SelectContent>
                          {chatPartners.map(applicant => (
                            <SelectItem key={`${applicant.id}-${applicant.jobId}`} value={applicant.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                  {applicant.avatar ? (
                                    <img
                                      src={applicant.avatar}
                                      alt={applicant.name}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <User className="h-3 w-3" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium">{applicant.name}</span>
                                  {applicant.jobTitle && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                      - {applicant.jobTitle} ({applicant.applicationStatus})
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
                          disabled={!selectedApplicant}
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
            <div className="bg-muted/50 border-b border-border">
              <div className="container mx-auto px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Message Type</label>
                    <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStatusFilter('');
                        setMessageTypeFilter('');
                        setSearchTerm('');
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
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
                  Applicants ({conversations.length})
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
                            <h4
                              className={`text-sm font-medium truncate ${
                                conversation.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {conversation.participants[0]?.name}
                            </h4>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ''}
                              </span>
                            </div>
                          </div>

                          {conversation.jobTitle && (
                            <div className="flex items-center gap-1 mb-1">
                              <Briefcase className="h-3 w-3 text-primary" />
                              <p className="text-xs text-primary truncate">{conversation.jobTitle}</p>
                            </div>
                          )}

                          {conversation.participants.some((p) => p.isTyping) ? (
                            <p className="text-sm text-primary italic">Typing...</p>
                          ) : (
                            <p
                              className={`text-sm truncate ${
                                conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                              }`}
                            >
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
                          : 'Try adjusting your search or filters'}
                      </p>
                      {chatPartners.length > 0 && conversations.length === 0 && (
                        <Button onClick={() => setShowNewChatDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Start Your First Chat
                        </Button>
                      )}
                      {loadingChatPartners && (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading applicants...</span>
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
                          {selectedConversation.participants[0]?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.participants[0]?.role}
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
                      {messages[selectedConversation.id]?.length > 0 ? (
                        messages[selectedConversation.id].map((message) => (
                          <div key={message.id} className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.senderId === user?.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">
                                  {message.senderId === user?.id ? 'You' : message.senderName}
                                </span>
                                <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getMessageTypeColor(message.messageType)}`}
                                >
                                  {message.messageType.replace('_', ' ')}
                                </Badge>
                              </div>
                              {message.subject && (
                                <h4 className="font-semibold mb-1 text-sm">{message.subject}</h4>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                        ))
                      ) : (
                        // New empty conversation state
                        <div className="text-center py-6">
                          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">No messages yet</h3>
                          <p className="text-muted-foreground">
                            Start the conversation by sending a message below
                          </p>
                        </div>
                      )}

                      {/* Typing indicator - separate this from the conditional above */}
                      {selectedConversation.participants.some((p) => p.isTyping) && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {selectedConversation.participants[0]?.name}
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
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
                  <div className="space-y-3">
                    {/* Message Type Selector */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-foreground">Message Type:</label>
                      <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="General" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="application_update">Application Update</SelectItem>
                          <SelectItem value="offer">Job Offer</SelectItem>
                          <SelectItem value="rejection">Rejection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Message Input */}
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
