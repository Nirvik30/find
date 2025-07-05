import { Request, Response } from 'express';
import Application from '../models/applicationModel';
import Job from '../models/jobModel';
import Resume from '../models/resumeModel';

// Define an extended request type
interface AuthRequest extends Request {
  user?: { id: string; role?: string; name?: string; };
}

// Apply for a job
export const applyForJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { resumeId, coverLetter } = req.body;
    const applicantId = req.user?.id;
    
    // Check if job exists and is active
    const job = await Job.findOne({ _id: jobId, status: 'active' });
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found or not active'
      });
      return;
    }
    
    // Check if resume exists and belongs to applicant
    const resume = await Resume.findOne({ _id: resumeId, userId: applicantId });
    
    if (!resume) {
      res.status(404).json({
        status: 'fail',
        message: 'Resume not found'
      });
      return;
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
    
    // Create application
    const application = await Application.create({
      jobId,
      applicantId,
      resumeId,
      coverLetter,
      status: 'pending',
      appliedDate: new Date(),
      lastUpdated: new Date(),
      priority: 'medium',
      matchScore: Math.floor(Math.random() * 30) + 70 // Mock match score calculation
    });
    
    // Update job applications count
    job.applications += 1;
    await job.save();
    
    res.status(201).json({
      status: 'success',
      data: {
        application
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to apply for job'
    });
  }
};

// Get my applications (for applicants)
export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await Application.find({ applicantId: req.user?.id })
      .sort('-appliedDate')
      .populate('jobId', 'title company location type salary status')
      .populate('resumeId', 'name');
    
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: {
        applications
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve applications'
    });
  }
};

// Withdraw application
export const withdrawApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      applicantId: req.user?.id
    });
    
    if (!application) {
      res.status(404).json({
        status: 'fail',
        message: 'Application not found'
      });
      return;
    }
    
    // Can only withdraw pending or reviewing applications
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
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to withdraw application'
    });
  }
};

// Get applications for a job (for recruiters)
export const getApplicationsByJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    // Verify job belongs to recruiter
    const job = await Job.findOne({
      _id: jobId,
      recruiterId: req.user?.id
    });
    
    if (!job) {
      res.status(404).json({
        status: 'fail',
        message: 'Job not found or you do not have permission to view applications'
      });
      return;
    }
    
    const applications = await Application.find({ jobId })
      .sort('-appliedDate')
      .populate('applicantId', 'name email avatar location')
      .populate('resumeId', 'name template');
    
    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: {
        applications
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve applications'
    });
  }
};

// Update application status (for recruiters)
export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes, priority } = req.body;
    
    // Find application and verify ownership
    const application = await Application.findById(id)
      .populate('jobId', 'recruiterId');
    
    if (!application) {
      res.status(404).json({
        status: 'fail',
        message: 'Application not found'
      });
      return;
    }
    
    // Check if job belongs to recruiter
    if ((application.jobId as any).recruiterId.toString() !== req.user?.id) {
      res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to update this application'
      });
      return;
    }
    
    // Update application
    application.status = status || application.status;
    if (notes) {
      if (!application.notes) application.notes = [];
      application.notes.push(`${new Date().toISOString()}: ${notes}`);
    }
    if (priority) application.priority = priority;
    application.lastUpdated = new Date();
    
    await application.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        application
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update application status'
    });
  }
};

// Schedule interview (for recruiters)
export const scheduleInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, date, duration, interviewers } = req.body;
    
    // Find application and verify ownership
    const application = await Application.findById(id)
      .populate('jobId', 'recruiterId');
    
    if (!application) {
      res.status(404).json({
        status: 'fail',
        message: 'Application not found'
      });
      return;
    }
    
    // Check if job belongs to recruiter
    if ((application.jobId as any).recruiterId.toString() !== req.user?.id) {
      res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to schedule an interview for this application'
      });
      return;
    }
    
    // Create interview
    const interview = {
      id: `int_${Date.now()}`,
      type,
      date: new Date(date),
      duration,
      interviewers,
      status: 'scheduled'
    };
    
    // Add interview to application
    if (!application.interviews) application.interviews = [];
    application.interviews.push(interview as any);
    
    // Update application status if not already in interview stage
    if (application.status !== 'interview') {
      application.status = 'interview';
    }
    
    application.lastUpdated = new Date();
    await application.save();
    
    res.status(201).json({
      status: 'success',
      data: {
        interview,
        application
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to schedule interview'
    });
  }
};

// Get application statistics (for recruiters)
export const getApplicationStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all jobs by recruiter
    const jobs = await Job.find({ recruiterId: req.user?.id });
    const jobIds = jobs.map(job => job._id);
    
    // Get application stats by status
    const stats = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format stats
    const formattedStats = {
      total: 0,
      pending: 0,
      reviewing: 0,
      interview: 0,
      offer: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0
    };
    
    stats.forEach(stat => {
      const status = stat._id as keyof typeof formattedStats;
      if (status in formattedStats) {
        formattedStats[status] = stat.count;
      }
      formattedStats.total += stat.count;
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        stats: formattedStats
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve application statistics'
    });
  }
};

// Get candidates list for ApplicationsList view (for recruiters)
export const getCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get query params for filtering
    const { jobId, status, search } = req.query;
    
    // Build query
    const query: any = {};
    
    // Get all jobs by recruiter
    const jobs = await Job.find({ recruiterId: req.user?.id });
    const jobIds = jobs.map(job => job._id);
    
    query.jobId = { $in: jobIds };
    
    // Apply filters
    if (jobId) query.jobId = jobId;
    if (status) query.status = status;
    
    // Get applications
    let applications = await Application.find(query)
      .populate('jobId', 'title company')
      .populate('applicantId', 'name email location avatar')
      .populate('resumeId', 'name')
      .sort('-appliedDate');
    
    // Format data for frontend
    const candidates = applications.map(app => {
      // Add additional properties that might be needed in the frontend
      const matchScore = app.matchScore || Math.floor(Math.random() * 30) + 70;
      const starred = false; // This would come from a separate collection in a real app
      
      return {
        id: app._id,
        name: (app.applicantId as any).name,
        email: (app.applicantId as any).email,
        location: (app.applicantId as any).location,
        avatar: (app.applicantId as any).avatar,
        status: app.status,
        jobId: app.jobId,
        jobTitle: (app.jobId as any).title,
        company: (app.jobId as any).company,
        appliedDate: app.appliedDate,
        matchScore,
        starred,
        resumeId: app.resumeId,
        lastActivity: app.lastUpdated,
        priority: app.priority
      };
    });
    
    // Apply search filter after formatting (for more flexibility)
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
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve candidates'
    });
  }
};