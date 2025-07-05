import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Define the extended Request interface
interface AuthRequest extends Request {
  user?: { 
    id: string; 
    role?: string; 
    name?: string;
  };
}

export const protect = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        status: 'fail',
        message: 'Not authorized to access this route'
      });
      return;
    }

    // Verify token with proper typing
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Get user from token
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'User belonging to this token no longer exists'
      });
      return;
    }

    // Add user to request object
    req.user = {
      id: String(user._id),
      role: user.role
    };
    
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Not authorized to access this route'
    });
  }
};

// Middleware to restrict access based on role
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Check if user exists first, then check role
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
      return;
    }
    next();
  };
};