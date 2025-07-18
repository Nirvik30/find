import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import Conversation from '../models/conversationModel';
import Message from '../models/messageModel';

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

interface SocketWithUser extends Socket {
  user?: {
    id: string;
    role: string;
    name: string;
  };
}

// Map to track online users
const onlineUsers = new Map<string, string>();

export const setupSocketServer = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: SocketWithUser, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
      const user = await User.findById(decoded.id).select('name role');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.user = {
        id: user._id.toString(),
        role: user.role,
        name: user.name
      };
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: SocketWithUser) => {
    if (!socket.user) {
      socket.disconnect();
      return;
    }
    
    const userId = socket.user.id;
    console.log(`User ${socket.user.name} (${userId}) connected`);
    
    // Add user to online users
    onlineUsers.set(userId, socket.id);
    
    // Join user to their own room
    socket.join(userId);
    
    // Broadcast that user is online to their conversations
    socket.broadcast.emit('user_online', { userId });
    
    // Send currently online users to the connected user
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('online_users', { userIds: onlineUserIds });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.name} (${userId}) disconnected`);
      onlineUsers.delete(userId);
      io.emit('user_offline', { userId });
    });
    
    // Handle joining conversation rooms
    socket.on('join_conversation', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        
        // Verify user is participant in conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.userId': userId
        });
        
        if (conversation) {
          socket.join(conversationId);
          console.log(`User ${userId} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });
    
    // Handle leaving conversation rooms
    socket.on('leave_conversation', (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.leave(conversationId);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });
    
    // Handle new message
    socket.on('send_message', async (data: { 
      conversationId: string;
      content: string;
      messageType?: string;
      priority?: string;
    }) => {
      try {
        const { conversationId, content, messageType = 'general', priority = 'medium' } = data;
        
        // Verify user is participant in conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.userId': userId
        });
        
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found or access denied' });
          return;
        }
        
        // Create message
        const message = await Message.create({
          conversationId,
          senderId: userId,
          content: content.trim(),
          messageType,
          priority,
          timestamp: new Date(),
          read: { [userId]: true },
          starred: false
        });
        
        // Fix: Handle unreadCount properly
        const currentUnreadCount = conversation.unreadCount || {};
        const unreadCount = { ...currentUnreadCount };
        
        for (const participant of conversation.participants) {
          const participantId = participant.userId.toString();
          if (participantId !== userId) {
            unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
          }
        }
        
        await Conversation.updateOne(
          { _id: conversationId },
          { 
            $set: { 
              unreadCount,
              lastMessageAt: new Date()
            }
          }
        );
        
        // Get sender info
        const sender = await User.findById(userId).select('name role avatar');
        
        // Format message for broadcast
        const formattedMessage = {
          id: message._id,
          conversationId,
          senderId: userId,
          senderName: sender?.name || 'Unknown User',
          senderRole: sender?.role || 'unknown',
          senderAvatar: sender?.avatar,
          content: message.content,
          timestamp: message.timestamp,
          read: message.read,
          starred: message.starred,
          messageType: message.messageType,
          priority: message.priority
        };
        
        // Send to all participants in the conversation
        io.to(conversationId).emit('new_message', { message: formattedMessage });
        
        // Also send to individual user rooms for notification
        for (const participant of conversation.participants) {
          const participantId = participant.userId.toString();
          io.to(participantId).emit('conversation_updated', {
            conversationId,
            lastMessage: formattedMessage,
            unreadCount: unreadCount[participantId] || 0
          });
        }
        
      } catch (error) {
        console.error('Error handling new message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicators
    socket.on('typing_start', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        
        // Verify user is participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.userId': userId
        });
        
        if (!conversation) return;
        
        // Update typing status in database
        await Conversation.updateOne(
          { 
            _id: conversationId,
            'participants.userId': userId 
          },
          { 
            $set: { 'participants.$.isTyping': true }
          }
        );
        
        // Broadcast to other participants
        socket.to(conversationId).emit('typing_started', { 
          userId,
          userName: socket.user.name,
          conversationId
        });
        
      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });
    
    socket.on('typing_stop', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        
        // Update typing status in database
        await Conversation.updateOne(
          { 
            _id: conversationId,
            'participants.userId': userId 
          },
          { 
            $set: { 'participants.$.isTyping': false }
          }
        );
        
        // Broadcast to other participants
        socket.to(conversationId).emit('typing_stopped', { 
          userId,
          userName: socket.user.name,
          conversationId
        });
        
      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });
    
    // Handle mark as read
    socket.on('mark_read', async (data: { conversationId: string, messageId: string }) => {
      try {
        const { conversationId, messageId } = data;
        
        // Update message read status
        await Message.updateOne(
          { _id: messageId },
          { $set: { [`read.${userId}`]: true } }
        );
        
        // Update conversation unread count (ensure it doesn't go below 0)
        await Conversation.updateOne(
          { _id: conversationId },
          { 
            $set: {
              [`unreadCount.${userId}`]: Math.max(0, (await Conversation.findById(conversationId))?.unreadCount?.[userId] - 1 || 0)
            }
          }
        );
        
        // Notify other participants
        socket.to(conversationId).emit('message_read', { 
          conversationId, 
          messageId,
          userId
        });
        
      } catch (error) {
        console.error('Error handling mark as read:', error);
      }
    });
  });
};