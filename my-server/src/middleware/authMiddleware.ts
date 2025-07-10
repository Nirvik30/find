import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/userModel';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Define the extended Request interface
interface AuthRequest extends Request {
  user?: { 
    id: string; 
    role?: string; 
    name?: string;
    email?: string;
    companyId?: any;
    companyName?: string;
  };
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    
    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check for token in cookies as fallback
    else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    // If no token found, return error
    if (!token) {
      res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.'
      });
      return;
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      
      // Check if user still exists
      const currentUser = await User.findById(decoded.id).select('-password');
      if (!currentUser) {
        res.status(401).json({
          status: 'fail',
          message: 'The user belonging to this token no longer exists.'
        });
        return;
      }

      // Add user to request - Fix the type issue by explicitly converting _id to string
      (req as AuthRequest).user = {
        id: currentUser._id.toString(), // Convert ObjectId to string
        email: currentUser.email,
        role: currentUser.role
      };
      
      next();
    } catch (err) {
      res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to restrict access based on role
export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Check if user exists and is authenticated
    if (!req.user) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    // Check if user has the required role
    if (!req.user.role || !roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'fail',
        message: `Access denied. Required role: ${roles.join(' or ')}, but user role is: ${req.user.role || 'undefined'}`
      });
      return;
    }
    
    next();
  };
};