import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// Define the AuthRequest interface
interface AuthRequest extends Request {
  user?: { id: string; role?: string; name?: string; };
}

export const uploadFile = (req: AuthRequest, res: Response): void => {
  try {
    if (!req.file && !req.files) {
      res.status(400).json({
        status: 'fail',
        message: 'No file uploaded'
      });
      return;
    }

    // Handle single file upload
    if (req.file) {
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      
      res.status(200).json({
        status: 'success',
        data: {
          file: {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: fileUrl
          }
        }
      });
      return;
    }

    // Handle multiple files upload
    if (req.files && Array.isArray(req.files)) {
      const files = req.files.map(file => {
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        
        return {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: fileUrl
        };
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          files
        }
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: 'Unexpected file upload configuration'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Serve static files
export const serveFile = (req: Request, res: Response): void => {
  const { folder, filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads', folder, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({
      status: 'fail',
      message: 'File not found'
    });
  }
};