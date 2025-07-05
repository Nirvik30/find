import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/conversationModel';
import Message from '../models/messageModel';
import User from '../models/userModel';
import Job from '../models/jobModel';

// Define the AuthRequest interface
interface AuthRequest extends Request {
  user?: { id: string; role?: string; name?: string; };
}

// Update all function signatures to use AuthRequest instead of Request
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // Find all conversations for this user
    const conversations = await Conversation.find({ 
      'participants.userId': userId 
    }).sort({ lastMessageAt: -1 });
    
    // Get additional data for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        // Get the last message
        const lastMessage = await Message.findOne({
          conversationId: conversation._id
        }).sort({ timestamp: -1 });
        
        // Get other participants (excluding current user)
        const participantsInfo = await Promise.all(
          conversation.participants
            .filter(p => p.userId.toString() !== userId)
            .map(async (participant) => {
              const user = await User.findById(participant.userId).select('name role email avatar');
              return {
                id: participant.userId,
                name: user?.name || 'Unknown User',
                role: user?.role || 'unknown',
                email: user?.email,
                avatar: user?.avatar,
                isOnline: participant.isTyping || false,
                isTyping: participant.isTyping || false,
                lastSeen: participant.lastSeen
              };
            })
        );
        
        // Get job details if this conversation is related to a job
        let jobDetails = null;
        if (conversation.jobId) {
          const job = await Job.findById(conversation.jobId).select('title company status');
          if (job) {
            jobDetails = {
              id: job._id,
              title: job.title,
              company: job.company,
              status: job.status
            };
          }
        }
        
        // Format the response - Handle Map access safely
        const conversationDoc = conversation.toObject();
        return {
          id: conversation._id,
          participants: participantsInfo,
          lastMessage: lastMessage ? {
            id: lastMessage._id,
            conversationId: lastMessage.conversationId,
            senderId: lastMessage.senderId,
            senderName: (await User.findById(lastMessage.senderId))?.name || 'Unknown User',
            senderRole: (await User.findById(lastMessage.senderId))?.role || 'unknown',
            subject: lastMessage.subject,
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            read: lastMessage.read?.[userId as string] || false,
            starred: lastMessage.starred,
            messageType: lastMessage.messageType,
            priority: lastMessage.priority
          } : null,
          unreadCount: conversation.unreadCount?.[userId as string] || 0,
          jobId: conversation.jobId,
          jobTitle: jobDetails?.title,
          company: jobDetails?.company,
          archived: conversation.archived
        };
      })
    );
    
    res.status(200).json({
      status: 'success',
      results: conversationsWithDetails.length,
      data: {
        conversations: conversationsWithDetails
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all messages for a conversation
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId
    });
    
    if (!conversation) {
      res.status(404).json({
        status: 'fail',
        message: 'Conversation not found or you are not a participant'
      });
      return;
    }
    
    // Get all messages for the conversation
    const messages = await Message.find({ conversationId }).sort({ timestamp: 1 });
    
    // Format messages with sender info
    const formattedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = await User.findById(message.senderId).select('name role avatar');
        
        return {
          id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderName: sender?.name || 'Unknown User',
          senderRole: sender?.role || 'unknown',
          senderAvatar: sender?.avatar,
          subject: message.subject,
          content: message.content,
          timestamp: message.timestamp,
          read: message.read?.[userId as string] || false,
          starred: message.starred,
          attachments: message.attachments,
          messageType: message.messageType,
          priority: message.priority
        };
      })
    );
    
    // Reset unread count for this user
    if (conversation.unreadCount) {
      conversation.unreadCount[userId as string] = 0;
      await conversation.save();
    }
    
    res.status(200).json({
      status: 'success',
      results: formattedMessages.length,
      data: {
        messages: formattedMessages
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create a new conversation
export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { participantIds, jobId, initialMessage } = req.body;
    const userId = req.user?.id;
    
    // Check if all participants exist
    for (const participantId of participantIds) {
      const user = await User.findById(participantId);
      if (!user) {
        res.status(404).json({
          status: 'fail',
          message: `User with ID ${participantId} not found`
        });
        return;
      }
    }
    
    // Check if job exists if provided
    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) {
        res.status(404).json({
          status: 'fail',
          message: 'Job not found'
        });
        return;
      }
    }
    
    // Check if conversation already exists between these users
    const existingConversation = await Conversation.findOne({
      'participants.userId': { $all: [...participantIds, userId] },
      jobId: jobId || { $exists: false }
    });
    
    if (existingConversation) {
      res.status(200).json({
        status: 'success',
        data: {
          conversationId: existingConversation._id
        }
      });
      return;
    }
    
    // Get roles of all participants
    const participantsWithRoles = await Promise.all(
      [...participantIds, userId].map(async (id) => {
        const user = await User.findById(id).select('role');
        return {
          userId: id,
          role: user?.role || 'unknown'
        };
      })
    );
    
    // Create new conversation
    const conversation = await Conversation.create({
      participants: participantsWithRoles,
      jobId,
      lastMessageAt: new Date()
    });
    
    // Create initial message if provided
    if (initialMessage) {
      // Create read map for the message - use plain object instead of Map
      const readMap: Record<string, boolean> = {};
      readMap[userId as string] = true;
      
      const message = await Message.create({
        conversationId: conversation._id,
        senderId: userId,
        content: initialMessage.content,
        subject: initialMessage.subject || '',
        messageType: initialMessage.messageType || 'general',
        priority: initialMessage.priority || 'medium',
        read: readMap
      });
      
      // Update unread counts for all participants except sender - use plain object
      const unreadCounts: Record<string, number> = {};
      
      for (const participant of conversation.participants) {
        if (participant.userId.toString() !== userId) {
          unreadCounts[participant.userId.toString()] = 1;
        }
      }
      
      // Update the conversation with unread counts
      conversation.unreadCount = unreadCounts;
      await conversation.save();
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        conversationId: conversation._id
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Archive/unarchive a conversation
export const updateConversationArchiveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { archived } = req.body;
    const userId = req.user?.id;
    
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId
    });
    
    if (!conversation) {
      res.status(404).json({
        status: 'fail',
        message: 'Conversation not found or you are not a participant'
      });
      return;
    }
    
    // Update archived status
    conversation.archived = archived;
    await conversation.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        archived
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Star/unstar a message
export const updateMessageStarStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { starred } = req.body;
    const userId = req.user?.id;
    
    // Check if message exists
    const message = await Message.findById(messageId);
    
    if (!message) {
      res.status(404).json({
        status: 'fail',
        message: 'Message not found'
      });
      return;
    }
    
    // Check if user is participant in the conversation
    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      'participants.userId': userId
    });
    
    if (!conversation) {
      res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to star/unstar this message'
      });
      return;
    }
    
    // Update starred status
    message.starred = starred;
    await message.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        starred
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};