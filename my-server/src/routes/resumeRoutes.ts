import express from 'express';
import { 
  getUserResumes, 
  getResume, 
  createResume, 
  updateResume, 
  deleteResume, 
  setDefaultResume, 
  downloadResume,
  uploadResume,
  upload
} from '../controllers/resumeController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// Resume routes
router.route('/')
  .get(getUserResumes)
  .post(createResume);

router.post('/upload', upload.single('resume'), uploadResume);

router.route('/:id')
  .get(getResume)
  .patch(updateResume)
  .delete(deleteResume);

router.patch('/:id/default', setDefaultResume);
router.patch('/:id/download', downloadResume);

export default router;