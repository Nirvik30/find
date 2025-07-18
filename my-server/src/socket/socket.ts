import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/messageModel';
import Conversation from '../models/conversationModel';
import { config } from '../config/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export default function setupSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // In production, restrict this to your client domain
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  // Store online users
  const onlineUsers = new Map<string, string>(); // userId -> socketId
  
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string, role: string };
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  // Connection handling
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);
    
    if (socket.userId) {
      // Add user to online users
      onlineUsers.set(socket.userId, socket.id);
      
      // Notify others that this user is online
      socket.broadcast.emit('user_online', { userId: socket.userId });
      
      // Send current online users to the newly connected user
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit('online_users', { userIds: onlineUserIds });
    }
    
    // Handle typing indicators
    socket.on('typing_start', async ({ conversationId }) => {
      if (!socket.userId) return;
      
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;
      
      // Find other participants to notify
      const otherParticipants = conversation.participants
        .filter(p => p.userId.toString() !== socket.userId)
        .map(p => p.userId.toString());
      
      // Emit typing event to other participants
      otherParticipants.forEach(participantId => {
        const participantSocketId = onlineUsers.get(participantId);
        if (participantSocketId) {
          io.to(participantSocketId).emit('typing_started', {
            userId: socket.userId,
            conversationId
          });
        }
      });
    });
    
    socket.on('typing_stop', async ({ conversationId }) => {
      if (!socket.userId) return;
      
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;
      
      // Find other participants to notify
      const otherParticipants = conversation.participants
        .filter(p => p.userId.toString() !== socket.userId)
        .map(p => p.userId.toString());
      
      // Emit typing stopped event to other participants
      otherParticipants.forEach(participantId => {
        const participantSocketId = onlineUsers.get(participantId);
        if (participantSocketId) {
          io.to(participantSocketId).emit('typing_stopped', {
            userId: socket.userId,
            conversationId
          });
        }
      });
    });
    
    // Handle message read events - critical for real-time read receipts
    socket.on('message_read', async ({ conversationId, messageId }) => {
      if (!socket.userId) return;
      
      try {
        // Update the message in the database
        const message = await Message.findById(messageId);
        if (!message) return;
        
        // Set read status for this user
        await Message.updateOne(
          { _id: messageId },
          { $set: { [`read.${socket.userId}`]: true } }
        );
        
        // Notify the sender that their message has been read
        const senderId = message.senderId.toString();
        const senderSocketId = onlineUsers.get(senderId);
        
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_read', {
            messageId,
            conversationId,
            readBy: socket.userId
          });
        }
      } catch (error) {
        console.error('Error handling message_read event:', error);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        console.log(`User disconnected: ${socket.userId}`);
        onlineUsers.delete(socket.userId);
        
        // Notify others that this user is offline
        socket.broadcast.emit('user_offline', { userId: socket.userId });
      }
    });
  });
  
  // Function to emit new message event - call this from messageController
  const emitNewMessage = (message: any) => {
    try {
      // Find conversation participants
      Conversation.findById(message.conversationId)
        .then(conversation => {
          if (!conversation) return;
          
          // Get all participants except the sender
          const participantIds = conversation.participants
            .map(p => p.userId.toString())
            .filter(id => id !== message.senderId.toString());
          
          // Emit to sender (confirmation)
          const senderSocketId = onlineUsers.get(message.senderId.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('new_message', { message });
          }
          
          // Emit to each participant
          participantIds.forEach(participantId => {
            const socketId = onlineUsers.get(participantId);
            if (socketId) {
              io.to(socketId).emit('new_message', { message });
            }
          });
        })
        .catch(err => console.error('Error finding conversation participants:', err));
    } catch (error) {
      console.error('Error emitting new message:', error);
    }
  };
  
  return { io, emitNewMessage };
}