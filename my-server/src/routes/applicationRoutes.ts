import express from 'express';
import * as applicationController from '../controllers/applicationController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// All application routes require authentication
router.use(protect);

// Applicant routes
router.get('/my-applications', restrictTo('applicant'), applicationController.getMyApplications);
router.post('/:jobId', restrictTo('applicant'), applicationController.applyForJob);
router.patch('/:id/withdraw', restrictTo('applicant'), applicationController.withdrawApplication);

// Recruiter routes
router.get('/job/:jobId', restrictTo('recruiter'), applicationController.getApplicationsByJob);
router.get('/stats', restrictTo('recruiter'), applicationController.getApplicationStats);
router.patch('/:id/status', restrictTo('recruiter'), applicationController.updateApplicationStatus);
router.post('/:id/interview', restrictTo('recruiter'), applicationController.scheduleInterview);
router.get('/candidates', restrictTo('recruiter'), applicationController.getCandidates);

export default router;