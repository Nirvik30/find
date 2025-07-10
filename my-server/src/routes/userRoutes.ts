import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  getSavedJobs, 
  saveJob, 
  unsaveJob 
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Protected routes
router.use(protect);

// Profile routes
router.get('/profile', getUserProfile);
router.patch('/profile', updateUserProfile);

// Saved jobs routes
router.get('/saved-jobs', getSavedJobs);
router.post('/saved-jobs/:jobId', saveJob);
router.delete('/saved-jobs/:jobId', unsaveJob);

export default router;