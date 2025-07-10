import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  resumeId?: mongoose.Types.ObjectId;
  coverLetter: string;
  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'accepted' | 'rejected' | 'withdrawn';
  appliedDate: Date;
  lastUpdated: Date;
  documents?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  notes?: string;
  priority?: 'low' | 'normal' | 'high';
  matchScore?: number;
}

const applicationSchema = new Schema<IApplication>({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeId: {
    type: Schema.Types.ObjectId,
    ref: 'Resume',
    required: false
  },
  coverLetter: {
    type: String,
    default: ''
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
  documents: [{
    name: String,
    url: String,
    size: Number
  }],
  notes: String,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  matchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Index for faster queries
applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
applicationSchema.index({ applicantId: 1 });
applicationSchema.index({ jobId: 1 });

export default mongoose.model<IApplication>('Application', applicationSchema);