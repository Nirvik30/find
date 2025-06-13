import express from 'express';
import cors from 'cors';
import homeRoutes from './routes/homeRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/', homeRoutes);
app.use('/api/auth', authRoutes);

export default app;
