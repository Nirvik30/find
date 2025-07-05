import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  jobId: mongoose.Schema.Types.ObjectId;
  applicantId: mongoose.Schema.Types.ObjectId;
  resumeId: mongoose.Schema.Types.ObjectId;
  coverLetter?: string;
  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'accepted' | 'rejected';
  appliedDate: Date;
  lastUpdated: Date;
  nextAction?: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string[];
  matchScore?: number;
  interviews?: {
    id: string;
    type: 'phone' | 'video' | 'in-person';
    date: Date;
    duration: number;
    interviewers: string[];
    status: 'scheduled' | 'completed' | 'canceled' | 'no-show';
    feedback?: string;
    rating?: number;
  }[];
}

const applicationSchema = new Schema<IApplication>({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  coverLetter: String,
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'interview', 'offer', 'accepted', 'rejected'],
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
  nextAction: String,
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  notes: [String],
  matchScore: Number,
  interviews: [
    {
      id: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['phone', 'video', 'in-person'],
        required: true
      },
      date: {
        type: Date,
        required: true
      },
      duration: {
        type: Number,
        required: true
      },
      interviewers: {
        type: [String],
        required: true
      },
      status: {
        type: String,
        enum: ['scheduled', 'completed', 'canceled', 'no-show'],
        default: 'scheduled'
      },
      feedback: String,
      rating: {
        type: Number,
        min: 1,
        max: 5
      }
    }
  ]
}, {
  timestamps: true
});

export default mongoose.model<IApplication>('Application', applicationSchema);