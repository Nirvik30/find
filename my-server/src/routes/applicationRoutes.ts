import express from 'express';
import {
  applyToJob,
  getMyApplications,
  getCandidates,
  updateApplicationStatus,
  uploadDocuments
} from '../controllers/applicationController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// Application routes
router.get('/my-applications', getMyApplications);
router.get('/candidates', restrictTo('recruiter'), getCandidates);

router.post('/:jobId', uploadDocuments.array('documents', 5), applyToJob);
router.patch('/:id/status', restrictTo('recruiter'), updateApplicationStatus);

export default router;