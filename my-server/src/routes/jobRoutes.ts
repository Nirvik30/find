import express from 'express';
import {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getRecruiterJobs,
  getJobStats
} from '../controllers/jobController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllJobs); // For job search by applicants
router.get('/:id', getJob); // Get single job details

// Protected routes - require authentication
router.use(protect);

// Recruiter-only routes
router.post('/', restrictTo('recruiter'), createJob);
router.patch('/:id', restrictTo('recruiter'), updateJob);
router.delete('/:id', restrictTo('recruiter'), deleteJob);

// Recruiter dashboard routes
router.get('/recruiter/dashboard', restrictTo('recruiter'), getRecruiterJobs);
router.get('/stats/dashboard', restrictTo('recruiter'), getJobStats);

export default router;