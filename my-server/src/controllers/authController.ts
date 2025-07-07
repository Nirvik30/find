// filepath: c:\Users\DELL\Desktop\jobfinder\my-server\src\controllers\authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from '../models/userModel';
import Company from '../models/companyModel';
import mongoose from 'mongoose';

// JWT constants
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Replace the signToken function in authController.ts (line 15-17):
const signToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET as jwt.Secret, { 
    expiresIn: JWT_EXPIRES_IN 
  } as jwt.SignOptions);
};

// AuthRequest interface
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

// Register user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, companyName } = req.body;

    // Validate role
    if (!['applicant', 'recruiter'].includes(role)) {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid role. Must be either applicant or recruiter'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email'
      });
      return;
    }

    // If recruiter, validate companyName
    if (role === 'recruiter' && !companyName) {
      res.status(400).json({
        status: 'fail',
        message: 'Company name is required for recruiters'
      });
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      companyName: role === 'recruiter' ? companyName : undefined
    });

    // Fixed: Proper type handling for _id
    const token = signToken(String(user._id));

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
      return;
    }

    // Check if user exists & password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
      return;
    }

    // Fixed: Proper type handling for _id
    const token = signToken(String(user._id));

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          companyId: user.companyId,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar,
          location: user.location
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.companyName,
          companyId: user.companyId,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar,
          location: user.location,
          phone: user.phone,
          headline: user.headline,
          bio: user.bio,
          skills: user.skills
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    const user = await User.findOne({ emailVerificationToken: token });
    
    if (!user) {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid verification token'
      });
      return;
    }
    
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Email successfully verified'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'There is no user with that email'
      });
      return;
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiration (10 minutes)
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    
    await user.save({ validateBeforeSave: false });
    
    // In a production app, send email with reset URL
    const resetURL = `${CLIENT_URL}/reset-password?token=${resetToken}`;
    console.log(`Password reset URL: ${resetURL}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    
    // Hash token from parameters
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired token'
      });
      return;
    }
    
    // Update password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Fixed: Proper type handling for _id
    const newToken = signToken(String(user._id));
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
      token: newToken
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, location, phone, headline, bio, skills } = req.body;
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { name, location, phone, headline, bio, skills },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location,
          phone: user.phone,
          headline: user.headline,
          bio: user.bio,
          skills: user.skills,
          avatar: user.avatar
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};