import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import applicationRoutes from './routes/applicationRoutes';
import resumeRoutes from './routes/resumeRoutes';
import companyRoutes from './routes/companyRoutes';
import messageRoutes from './routes/messageRoutes';
import userRoutes from './routes/userRoutes';
import uploadRoutes from './routes/uploadRoutes';
import app from './app';
import setupSocketServer from './socket/socket';

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobfinder')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create HTTP server using Express app
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Setup Socket.io and export the socket instance and emitNewMessage function
export const { io, emitNewMessage } = setupSocketServer(server);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
