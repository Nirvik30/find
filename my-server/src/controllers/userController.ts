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
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    console.log('Getting saved jobs for user:', req.user.id);

    // Find the user and populate their saved jobs
    const user = await User.findById(req.user.id).populate({
      path: 'savedJobs',
      select: 'title company location type salary experience applications views status postedDate applicationDeadline isUrgent requirements skills'
    });
    
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
      return;
    }

    // If savedJobs array doesn't exist, return empty array
    const savedJobs = user.savedJobs || [];
    
    console.log(`Found ${savedJobs.length} saved jobs for user ${req.user.id}`);

    // Add a savedDate to each job
    const jobsWithSavedDate = savedJobs.map((job: any) => {
      const jobObj = job.toObject ? job.toObject() : job;
      // In a real implementation, you would store the saved date
      // For now, we'll use a random date within the last 30 days
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const savedDate = new Date();
      savedDate.setDate(savedDate.getDate() - randomDaysAgo);
      jobObj.savedDate = savedDate;
      return jobObj;
    });

    res.status(200).json({
      status: 'success',
      results: jobsWithSavedDate.length,
      data: {
        savedJobs: jobsWithSavedDate
      }
    });
  } catch (error: any) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching saved jobs'
    });
  }
};

// Save job (for applicants)
export const saveJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const jobId = req.params.jobId;
    
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found'
      });
      return;
    }

    // Add job to user's saved jobs
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { savedJobs: jobId } // Using addToSet to avoid duplicates
    });

    res.status(200).json({
      status: 'success',
      message: 'Job saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving job:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to save job'
    });
  }
};

// Unsave job (for applicants)
export const unsaveJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const jobId = req.params.jobId;
    
    // Remove job from user's saved jobs
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { savedJobs: jobId }
    });

    res.status(200).json({
      status: 'success',
      message: 'Job removed from saved jobs'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to remove job from saved jobs'
    });
  }
};

// Update user profile
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const { name, location, phone, headline, bio, skills, avatar } = req.body;
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, location, phone, headline, bio, skills, avatar },
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
          companyName: user.companyName,
          companyId: user.companyId,
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
    console.error('Error updating user profile:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update profile'
    });
  }
};