import { Request, Response } from 'express';
import Application from '../models/applicationModel';
import Job from '../models/jobModel';
import Resume from '../models/resumeModel';
import User from '../models/userModel';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
  user?: { 
    id: string; 
    role?: string; 
    name?: string;
    email?: string;
  };
}

// Configure multer for application documents
const applicationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/applications');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

export const uploadDocuments = multer({
  storage: applicationStorage,
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Apply for a job
export const applyForJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { resumeId, coverLetter } = req.body;
    const applicantId = req.user?.id;

    if (!applicantId) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    // Check if job exists and is active
    const job = await Job.findOne({ _id: jobId, status: 'active' });
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found or not active'
      });
      return;
    }
    
    // Only check resume if resumeId is provided
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: applicantId });
      
      if (!resume) {
        res.status(404).json({
          status: 'fail',
          message: 'Resume not found or you do not have permission to use this resume'
        });
        return;
      }
    }
    
    // Check if already applied
    const existingApplication = await Application.findOne({ 
      jobId, 
      applicantId 
    });
    
    if (existingApplication) {
      res.status(400).json({
        status: 'fail',
        message: 'You have already applied for this job'
      });
      return;
    }
    
    // Validate that either resume or files are provided
    const hasFiles = req.files && (req.files as Express.Multer.File[]).length > 0;
    if (!resumeId && !hasFiles) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide either a resume or upload documents'
      });
      return;
    }
    
    // Handle uploaded documents
    const documents = req.files ? (req.files as Express.Multer.File[]).map(file => ({
      name: file.originalname,
      url: `/uploads/applications/${file.filename}`,
      size: file.size
    })) : [];

    // Create application
    const applicationData: any = {
      jobId,
      applicantId,
      coverLetter: coverLetter || '',
      status: 'pending',
      appliedDate: new Date(),
      lastUpdated: new Date(),
      documents
    };

    if (resumeId) {
      applicationData.resumeId = resumeId;
    }

    const application = await Application.create(applicationData);
    
    // Update job applications count
    const currentApplications = job.applications || 0;
    job.applications = currentApplications + 1;
    await job.save();
    
    // Populate the application with job and resume details
    const populatedApplication = await Application.findById(application._id)
      .populate('jobId', 'title company location type salary')
      .populate('resumeId', 'name template');
    
    res.status(201).json({
      status: 'success',
      data: {
        application: populatedApplication
      }
    });
  } catch (error: any) {
    // Clean up uploaded files if application creation fails
    if (req.files) {
      (req.files as Express.Multer.File[]).forEach(file => {
        fs.unlink(file.path, () => {});
      });
    }
    
    console.error('Error in applyForJob:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to apply for job'
    });
  }
};

// Get my applications (for applicants)
export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const applications = await Application.find({ applicantId: req.user.id })
      .sort({ appliedDate: -1 })
      .populate('jobId', 'title company location type salary status postedDate')
      .populate('resumeId', 'name template');
    
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: {
        applications
      }
    });
  } catch (error: any) {
    console.error('Error in getMyApplications:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve applications'
    });
  }
};

// Withdraw application
export const withdrawApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const application = await Application.findOne({
      _id: req.params.id,
      applicantId: req.user.id
    });
    
    if (!application) {
      res.status(404).json({
        status: 'fail',
        message: 'Application not found'
      });
      return;
    }
    
    if (!['pending', 'reviewing'].includes(application.status)) {
      res.status(400).json({
        status: 'fail',
        message: 'This application cannot be withdrawn'
      });
      return;
    }
    
    application.status = 'withdrawn';
    application.lastUpdated = new Date();
    await application.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        application
      }
    });
  } catch (error: any) {
    console.error('Error in withdrawApplication:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to withdraw application'
    });
  }
};

// Get applications for a job (for recruiters)
export const getApplicationsByJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const { jobId } = req.params;
    
    const job = await Job.findOne({
      _id: jobId,
      recruiterId: req.user.id
    });
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found or you do not have permission to view applications'
      });
      return;
    }
    
    const applications = await Application.find({ jobId })
      .sort({ appliedDate: -1 })
      .populate('applicantId', 'name email avatar location phone')
      .populate('resumeId', 'name template downloadUrl');
    
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: {
        applications
      }
    });
  } catch (error: any) {
    console.error('Error in getApplicationsByJob:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve applications'
    });
  }
};

// Update application status (for recruiters)
export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const { status, notes, priority } = req.body;
    
    const application = await Application.findById(req.params.id)
      .populate('jobId', 'recruiterId title');
    
    if (!application) {
      res.status(404).json({
        status: 'fail',
        message: 'Application not found'
      });
      return;
    }
    
    const job = application.jobId as any;
    if (job.recruiterId.toString() !== req.user.id) {
      res.status(403).json({
        status: 'fail',
        message: 'You can only update applications for your own jobs'
      });
      return;
    }
    
    if (status) application.status = status;
    if (notes) application.notes = notes;
    if (priority) application.priority = priority;
    application.lastUpdated = new Date();
    
    await application.save();
    
    // Populate the updated application
    const updatedApplication = await Application.findById(application._id)
      .populate('applicantId', 'name email avatar location phone')
      .populate('resumeId', 'name template downloadUrl')
      .populate('jobId', 'title company');
    
    res.status(200).json({
      status: 'success',
      data: {
        application: updatedApplication
      }
    });
  } catch (error: any) {
    console.error('Error in updateApplicationStatus:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update application status'
    });
  }
};

// Get candidates list for recruiters
export const getCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
      return;
    }

    const { jobId, status, search } = req.query;
    
    // Get all jobs by recruiter
    const jobs = await Job.find({ recruiterId: req.user.id });
    const jobIds = jobs.map(job => job._id);
    
    // Build query
    const query: any = {
      jobId: { $in: jobIds }
    };
    
    if (jobId) query.jobId = jobId;
    if (status) query.status = status;
    
    let applications = await Application.find(query)
      .populate('jobId', 'title company')
      .populate('applicantId', 'name email location avatar phone skills')
      .populate('resumeId', 'name fileName fileUrl')
      .sort({ appliedDate: -1 });
    
    // Format data for frontend
    const candidates = applications.map(app => {
      const baseUrl = req.protocol + '://' + req.get('host');
      const resumeUrl = app.resumeId ? 
        `${baseUrl}/uploads/resumes/${(app.resumeId as any)?.fileName}` : 
        '';
      
      // Format documents with full URLs
      const documents = app.documents?.map((doc: any) => ({
        name: doc.name,
        url: doc.url.startsWith('http') ? doc.url : `${baseUrl}${doc.url}`
      })) || [];
      
      return {
        id: app._id.toString(),
        name: (app.applicantId as any).name,
        email: (app.applicantId as any).email,
        phone: (app.applicantId as any).phone || '',
        location: (app.applicantId as any).location || 'Not specified',
        avatar: (app.applicantId as any).avatar || '',
        matchScore: app.matchScore || Math.floor(Math.random() * 30) + 70, // Temp logic
        status: app.status,
        appliedDate: app.appliedDate.toISOString(),
        lastActivity: (app.lastUpdated || app.appliedDate).toISOString(),
        resumeUrl: resumeUrl,
        coverLetter: app.coverLetter,
        documents: documents,
        jobId: (app.jobId as any)._id.toString(),
        jobTitle: (app.jobId as any).title,
        company: (app.jobId as any).company,
        jobMatch: app.matchScore || Math.floor(Math.random() * 30) + 70, // Temp logic
        skills: (app.applicantId as any).skills || [],
        experience: 'Not specified',
        education: 'Not specified',
        notes: app.notes ? [app.notes] : []
      };
    });
    
    // Apply search filter
    let filteredCandidates = candidates;
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredCandidates = candidates.filter(
        candidate =>
          candidate.name.toLowerCase().includes(searchTerm) ||
          candidate.email.toLowerCase().includes(searchTerm) ||
          candidate.location.toLowerCase().includes(searchTerm) ||
          candidate.jobTitle.toLowerCase().includes(searchTerm)
      );
    }
    
    res.status(200).json({
      status: 'success',
      results: filteredCandidates.length,
      data: {
        candidates: filteredCandidates
      }
    });
  } catch (error: any) {
    console.error('Error in getCandidates:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve candidates'
    });
  }
};

// Export alias for backward compatibility
export const applyToJob = applyForJob;