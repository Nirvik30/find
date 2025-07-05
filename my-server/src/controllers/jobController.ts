import { Request, Response } from 'express';
import Job, { IJob } from '../models/jobModel';
import User from '../models/userModel';
import Company from '../models/companyModel';
import mongoose from 'mongoose';

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
    let query = Job.find(JSON.parse(queryStr));
    
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
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure user is a recruiter
    const user = await User.findById(req.user?.id);
    
    if (!user || user.role !== 'recruiter') {
      res.status(403).json({
        status: 'fail',
        message: 'Only recruiters can create jobs'
      });
      return;
    }
    
    // Get company
    if (!user.companyId) {
      res.status(400).json({
        status: 'fail',
        message: 'Recruiter must be associated with a company'
      });
      return;
    }
    
    // Create job with recruiter and company info
    const jobData = {
      ...req.body,
      recruiterId: user._id,
      companyId: user.companyId,
      company: user.companyName
    };
    
    const job = await Job.create(jobData);
    
    res.status(201).json({
      status: 'success',
      data: {
        job
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update job
export const updateJob = async (req: Request, res: Response): Promise<void> => {
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
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
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
export const getRecruiterJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({ recruiterId: req.user?.id }).sort('-postedDate');
    
    res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: