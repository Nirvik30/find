// Simplify the typing approach to avoid complex type assertions
import { Request, Response } from 'express';
import Job, { IJob } from '../models/jobModel';
import User from '../models/userModel';
import Company from '../models/companyModel';
import mongoose from 'mongoose';

// Define an extended request type for all functions
interface AuthRequest extends Request {
  user?: { id: string; role?: string; name?: string; };
}

// Get all jobs (with filtering, sorting, pagination)
export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Create query object from request query params
    const queryObj = { ...req.query };
    
    // Fields to exclude from filtering
    const excludeFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludeFields.forEach(field => delete queryObj[field]);
    
    // Filter by status=active if not specified and not recruiter view
    if (!queryObj.status && !req.query.recruiterView) {
      queryObj.status = 'active';
    }
    
    // Convert query to string for manipulation
    let queryStr = JSON.stringify(queryObj);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Start building query
    let query: any = Job.find(JSON.parse(queryStr));
    
    // Handle search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query = query.or([
        { title: searchRegex },
        { company: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
        { skills: searchRegex }
      ]);
    }
    
    // Sorting
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      // Default sorting by latest
      query = query.sort('-postedDate');
    }
    
    // Field limiting
    if (req.query.fields) {
      const fields = (req.query.fields as string).split(',').join(' ');
      query = query.select(fields);
    }
    
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    query = query.skip(skip).limit(limit);
    
    // Execute query
    const jobs = await query;
    
    // Get total count for pagination
    const total = await Job.countDocuments(JSON.parse(queryStr));
    
    res.status(200).json({
      status: 'success',
      results: jobs.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: {
        jobs
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single job
export const getJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found'
      });
      return;
    }
    
    // Increment view count
    job.views += 1;
    await job.save();
    
    // Get company info
    const company = await Company.findById(job.companyId).select('name logo industry website location size founded about mission culture benefits');
    
    res.status(200).json({
      status: 'success',
      data: {
        job,
        company
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create job
export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    // Ensure user is a recruiter
    const user = await User.findById(req.user?.id);
    
    if (!user || user.role !== 'recruiter') {
      res.status(403).json({
        status: 'fail',
        message: 'Only recruiters can create jobs'
      });
      return;
    }

    // Get company - if no company exists, create a basic one
    let companyId: any = user.companyId;
    let companyName: string = user.companyName || '';

    if (!companyId) {
      // Create a basic company profile for the recruiter
      const newCompany = await Company.create({
        name: req.body.company || `${user.name}'s Company`,
        industry: 'Technology', // Default industry
        website: '',
        location: req.body.location || 'Not specified',
        size: '1-10',
        about: 'Company profile to be updated',
        founded: new Date().getFullYear().toString()
      });

      // Update user with company reference
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          companyId: newCompany._id,
          companyName: newCompany.name
        },
        { new: true }
      );

      if (!updatedUser) {
        res.status(500).json({
          status: 'error',
          message: 'Failed to update user with company information'
        });
        return;
      }

      companyId = newCompany._id as mongoose.Types.ObjectId;
      companyName = newCompany.name;
    }

    // Create job with all required fields
    const jobData = {
      title: req.body.title,
      description: req.body.description,
      company: companyName,
      companyId: companyId,
      location: req.body.location,
      type: req.body.type,
      experience: req.body.experience,
      salary: req.body.salary,
      responsibilities: req.body.responsibilities || [],
      requirements: req.body.requirements || [],
      benefits: req.body.benefits || [],
      skills: req.body.skills || [],
      applicationDeadline: req.body.applicationDeadline,
      isUrgent: req.body.isUrgent || false,
      status: req.body.status || 'draft',
      recruiterId: user._id,
      postedDate: new Date(),
      updatedDate: new Date(),
      views: 0,
      applications: 0
    };

    const job = await Job.create(jobData);

    res.status(201).json({
      status: 'success',
      data: {
        job
      }
    });
  } catch (error: any) {
    console.error('Job creation error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create job'
    });
  }
};

// Update job
export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Find job
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found'
      });
      return;
    }
    
    // Check ownership
    if (job.recruiterId.toString() !== req.user?.id) {
      res.status(403).json({
        status: 'fail',
        message: 'You can only update your own job posts'
      });
      return;
    }
    
    // Update job
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
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete job
export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Find job
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found'
      });
      return;
    }
    
    // Check ownership
    if (job.recruiterId.toString() !== req.user?.id) {
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
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get recruiter jobs
export const getRecruiterJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({ recruiterId: req.user?.id }).sort('-postedDate');
    
    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: {
        jobs
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve recruiter jobs'
    });
  }
};

// Get job statistics for dashboard
export const getJobStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get counts by status
    const statusStats = await Job.aggregate([
      { $match: { recruiterId: new mongoose.Types.ObjectId(req.user?.id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Format the results into a more usable structure
    const stats = {
      total: 0,
      active: 0,
      draft: 0,
      closed: 0,
      filled: 0
    };

    statusStats.forEach((stat: any) => {
      stats[stat._id as keyof typeof stats] = stat.count;
      stats.total += stat.count;
    });

    // Get application stats
    const applicationStats = await Job.aggregate([
      { $match: { recruiterId: new mongoose.Types.ObjectId(req.user?.id) } },
      { $group: { _id: null, totalApplications: { $sum: '$applications' } } }
    ]);

    const totalApplications = applicationStats.length > 0 ? applicationStats[0].totalApplications : 0;

    // Get recent jobs
    const recentJobs = await Job.find({ recruiterId: req.user?.id })
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
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve job statistics'
    });
  }
};

// Get all jobs with search and filters
export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build query object
    const queryObj: any = { status: 'active' }; // Only show active jobs to applicants
    
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
      .sort('-postedDate')
      .skip(skip)
      .limit(limit)
      .populate('companyId', 'name logo industry')
      .select('-recruiterId'); // Don't expose recruiter ID to applicants
    
    const total = await Job.countDocuments(queryObj);
    
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
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve jobs'
    });
  }
};