import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/conversationModel';
import Message from '../models/messageModel';
import User from '../models/userModel';
import Job from '../models/jobModel';
import Application from '../models/applicationModel';
import { emitNewMessage } from '../server'; // Import the emitNewMessage function

interface AuthRequest extends Request {
  user?: { 
    id: string; 
    role?: string; 
    name?: string; 
  };
}

// Cache to prevent repeated queries
const chatPartnersCache = new Map<string, { data: any[], timestamp: number }>();
const messageCache = new Map<string, { data: any[], timestamp: number, etag: string }>();

// Get all possible chat partners for a user (ONLY REAL CONNECTED USERS)
export const getChatPartners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId || !userRole) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    // Check cache first (cache for 5 minutes)
    const cacheKey = `${userId}-${userRole}`;
    const now = Date.now();
    const cached = chatPartnersCache.get(cacheKey);
    
    if (cached && (now - cached.timestamp) < 300000) {
      res.status(200).json({
        status: 'success',
        data: {
          chatPartners: cached.data
        }
      });
      return;
    }

    let chatPartners: any[] = [];

    if (userRole === 'applicant') {
      // For applicants, get ONLY recruiters from jobs they've applied to
      const applications = await Application.find({ applicantId: userId })
        .populate({
          path: 'jobId',
          populate: {
            path: 'recruiterId',
            select: 'name email avatar companyName'
          }
        });

      const recruiterMap = new Map();
      applications.forEach(app => {
        const job = app.jobId as any;
        if (job?.recruiterId && !recruiterMap.has(job.recruiterId._id.toString())) {
          recruiterMap.set(job.recruiterId._id.toString(), {
            id: job.recruiterId._id.toString(),
            name: job.recruiterId.name,
            role: 'recruiter',
            email: job.recruiterId.email,
            avatar: job.recruiterId.avatar,
            company: job.recruiterId.companyName,
            jobTitle: job.title,
            jobId: job._id.toString(),
            applicationStatus: app.status
          });
        }
      });

      chatPartners = Array.from(recruiterMap.values());
      
    } else if (userRole === 'recruiter') {
      // For recruiters, get ONLY applicants who applied to their jobs
      const jobs = await Job.find({ recruiterId: userId });
      const jobIds = jobs.map(job => job._id);

      const applications = await Application.find({ jobId: { $in: jobIds } })
        .populate('applicantId', 'name email avatar')
        .populate('jobId', 'title');

      const applicantMap = new Map();
      applications.forEach(app => {
        const applicant = app.applicantId as any;
        const job = app.jobId as any;
        
        if (applicant && !applicantMap.has(applicant._id.toString())) {
          applicantMap.set(applicant._id.toString(), {
            id: applicant._id.toString(),
            name: applicant.name,
            role: 'applicant',
            email: applicant.email,
            avatar: applicant.avatar,
            jobTitle: job?.title,
            jobId: job?._id?.toString(),
            applicationStatus: app.status
          });
        }
      });

      chatPartners = Array.from(applicantMap.values());
    }

    // Update cache
    chatPartnersCache.set(cacheKey, {
      data: chatPartners,
      timestamp: now
    });

    // Only log once when cache is updated
    if (!cached) {
      console.log(`Loaded ${chatPartners.length} chat partners for ${userRole}`);
    }

    res.status(200).json({
      status: 'success',
      data: {
        chatPartners
      }
    });
  } catch (error: any) {
    console.error('Error fetching chat partners:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get conversations for the current user with real data
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const conversations = await Conversation.find({
      'participants.userId': userId,
      archived: { $ne: true }
    })
    .populate('participants.userId', 'name email role avatar companyName')
    .populate('jobId', 'title company')
    .sort({ updatedAt: -1 });

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(
          p => p.userId._id.toString() !== userId
        );

        if (!otherParticipant) {
          return null;
        }

        const otherUser = otherParticipant.userId as any;
        
        const lastMessage = await Message.findOne({
          conversationId: conv._id
        })
        .sort({ timestamp: -1 })
        .populate('senderId', 'name role');

        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: userId },
          [`read.${userId}`]: { $ne: true }
        });

        return {
          id: conv._id.toString(),
          participants: [{
            id: otherUser._id.toString(),
            name: otherUser.name,
            role: otherUser.role,
            email: otherUser.email,
            avatar: otherUser.avatar,
            company: otherUser.role === 'recruiter' ? otherUser.companyName : undefined,
            isOnline: false,
            isTyping: false
          }],
          lastMessage: lastMessage ? {
            id: lastMessage._id.toString(),
            conversationId: conv._id.toString(),
            senderId: lastMessage.senderId._id.toString(),
            senderName: (lastMessage.senderId as any).name,
            senderRole: (lastMessage.senderId as any).role,
            subject: lastMessage.subject || '',
            content: lastMessage.content,
            timestamp: lastMessage.timestamp.toISOString(),
            read: lastMessage.read?.[userId] || false,
            starred: lastMessage.starred || false,
            messageType: lastMessage.messageType || 'general',
            priority: lastMessage.priority || 'medium'
          } : null,
          unreadCount,
          jobId: conv.jobId?._id?.toString(),
          jobTitle: (conv.jobId as any)?.title,
          company: (conv.jobId as any)?.company || otherUser.companyName,
          archived: conv.archived || false
        };
      })
    );

    const validConversations = formattedConversations.filter(conv => conv !== null);

    res.status(200).json({
      status: 'success',
      results: validConversations.length,
      data: {
        conversations: validConversations
      }
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get messages for a conversation - FIX CONTINUOUS FETCHING
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }
    
    // Verify user has access to this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId
    });
    
    if (!conversation) {
      res.status(404).json({
        status: 'fail',
        message: 'Conversation not found or access denied'
      });
      return;
    }
    
    // Get messages and populate sender info
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name role avatar')
      .sort({ timestamp: 1 });
    
    const formattedMessages = messages.map(msg => {
      const sender = msg.senderId as any;
      
      // Safely check if message is read by this user
      let isReadByUser = false;
      if (msg.read && msg.read instanceof Map) {
        isReadByUser = msg.read.get(userId) === true;
      } else if (typeof msg.read === 'object' && msg.read !== null) {
        isReadByUser = msg.read[userId] === true;
      }
      
      return {
        id: msg._id.toString(),
        conversationId: msg.conversationId.toString(),
        senderId: sender._id.toString(),
        senderName: msg.senderName || sender.name,
        senderRole: msg.senderRole || sender.role,
        senderAvatar: sender.avatar,
        subject: msg.subject || '',
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        read: isReadByUser,
        starred: msg.starred || false,
        attachments: msg.attachments || [],
        messageType: msg.messageType || 'general',
        priority: msg.priority || 'medium'
      };
    });
    
    // Only mark as read if there are actually unread messages
    // Use updateMany instead of looping through messages
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId }
      },
      {
        $set: {
          [`read.${userId}`]: true
        }
      }
    );
    
    // Update conversation unread count
    await Conversation.updateOne(
      { _id: conversationId },
      {
        $set: {
          [`unreadCount.${userId}`]: 0
        }
      }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        messages: formattedMessages
      }
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Send message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { content, subject, messageType, priority } = req.body;
    const userId = req.user?.id;
    
    if (!userId || !content?.trim()) {
      res.status(400).json({
        status: 'fail',
        message: 'User ID and message content are required'
      });
      return;
    }
    
    // Check if conversation exists and user has access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId
    });
    
    if (!conversation) {
      res.status(404).json({
        status: 'fail',
        message: 'Conversation not found or access denied'
      });
      return;
    }
    
    // Get sender user data
    const sender = await User.findById(userId).select('name role avatar');
    
    if (!sender) {
      res.status(404).json({
        status: 'fail',
        message: 'Sender user not found'
      });
      return;
    }
    
    // Initialize read status
    const readStatus = {};
    readStatus[userId] = true;
    
    // Create the message
    const message = await Message.create({
      conversationId,
      senderId: userId,
      senderName: sender.name,
      senderRole: sender.role,
      content: content.trim(),
      subject: subject || '',
      messageType: messageType || 'general',
      priority: priority || 'medium',
      read: readStatus,
      starred: false
    });
    
    // Update conversation unread counts
    const otherParticipants = conversation.participants.filter(
      p => p.userId.toString() !== userId
    );
    
    const unreadUpdates: any = {};
    otherParticipants.forEach(participant => {
      const participantId = participant.userId.toString();
      unreadUpdates[`unreadCount.${participantId}`] = 
        (conversation.unreadCount?.[participantId] || 0) + 1;
    });
    
    await Conversation.updateOne(
      { _id: conversationId },
      {
        $set: {
          ...unreadUpdates,
          updatedAt: new Date()
        }
      }
    );
    
    // Format message for response
    const formattedMessage = {
      id: message._id.toString(),
      conversationId,
      senderId: userId,
      senderName: sender.name,
      senderRole: sender.role,
      senderAvatar: sender.avatar,
      subject: message.subject,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      read: true,
      starred: false,
      messageType: message.messageType,
      priority: message.priority
    };
    
    // Emit socket event for real-time update
    emitNewMessage(formattedMessage);
    
    res.status(201).json({
      status: 'success',
      data: {
        message: formattedMessage
      }
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create conversation with real users
export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { participantId, jobId, initialMessage } = req.body;
    const userId = req.user?.id;
    
    if (!userId || !participantId) {
      res.status(400).json({
        status: 'fail',
        message: 'User ID and participant ID are required'
      });
      return;
    }

    const existingConversation = await Conversation.findOne({
      $and: [
        { 'participants.userId': userId },
        { 'participants.userId': participantId },
        ...(jobId ? [{ jobId }] : [])
      ]
    });

    if (existingConversation) {
      res.status(200).json({
        status: 'success',
        data: {
          conversationId: existingConversation._id.toString(),
          exists: true
        }
      });
      return;
    }

    const [currentUser, otherUser] = await Promise.all([
      User.findById(userId).select('name role'),
      User.findById(participantId).select('name role')
    ]);

    if (!currentUser || !otherUser) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
      return;
    }

    let hasConnection = false;
    
    if (currentUser.role === 'applicant' && otherUser.role === 'recruiter') {
      const job = await Job.findOne({ _id: jobId, recruiterId: participantId });
      const application = await Application.findOne({ 
        applicantId: userId, 
        jobId: jobId || job?._id 
      });
      hasConnection = !!application;
    } else if (currentUser.role === 'recruiter' && otherUser.role === 'applicant') {
      const job = await Job.findOne({ _id: jobId, recruiterId: userId });
      const application = await Application.findOne({ 
        applicantId: participantId, 
        jobId: jobId || job?._id 
      });
      hasConnection = !!application;
    }

    if (!hasConnection) {
      res.status(403).json({
        status: 'fail',
        message: 'You can only message users related to job applications'
      });
      return;
    }

    const conversation = await Conversation.create({
      participants: [
        {
          userId: userId,
          role: currentUser.role,
          isTyping: false,
          lastSeen: new Date()
        },
        {
          userId: participantId,
          role: otherUser.role,
          isTyping: false,
          lastSeen: new Date()
        }
      ],
      jobId: jobId || undefined,
      unreadCount: {},
      archived: false
    });

    if (initialMessage) {
      const sender = await User.findById(userId).select('name role');
      
      // Initialize readBy map correctly
      const readByMap = new Map();
      readByMap.set(userId, true);
      
      const message = await Message.create({
        conversationId: conversation._id,
        senderId: userId,
        senderName: sender?.name || 'Unknown User',
        senderRole: sender?.role || 'unknown',
        content: initialMessage.content || initialMessage,
        subject: '',
        messageType: 'general',
        priority: 'medium',
        read: false,
        readBy: readByMap,
        starred: false
      });

      await Conversation.updateOne(
        { _id: conversation._id },
        {
          $set: {
            [`unreadCount.${participantId}`]: 1
          }
        }
      );
    }

    res.status(201).json({
      status: 'success',
      data: {
        conversationId: conversation._id.toString(),
        exists: false
      }
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Rest of the helper functions
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { messageId } = req.body;
    const userId = req.user?.id;
    
    // Update message read status
    await Message.updateOne(
      { _id: messageId },
      { $set: { [`read.${userId}`]: true } }
    );
    
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

export const toggleStar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { starred } = req.body;
    
    await Message.updateOne(
      { _id: messageId },
      { $set: { starred: !!starred } }
    );
    
    res.status(200).json({
      status: 'success',
      data: { starred: !!starred }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const archiveConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { archived: true } }
    );
    
    res.status(200).json({
      status: 'success',
      data: { archived: true }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    
    const conversation = await Conversation.findById(conversationId);
    
    if (conversation) {
      const remainingParticipants = conversation.participants.filter(
        p => p.userId.toString() !== userId
      );
      
      if (remainingParticipants.length === 0) {
        await Message.deleteMany({ conversationId });
        await Conversation.deleteOne({ _id: conversationId });
      } else {
        await Conversation.updateOne(
          { _id: conversationId },
          { $set: { participants: remainingParticipants } }
        );
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};