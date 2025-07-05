import express from 'express';
import * as userController from '../controllers/userController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// All user routes require authentication
router.use(protect);

// User profile routes
router.get('/:id', userController.getUserProfile);
router.patch('/avatar', userController.updateAvatar);

// Applicant routes
router.get('/saved-jobs', restrictTo('applicant'), userController.getSavedJobs);
router.post('/saved-jobs/:jobId', restrictTo('applicant'), userController.saveJob);
router.delete('/saved-jobs/:jobId', restrictTo('applicant'), userController.unsaveJob);

// Recruiter routes
router.get('/applicants', restrictTo('recruiter'), userController.getApplicants);

export default router;