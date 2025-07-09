import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  coverLetter: string;
  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'accepted' | 'rejected' | 'withdrawn';
  appliedDate: Date;
  lastUpdated: Date;
  priority: 'low' | 'medium' | 'high';
  matchScore: number;
  notes?: string;
}

const applicationSchema = new Schema<IApplication>({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required']
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant ID is required']
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: [true, 'Resume ID is required']
  },
  coverLetter: {
    type: String,
    required: [true, 'Cover letter is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
applicationSchema.index({ jobId: 1, applicantId: 1 });
applicationSchema.index({ applicantId: 1, appliedDate: -1 });
applicationSchema.index({ jobId: 1, status: 1 });

export default mongoose.model<IApplication>('Application', applicationSchema);