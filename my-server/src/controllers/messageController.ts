import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/conversationModel';
import Message from '../models/messageModel';
import User from '../models/userModel';
import Job from '../models/jobModel';
import Application from '../models/applicationModel';
import { emitNewMessage } from '../server';

interface AuthRequest extends Request {
  user?: { 
    id: string; 
    role?: string; 
    name?: string; 
  };
}

// Cache to prevent repeated queries
const chatPartnersCache = new Map<string, { data: any[], timestamp: number }>();

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
      // For applicants, get ALL recruiters from jobs they've applied to
      const applications = await Application.find({ applicantId: userId })
        .populate({
          path: 'jobId',
          populate: {
            path: 'recruiterId',
            select: 'name email avatar companyName'
          }
        })
        .sort({ createdAt: -1 }); // Most recent applications first

      const recruiterMap = new Map();
      
      applications.forEach(app => {
        const job = app.jobId as any;
        if (job?.recruiterId) {
          const recruiterId = job.recruiterId._id.toString();
          
          // Always add or update recruiter info for each application
          recruiterMap.set(`${recruiterId}-${job._id}`, {
            id: recruiterId,
            name: job.recruiterId.name,
            role: 'recruiter',
            email: job.recruiterId.email,
            avatar: job.recruiterId.avatar,
            company: job.recruiterId.companyName || job.company,
            jobTitle: job.title,
            jobId: job._id.toString(),
            applicationId: app._id.toString(),
            applicationStatus: app.status,
            appliedDate: (app as any).createdAt // Type assertion fix
          });
        }
      });

      chatPartners = Array.from(recruiterMap.values());
      
    } else if (userRole === 'recruiter') {
      // For recruiters, get ALL applicants who applied to their jobs
      const jobs = await Job.find({ recruiterId: userId }).select('_id title company');
      const jobIds = jobs.map(job => job._id);

      const applications = await Application.find({ jobId: { $in: jobIds } })
        .populate('applicantId', 'name email avatar')
        .populate('jobId', 'title company')
        .sort({ createdAt: -1 }); // Most recent applications first

      const applicantMap = new Map();
      
      applications.forEach(app => {
        const applicant = app.applicantId as any;
        const job = app.jobId as any;
        
        if (applicant) {
          const applicantId = applicant._id.toString();
          
          // Always add or update applicant info for each application
          applicantMap.set(`${applicantId}-${job._id}`, {
            id: applicantId,
            name: applicant.name,
            role: 'applicant',
            email: applicant.email,
            avatar: applicant.avatar,
            jobTitle: job?.title,
            jobId: job?._id?.toString(),
            company: job?.company,
            applicationId: app._id.toString(),
            applicationStatus: app.status,
            appliedDate: (app as any).createdAt // Type assertion fix
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

    console.log(`Loaded ${chatPartners.length} chat partners for ${userRole}`);

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

// Get conversations for the current user with proper sorting
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

    console.log(`Fetching conversations for user: ${userId}`);

    const conversations = await Conversation.find({
      'participants.userId': userId,
      archived: { $ne: true }
    })
    .populate('participants.userId', 'name email role avatar companyName')
    .populate('jobId', 'title company')
    .sort({ updatedAt: -1 }); // Most recent conversations first

    console.log(`Found ${conversations.length} conversations`);

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        try {
          const otherParticipant = conv.participants.find(
            p => (p.userId as any)._id.toString() !== userId
          );

          if (!otherParticipant || !otherParticipant.userId) {
            console.log(`Skipping conversation ${conv._id} - no valid participant`);
            return null;
          }

          const otherUser = otherParticipant.userId as any;
          
          // Get the most recent message with better error handling
          const lastMessage = await Message.findOne({ conversationId: conv._id })
            .populate('senderId', 'name role')
            .sort({ timestamp: -1 })
            .lean(); // Use lean for better performance

          // Calculate unread count for this user
          const unreadCount = await Message.countDocuments({
            conversationId: conv._id,
            senderId: { $ne: userId },
            [`read.${userId}`]: { $ne: true }
          });

          console.log(`Conversation ${conv._id}: ${conv.participants.length} participants, unread: ${unreadCount}`);

          return {
            id: conv._id.toString(),
            participants: [{
              id: otherUser._id.toString(),
              name: otherUser.name || 'Unknown User',
              role: otherUser.role || 'user',
              avatar: otherUser.avatar,
              company: otherUser.companyName,
              isOnline: false, // Will be updated by socket
              isTyping: false
            }],
            lastMessage: lastMessage ? {
              id: lastMessage._id.toString(),
              senderId: (lastMessage.senderId as any)._id ? (lastMessage.senderId as any)._id.toString() : lastMessage.senderId.toString(),
              senderName: (lastMessage.senderId as any).name || (lastMessage as any).senderName || 'Unknown',
              senderRole: (lastMessage.senderId as any).role || (lastMessage as any).senderRole || 'user',
              subject: lastMessage.subject || '',
              content: lastMessage.content || '',
              timestamp: lastMessage.timestamp.toISOString(),
              read: (lastMessage as any).read?.[userId] || false,
              starred: lastMessage.starred || false,
              messageType: lastMessage.messageType || 'general',
              priority: lastMessage.priority || 'medium'
            } : null,
            unreadCount,
            jobId: conv.jobId?._id?.toString(),
            jobTitle: (conv.jobId as any)?.title,
            company: (conv.jobId as any)?.company || otherUser.companyName,
            archived: conv.archived || false,
            status: 'active', // Remove the problematic status field access
            lastActivity: conv.updatedAt.getTime() // Add for proper sorting
          };
        } catch (error) {
          console.error(`Error processing conversation ${conv._id}:`, error);
          return null;
        }
      })
    );

    const validConversations = formattedConversations
      .filter(conv => conv !== null)
      .sort((a, b) => (b!.lastActivity || 0) - (a!.lastActivity || 0)); // Sort by most recent

    console.log(`Returning ${validConversations.length} valid conversations`);

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

// Get messages for a conversation
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
      .sort({ timestamp: 1 }); // Oldest first for chat display

    const formattedMessages = messages.map(msg => {
      const sender = msg.senderId as any;
      
      // Check read status safely - ensure read exists as an object
      let isReadByUser = false;
      if (msg.read && typeof msg.read === 'object') {
        isReadByUser = !!msg.read[userId];
      }
      
      return {
        id: msg._id.toString(),
        conversationId: msg.conversationId.toString(),
        senderId: sender._id ? sender._id.toString() : (msg.senderId as any).toString(),
        senderName: msg.senderName || (sender.name || 'Unknown'),
        senderRole: msg.senderRole || (sender.role || 'user'),
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
    
    // Mark messages as read - FIXED with proper initialization
    const unreadMessages = await Message.find({
      conversationId,
      senderId: { $ne: userId },
      [`read.${userId}`]: { $ne: true }
    });
    
    if (unreadMessages.length > 0) {
      // Update each document individually to avoid schema validation errors
      for (const msg of unreadMessages) {
        // Initialize read as empty object if it doesn't exist
        if (!msg.read || typeof msg.read !== 'object') {
          msg.read = {};
        }
        
        // Set this user's read status
        msg.read[userId] = true;
        await msg.save();
      }
      
      // Update conversation unread count
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { [`unreadCount.${userId}`]: 0 } }
      );
    }
    
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
    const readStatus: { [key: string]: boolean } = {};
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
    
    // Update conversation
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

// Create conversation function with better validation
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

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      $and: [
        { 'participants.userId': userId },
        { 'participants.userId': participantId },
        { jobId: jobId || { $exists: true } }
      ]
    });

    if (existingConversation) {
      res.status(200).json({
        status: 'success',
        data: {
          conversationId: existingConversation._id.toString(),
          existing: true
        }
      });
      return;
    }

    // Get user details
    const currentUser = await User.findById(userId);
    const otherUser = await User.findById(participantId);

    if (!currentUser || !otherUser) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
      return;
    }

    // Verify connection through job application
    let hasConnection = false;
    if (jobId) {
      const application = await Application.findOne({
        $or: [
          { applicantId: userId, jobId },
          { applicantId: participantId, jobId }
        ]
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

    // Create conversation
    const conversation = await Conversation.create({
      participants: [
        {
          userId: userId,
          role: currentUser.role,
          isTyping: false,
        },
        {
          userId: participantId,
          role: otherUser.role,
          isTyping: false,
        }
      ],
      jobId: jobId ? new mongoose.Types.ObjectId(jobId) : undefined,
      archived: false,
      unreadCount: {}
    });

    // Send initial message if provided
    if (initialMessage) {
      const readStatus: { [key: string]: boolean } = {};
      readStatus[userId] = true;

      const message = await Message.create({
        conversationId: conversation._id,
        senderId: userId,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        content: typeof initialMessage === 'string' ? initialMessage : initialMessage.content,
        subject: '',
        messageType: 'general',
        priority: 'medium',
        read: readStatus,
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

      // Emit initial message
      emitNewMessage({
        id: message._id.toString(),
        conversationId: conversation._id.toString(),
        senderId: userId,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        senderAvatar: currentUser.avatar,
        subject: '',
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        read: true,
        starred: false,
        messageType: 'general',
        priority: 'medium'
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        conversationId: conversation._id.toString(),
        existing: false
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

// Update the markAsRead function to handle multiple messages at once
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body; // Changed from messageId to messageIds array
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }
    
    // Handle array of message IDs for batch updates
    if (Array.isArray(messageIds) && messageIds.length > 0) {
      // Update multiple messages at once
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { [`read.${userId}`]: true } }
      );
      
      // Also update conversation unread count
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { [`unreadCount.${userId}`]: 0 } }
      );
      
      res.status(200).json({
        status: 'success',
        data: { read: true, count: messageIds.length }
      });
    } else {
      // For backward compatibility - single message ID
      const messageId = req.body.messageId;
      if (!messageId) {
        res.status(400).json({
          status: 'fail',
          message: 'Message ID is required'
        });
        return;
      }
      
      await Message.updateOne(
        { _id: messageId },
        { $set: { [`read.${userId}`]: true } }
      );
      
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { [`unreadCount.${userId}`]: 0 } }
      );
      
      res.status(200).json({
        status: 'success',
        data: { read: true }
      });
    }
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Toggle star status
export const toggleStar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { starred } = req.body;
    
    await Message.updateOne(
      { _id: messageId },
      { $set: { starred: Boolean(starred) } }
    );
    
    res.status(200).json({
      status: 'success',
      data: { starred: Boolean(starred) }
    });
  } catch (error: any) {
    console.error('Error toggling star:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Archive conversation
export const archiveConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { archived: true } }
    );
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete conversation
export const deleteConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    
    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });
    
    // Delete the conversation
    await Conversation.deleteOne({ _id: conversationId });
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};