import { Request, Response } from 'express';
import User from '../models/userModel';
import Job from '../models/jobModel';
import Application from '../models/applicationModel';
import mongoose from 'mongoose';

// Define the AuthRequest interface
interface AuthRequest extends Request {
  user?: { id: string; role?: string; name?: string; };
}

// Get user profile
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Users can view their own profile or recruiters can view applicant profiles
    if (id !== req.user?.id && req.user?.role !== 'recruiter' && req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this profile'
      });
      return;
    }
    
    const user = await User.findById(id).select('-__v -createdAt -updatedAt -emailVerificationToken -resetPasswordToken -resetPasswordExpire');
    
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
        user
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update user avatar
export const updateAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // This would use a file upload middleware like multer
    // For now, we'll assume the file URL is passed in the request body
    const { avatarUrl } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { avatar: avatarUrl },
      { new: true }
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
        avatar: user.avatar
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get applicants (for recruiters)
export const getApplicants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'recruiter' && req.user?.role !== 'admin') {
      res.status(403).json({
        status: 'fail',
        message: 'Only recruiters can access applicant data'
      });
      return;
    }
    
    // Get all jobs posted by this recruiter
    const jobs = await Job.find({ recruiterId: req.user?.id });
    const jobIds = jobs.map(job => job._id);
    
    // Get all applications for these jobs
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .select('applicantId')
      .distinct('applicantId');
    
    // Get applicant profiles
    const applicants = await User.find({ 
      _id: { $in: applications },
      role: 'applicant'
    }).select('name email location avatar headline skills');
    
    res.status(200).json({
      status: 'success',
      results: applicants.length,
      data: {
        applicants
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get saved jobs (for applicants)
export const getSavedJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // In a real implementation, this would retrieve saved jobs from a separate collection
    // For now, we'll return an empty array
    res.status(200).json({
      status: 'success',
      results: 0,
      data: {
        savedJobs: []
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Save job (for applicants)
export const saveJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    // Check if job exists
    const job = await Job.findById(jobId);
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found'
      });
      return;
    }
    
    // In a real implementation, this would save the job to a separate collection
    // For now, we'll just return a success response
    res.status(200).json({
      status: 'success',
      message: 'Job saved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Unsave job (for applicants)
export const unsaveJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    // In a real implementation, this would remove the job from a separate collection
    // For now, we'll just return a success response
    res.status(200).json({
      status: 'success',
      message: 'Job removed from saved jobs'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};