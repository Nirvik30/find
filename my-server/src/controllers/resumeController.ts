import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Resume from '../models/resumeModel';
import User from '../models/userModel';
import mongoose from 'mongoose';

// Define the AuthRequest interface
interface AuthRequest extends Request {
  user?: { id: string; role?: string; name?: string; };
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Create and export the upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all resumes for the logged-in user
export const getUserResumes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resumes = await Resume.find({ userId: req.user?.id }).sort('-updatedAt');
    
    res.status(200).json({
      status: 'success',
      results: resumes.length,
      data: {
        resumes
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve resumes'
    });
  }
};

// Get a single resume
export const getResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (!resume) {
      res.status(404).json({
        status: 'fail',
        message: 'Resume not found or you do not have permission to view it'
      });
      return;
    }
    
    // Increment view count
    resume.viewCount = (resume.viewCount || 0) + 1;
    await resume.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        resume
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve resume'
    });
  }
};

// Create a new resume
export const createResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
      return;
    }
    
    // Create resume with user info
    const resumeData = {
      ...req.body,
      userId: req.user?.id,
      personalInfo: {
        ...req.body.personalInfo,
        name: req.body.personalInfo?.name || user.name,
        email: req.body.personalInfo?.email || user.email
      }
    };
    
    const resume = await Resume.create(resumeData);
    
    // If this is the user's first resume, make it default
    const userResumeCount = await Resume.countDocuments({ userId: req.user?.id });
    if (userResumeCount === 1) {
      resume.isDefault = true;
      await resume.save();
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        resume
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create resume'
    });
  }
};

// Upload resume file - EXPORTED FUNCTION
export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        status: 'fail',
        message: 'No file uploaded'
      });
      return;
    }

    const { name, type = 'uploaded' } = req.body;
    
    if (!name) {
      res.status(400).json({
        status: 'fail',
        message: 'Resume name is required'
      });
      return;
    }

    const resumeData = {
      userId: req.user?.id,
      name: name.trim(),
      type,
      fileName: req.file.originalname,
      fileUrl: `/uploads/resumes/${req.file.filename}`,
      fileSize: req.file.size,
      status: 'published',
      downloadCount: 0,
      viewCount: 0
    };

    const resume = await Resume.create(resumeData);

    // If this is the user's first resume, make it default
    const userResumeCount = await Resume.countDocuments({ userId: req.user?.id });
    if (userResumeCount === 1) {
      resume.isDefault = true;
      await resume.save();
    }

    res.status(201).json({
      status: 'success',
      data: {
        resume
      }
    });
  } catch (error: any) {
    // Clean up uploaded file if resume creation fails
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to upload resume'
    });
  }
};

// Update a resume
export const updateResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (!resume) {
      res.status(404).json({
        status: 'fail',
        message: 'Resume not found or you do not have permission to update it'
      });
      return;
    }
    
    const updatedResume = await Resume.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        resume: updatedResume
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update resume'
    });
  }
};

// Delete a resume
export const deleteResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (!resume) {
      res.status(404).json({
        status: 'fail',
        message: 'Resume not found or you do not have permission to delete it'
      });
      return;
    }
    
    // If this is the default resume and there are other resumes, prevent deletion
    if (resume.isDefault) {
      const otherResumes = await Resume.find({ 
        userId: req.user?.id, 
        _id: { $ne: req.params.id } 
      });
      
      if (otherResumes.length > 0) {
        res.status(400).json({
          status: 'fail',
          message: 'Cannot delete your default resume. Please set another resume as default first.'
        });
        return;
      }
    }
    
    // Delete file if it's an uploaded resume
    if (resume.type === 'uploaded' && resume.fileUrl) {
      const filePath = path.join(__dirname, '../../', resume.fileUrl);
      fs.unlink(filePath, () => {});
    }
    
    await Resume.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete resume'
    });
  }
};

// Set a resume as default
export const setDefaultResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (!resume) {
      res.status(404).json({
        status: 'fail',
        message: 'Resume not found or you do not have permission to update it'
      });
      return;
    }
    
    // Remove default status from all other resumes
    await Resume.updateMany(
      { userId: req.user?.id },
      { isDefault: false }
    );
    
    // Set this resume as default
    resume.isDefault = true;
    await resume.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        resume
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to set resume as default'
    });
  }
};

// Download a resume (increment download count)
export const downloadResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.id,
      userId: req.user?.id
    });
    
    if (!resume) {
      res.status(404).json({
        status: 'fail',
        message: 'Resume not found or you do not have permission to download it'
      });
      return;
    }
    
    // Increment download count
    resume.downloadCount = (resume.downloadCount || 0) + 1;
    await resume.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Resume download count updated',
      data: {
        resume
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process resume download'
    });
  }
};