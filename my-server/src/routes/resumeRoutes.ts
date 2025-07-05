import express from 'express';
import * as resumeController from '../controllers/resumeController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All resume routes require authentication
router.use(protect);

// Get all resumes for the logged-in user and create new resume
router.route('/')
  .get(resumeController.getUserResumes)
  .post(resumeController.createResume);

// Get, update, delete specific resume by ID
router.route('/:id')
  .get(resumeController.getResume)
  .patch(resumeController.updateResume)
  .delete(resumeController.deleteResume);

// Set a resume as default
router.patch('/:id/default', resumeController.setDefaultResume);

// Track resume download
router.patch('/:id/download', resumeController.downloadResume);

export default router;