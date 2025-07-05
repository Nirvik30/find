import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  company: string;
  companyId: mongoose.Schema.Types.ObjectId;
  recruiterId: mongoose.Schema.Types.ObjectId;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  experience: string;
  salary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  postedDate: Date;
  updatedDate: Date;
  applicationDeadline?: Date;
  status: 'active' | 'draft' | 'closed' | 'filled';
  isUrgent: boolean;
  applications: number;
  views: number;
}

const jobSchema = new Schema<IJob>({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Remote'],
    required: [true, 'Please specify the job type']
  },
  experience: {
    type: String,
    required: [true, 'Please specify required experience']
  },
  salary: {
    type: String,
    required: [true, 'Please add salary information']
  },
  description: {
    type: String,
    required: [true, 'Please add a job description']
  },
  responsibilities: {
    type: [String],
    required: [true, 'Please add job responsibilities']
  },
  requirements: {
    type: [String],
    required: [true, 'Please add job requirements']
  },
  benefits: {
    type: [String]
  },
  skills: {
    type: [String],
    required: [true, 'Please add required skills']
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  updatedDate: {
    type: Date,
    default: Date.now
  },
  applicationDeadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'closed', 'filled'],
    default: 'draft'
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  applications: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to calculate time since posted
jobSchema.virtual('timePosted').get(function(this: IJob) {
  const now = new Date();
  const postedDate = new Date(this.postedDate);
  const diffInDays = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return diffInDays;
});

export default mongoose.model<IJob>('Job', jobSchema);