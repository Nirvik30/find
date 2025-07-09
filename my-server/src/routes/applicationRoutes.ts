import express from 'express';
import {
  applyForJob,
  getMyApplications,
  withdrawApplication,
  getApplicationsByJob,
  updateApplicationStatus,
  getCandidates
} from '../controllers/applicationController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Applicant routes
router.post('/:jobId', restrictTo('applicant'), applyForJob);
router.get('/my-applications', restrictTo('applicant'), getMyApplications);
router.patch('/:id/withdraw', restrictTo('applicant'), withdrawApplication);

// Recruiter routes
router.get('/job/:jobId', restrictTo('recruiter'), getApplicationsByJob);
router.patch('/:id/status', restrictTo('recruiter'), updateApplicationStatus);
router.get('/candidates', restrictTo('recruiter'), getCandidates);

export default router;