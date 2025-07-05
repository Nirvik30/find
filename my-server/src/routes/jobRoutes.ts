import express from 'express';
import * as jobController from '../controllers/jobController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJob);

// Protected routes (require authentication)
router.use(protect);

// Recruiter routes
router.get('/recruiter/dashboard', restrictTo('recruiter'), jobController.getRecruiterJobs);
router.get('/recruiter/stats', restrictTo('recruiter'), jobController.getJobStats);
router.post('/', restrictTo('recruiter'), jobController.createJob);
router.patch('/:id', restrictTo('recruiter'), jobController.updateJob);
router.delete('/:id', restrictTo('recruiter'), jobController.deleteJob);

export default router;