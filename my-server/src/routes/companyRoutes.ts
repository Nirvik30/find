import express from 'express';
import * as companyController from '../controllers/companyController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/:id', companyController.getCompanyById);

// Protected routes
router.use(protect);

// Recruiter routes
router.get('/profile', restrictTo('recruiter'), companyController.getCompanyProfile);
router.patch('/profile', restrictTo('recruiter'), companyController.updateCompanyProfile);
router.patch('/logo', restrictTo('recruiter'), companyController.uploadCompanyLogo);
router.patch('/cover', restrictTo('recruiter'), companyController.uploadCompanyCover);

export default router;