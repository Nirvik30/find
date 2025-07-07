import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  company: string;
  companyId: mongoose.Schema.Types.ObjectId;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Freelance' | 'Internship';
  experience: string;
  salary: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  applicationDeadline: Date;
  isUrgent: boolean;
  status: 'draft' | 'active' | 'closed' | 'filled';
  recruiterId: mongoose.Schema.Types.ObjectId;
  postedDate: Date;
  updatedDate: Date;
  views: number;
  applications: number;
}

const jobSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Job title is required']
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  company: {
    type: String,
    required: [true, 'Company name is required']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Freelance', 'Internship'],
    required: [true, 'Job type is required']
  },
  experience: {
    type: String,
    required: [true, 'Experience level is required']
  },
  salary: {
    type: String,
    required: false
  },
  responsibilities: [{
    type: String
  }],
  requirements: [{
    type: String
  }],
  benefits: [{
    type: String
  }],
  skills: [{
    type: String
  }],
  applicationDeadline: {
    type: Date,
    required: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'filled'],
    default: 'draft'
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  updatedDate: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
jobSchema.index({
  title: 'text',
  description: 'text',
  company: 'text',
  location: 'text',
  skills: 'text'
});

export default mongoose.model<IJob>('Job', jobSchema);