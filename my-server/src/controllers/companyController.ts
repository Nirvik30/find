import { Request, Response } from 'express';
import Company from '../models/companyModel';
import User from '../models/userModel';
import mongoose from 'mongoose';

// Define interface to extend Request
interface AuthenticatedRequest extends Request {
  user?: { id: string; role?: string; name?: string; };
}

// Get company profile (by recruiter)
export const getCompanyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
      return;
    }
    
    if (user.role !== 'recruiter') {
      res.status(403).json({
        status: 'fail',
        message: 'Only recruiters can access company profiles'
      });
      return;
    }
    
    if (!user.companyId) {
      res.status(404).json({
        status: 'fail',
        message: 'No company associated with this recruiter'
      });
      return;
    }
    
    const company = await Company.findById(user.companyId);
    
    if (!company) {
      res.status(404).json({
        status: 'fail',
        message: 'Company not found'
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        company
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve company profile'
    });
  }
};

// Update company profile
export const updateCompanyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
      return;
    }
    
    if (user.role !== 'recruiter') {
      res.status(403).json({
        status: 'fail',
        message: 'Only recruiters can update company profiles'
      });
      return;
    }
    
    if (!user.companyId) {
      res.status(404).json({
        status: 'fail',
        message: 'No company associated with this recruiter'
      });
      return;
    }
    
    // Ensure required fields are present
    const { name, industry, website, location, size, about } = req.body;
    
    if (!name || !industry || !website || !location || !size || !about) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide all required company information'
      });
      return;
    }
    
    // Update company
    const company = await Company.findByIdAndUpdate(
      user.companyId,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!company) {
      res.status(404).json({
        status: 'fail',
        message: 'Company not found'
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        company
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update company profile'
    });
  }
};

// Get company profile by ID (for public view)
export const getCompanyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const company = await Company.findById(id);
    
    if (!company) {
      res.status(404).json({
        status: 'fail',
        message: 'Company not found'
      });
      return;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        company
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve company profile'
    });
  }
};

// Upload company logo
export const uploadCompanyLogo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // This would use a file upload middleware like multer
    // For now, we'll assume the file URL is passed in the request body
    const { logoUrl } = req.body;
    const user = await User.findById(req.user?.id);
    
    if (!user || !user.companyId) {
      res.status(404).json({
        status: 'fail',
        message: 'User or company not found'
      });
      return;
    }
    
    const company = await Company.findByIdAndUpdate(
      user.companyId,
      { logo: logoUrl },
      { new: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        logo: company?.logo
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to upload company logo'
    });
  }
};

// Upload company cover image
export const uploadCompanyCover = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // This would use a file upload middleware like multer
    // For now, we'll assume the file URL is passed in the request body
    const { coverImageUrl } = req.body;
    const user = await User.findById(req.user?.id);
    
    if (!user || !user.companyId) {
      res.status(404).json({
        status: 'fail',
        message: 'User or company not found'
      });
      return;
    }
    
    const company = await Company.findByIdAndUpdate(
      user.companyId,
      { coverImage: coverImageUrl },
      { new: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        coverImage: company?.coverImage
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to upload company cover image'
    });
  }
};