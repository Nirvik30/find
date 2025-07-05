import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'misc';
    
    // Determine folder based on file type
    if (file.fieldname === 'avatar') {
      folder = 'avatars';
    } else if (file.fieldname === 'resume') {
      folder = 'resumes';
    } else if (file.fieldname === 'logo' || file.fieldname === 'cover') {
      folder = 'companies';
    }
    
    const targetDir = path.join(uploadDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (file.fieldname === 'avatar' || file.fieldname === 'logo' || file.fieldname === 'cover') {
    // For images
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpeg, png and gif images are allowed!'));
    }
  } else if (file.fieldname === 'resume' || file.fieldname === 'attachment') {
    // For documents and resumes
    if ([...allowedImageTypes, ...allowedDocumentTypes].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDF, and Word documents are allowed!'));
    }
  } else {
    cb(null, false);
  }
};

// Configure upload limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB max file size
};

// Create upload middleware
export const upload = multer({ 
  storage, 
  fileFilter,
  limits 
});

// Export upload middleware for different use cases
export const uploadAvatar = upload.single('avatar');
export const uploadResume = upload.single('resume');
export const uploadCompanyFiles = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]);
export const uploadMessageAttachment = upload.single('attachment');