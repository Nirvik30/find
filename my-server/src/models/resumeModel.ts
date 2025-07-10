import mongoose, { Document, Schema } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'created' | 'uploaded';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  personalInfo?: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    title?: string;
    summary?: string;
  };
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }>;
  skills?: Array<{
    category: string;
    items: string[];
  }>;
  template?: string;
  isDefault: boolean;
  status: 'draft' | 'published' | 'archived';
  downloadCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['created', 'uploaded'],
    default: 'created'
  },
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  personalInfo: {
    name: String,
    email: String,
    phone: String,
    location: String,
    title: String,
    summary: String
  },
  experience: [{
    company: String,
    position: String,
    startDate: String,
    endDate: String,
    current: { type: Boolean, default: false },
    description: String
  }],
  education: [{
    institution: String,
    degree: String,
    field: String,
    startDate: String,
    endDate: String
  }],
  skills: [{
    category: String,
    items: [String]
  }],
  template: {
    type: String,
    default: 'modern'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure only one default resume per user
resumeSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('Resume').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export default mongoose.model<IResume>('Resume', resumeSchema);