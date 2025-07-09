// Simplify the typing approach to avoid complex type assertions
import { Request, Response } from 'express';
import Job from '../models/jobModel';
import User from '../models/userModel';
import Company from '../models/companyModel';
import Application from '../models/applicationModel';
import mongoose from 'mongoose';

// AuthRequest interface with proper typing
interface AuthRequest extends Request {
  user?: { 
    id: string; 
    role?: string; 
    name?: string;
    email?: string;
    companyId?: any; // Change this from mongoose.Types.ObjectId to any
    companyName?: string;
  };
}

// Get all jobs with search and filters (for applicants)
export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build query object - only show active jobs to applicants
    const queryObj: Record<string, any> = { status: 'active' };
    
    // Search functionality
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      queryObj.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { company: { $regex: searchTerm, $options: 'i' } },
        { skills: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
    }
    
    // Location filter
    if (req.query.location) {
      queryObj.location = { $regex: req.query.location as string, $options: 'i' };
    }
    
    // Job type filter
    if (req.query.type && req.query.type !== 'all') {
      queryObj.type = req.query.type;
    }
    
    // Experience filter
    if (req.query.experience && req.query.experience !== 'all') {
      const experienceLevel = req.query.experience as string;
      queryObj.experience = { $regex: experienceLevel, $options: 'i' };
    }
    
    // Execute query with pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const jobs = await Job.find(queryObj)
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('companyId', 'name logo industry')
      .select('-__v');
    
    const total = await Job.countDocuments(queryObj);
    
    console.log(`Found ${jobs.length} jobs for applicants with query:`, queryObj);
    
    res.status(200).json({
      status: 'success',
      results: jobs.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: {
        jobs
      }
    });
  } catch (error) {
    console.error('Error in getAllJobs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve jobs';
    res.status(500).json({
      status: 'error',
      message: errorMessage
    });
  }
};

// Get single job
export const getJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name logo industry website')
      .populate('recruiterId', 'name email');
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found'
      });
      return;
    }
    
    // Increment view count safely
    const currentViews = job.views || 0;
    job.views = currentViews + 1;
    await job.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        job
      }
    });
  } catch (error) {
    console.error('Error in getJob:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve job';
    res.status(500).json({
      status: 'error',
      message: errorMessage
    });
  }
};

// Create job (recruiters only)
export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Creating job - User:', req.user);
    console.log('Creating job - Body:', req.body);
    
    // Ensure user is authenticated
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    // Ensure user is a recruiter
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'recruiter') {
      res.status(403).json({
        status: 'fail',
        message: 'Only recruiters can create jobs'
      });
      return;
    }

    // Initialize variables with proper types - Fix the type issue
    let finalCompanyId: any; // Use any to avoid type conflicts
    let finalCompanyName: string;

    // Check if user already has a company
    if (user.companyId) {
      // User has existing company
      finalCompanyId = user.companyId;
      finalCompanyName = user.companyName || 'Company';
    } else {
      // Try to find existing company by name first
      const companyName = req.body.company || user.companyName || `${user.name}'s Company`;
      
      let existingCompany = await Company.findOne({ name: companyName });
      
      if (existingCompany) {
        // Use existing company
        finalCompanyId = existingCompany._id;
        finalCompanyName = existingCompany.name;
        
        // Update user with existing company reference
        await User.findByIdAndUpdate(user._id, {
          companyId: existingCompany._id,
          companyName: existingCompany.name
        });
        
        console.log('Using existing company:', existingCompany);
      } else {
        // Create new company only if it doesn't exist
        try {
          const companyData = {
            name: companyName,
            industry: 'Technology',
            website: '',
            location: req.body.location || 'Not specified',
            size: '1-10',
            about: 'Company profile to be updated',
            founded: new Date().getFullYear().toString()
          };

          const newCompany = await Company.create(companyData);

          // Update user with company reference
          await User.findByIdAndUpdate(user._id, {
            companyId: newCompany._id,
            companyName: newCompany.name
          });

          finalCompanyId = newCompany._id;
          finalCompanyName = newCompany.name;
          
          console.log('Created new company:', newCompany);
        } catch (companyError: any) {
          // If still getting duplicate error, try to find the company again
          if (companyError.code === 11000) {
            console.log('Duplicate company detected, finding existing one...');
            const foundCompany = await Company.findOne({ name: companyName });
            
            if (foundCompany) {
              finalCompanyId = foundCompany._id;
              finalCompanyName = foundCompany.name;
              
              // Update user with existing company reference
              await User.findByIdAndUpdate(user._id, {
                companyId: foundCompany._id,
                companyName: foundCompany.name
              });
            } else {
              throw new Error('Failed to create or find company');
            }
          } else {
            throw companyError;
          }
        }
      }
    }

    // Create job with proper typing
    const jobData = {
      title: req.body.title || '',
      description: req.body.description || '',
      company: finalCompanyName,
      companyId: finalCompanyId,
      location: req.body.location || '',
      type: req.body.type || 'Full-time',
      experience: req.body.experience || '',
      salary: req.body.salary || 'Competitive',
      responsibilities: Array.isArray(req.body.responsibilities) ? req.body.responsibilities : [],
      requirements: Array.isArray(req.body.requirements) ? req.body.requirements : [],
      benefits: Array.isArray(req.body.benefits) ? req.body.benefits : [],
      skills: Array.isArray(req.body.skills) ? req.body.skills : [],
      applicationDeadline: req.body.applicationDeadline || undefined,
      isUrgent: Boolean(req.body.isUrgent),
      status: req.body.status || 'active',
      recruiterId: user._id, // Remove type casting here too
      postedDate: new Date(),
      updatedDate: new Date(),
      views: 0,
      applications: 0
    };

    console.log('Job data to create:', jobData);

    const job = await Job.create(jobData);

    console.log('Job created successfully:', job);

    res.status(201).json({
      status: 'success',
      data: {
        job
      }
    });
  } catch (error) {
    console.error('Job creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create job';
    res.status(500).json({
      status: 'error',
      message: errorMessage
    });
  }
};

// Update job (recruiters only)
export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const job = await Job.findById(req.params.id);
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found'
      });
      return;
    }
    
    if (job.recruiterId.toString() !== req.user.id) {
      res.status(403).json({
        status: 'fail',
        message: 'You can only update your own job posts'
      });
      return;
    }
    
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedDate: new Date() },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        job: updatedJob
      }
    });
  } catch (error) {
    console.error('Job update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update job';
    res.status(500).json({
      status: 'error',
      message: errorMessage
    });
  }
};

// Delete job (recruiters only)
export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const job = await Job.findById(req.params.id);
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found'
      });
      return;
    }
    
    if (job.recruiterId.toString() !== req.user.id) {
      res.status(403).json({
        status: 'fail',
        message: 'You can only delete your own job posts'
      });
      return;
    }
    
    await Job.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Job deletion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete job';
    res.status(500).json({
      status: 'error',
      message: errorMessage
    });
  }
};

// Get recruiter jobs
export const getRecruiterJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const jobs = await Job.find({ recruiterId: req.user.id })
      .sort({ postedDate: -1 })
      .populate('companyId', 'name logo');
    
    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: {
        jobs
      }
    });
  } catch (error) {
    console.error('Error fetching recruiter jobs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve recruiter jobs';
    res.status(500).json({
      status: 'error',
      message: errorMessage
    });
  }
};

// Get job statistics for recruiter dashboard
export const getJobStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const recruiterId = new mongoose.Types.ObjectId(req.user.id);

    const stats = await Job.aggregate([
      { $match: { recruiterId: recruiterId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalApplications: { $sum: '$applications' }
        }
      }
    ]);

    const recruiterJobs = await Job.find({ recruiterId: recruiterId }).select('_id');
    const jobIds = recruiterJobs.map(job => job._id);

    const totalApplications = await Application.countDocuments({
      jobId: { $in: jobIds }
    });

    const recentJobs = await Job.find({ recruiterId: recruiterId })
      .sort({ postedDate: -1 })
      .limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        totalApplications,
        recentJobs
      }
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve job statistics';
    res.status(500).json({
      status: 'error',
      message: errorMessage
    });
  }
};