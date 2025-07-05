import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

// Import routes
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import applicationRoutes from './routes/applicationRoutes';
import resumeRoutes from './routes/resumeRoutes';
import companyRoutes from './routes/companyRoutes';
import messageRoutes from './routes/messageRoutes';
import userRoutes from './routes/userRoutes';
import uploadRoutes from './routes/uploadRoutes';

// Define types for socket events
interface JoinConversationData {
  conversationId: string;
}

interface MessageData {
  conversationId: string;
  message: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  [key: string]: any; // Allow for other properties
}

interface TypingData {
  conversationId: string;
  userId: string;
  userName: string;
}

// Create Express app
const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('JobFinder API is running');
});

// Socket.io event handling
io.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.id);
  
  // Join a room (conversation)
  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation: ${conversationId}`);
  });
  
  // Handle new message
  socket.on('new_message', (messageData: MessageData) => {
    io.to(messageData.conversationId).emit('new_message', messageData);
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data: TypingData) => {
    socket.to(data.conversationId).emit('typing_start', data);
  });
  
  socket.on('typing_end', (data: TypingData) => {
    socket.to(data.conversationId).emit('typing_end', data);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobfinder')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
