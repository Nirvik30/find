import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  template: string;
  isDefault: boolean;
  status: 'draft' | 'published' | 'archived';
  downloadCount: number;
  viewCount: number;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    title: string;
    summary: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
  experience: {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    achievements: string[];
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  projects: {
    id: string;
    name: string;
    description: string;
    url?: string;
    technologies: string[];
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }[];
}

const resumeSchema = new Schema<IResume>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a resume name'],
    trim: true
  },
  template: {
    type: String,
    required: [true, 'Please select a template'],
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
  },
  personalInfo: {
    name: {
      type: String,
      required: [true, 'Please provide your name']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email']
    },
    phone: String,
    location: String,
    title: String,
    summary: String,
    website: String,
    linkedin: String,
    github: String
  },
  experience: [
    {
      id: {
        type: String,
        required: true
      },
      company: {
        type: String,
        required: [true, 'Please provide company name']
      },
      position: {
        type: String,
        required: [true, 'Please provide position']
      },
      startDate: {
        type: String,
        required: [true, 'Please provide start date']
      },
      endDate: String,
      current: {
        type: Boolean,
        default: false
      },
      description: String,
      achievements: [String]
    }
  ],
  education: [
    {
      id: {
        type: String,
        required: true
      },
      institution: {
        type: String,
        required: [true, 'Please provide institution name']
      },
      degree: {
        type: String,
        required: [true, 'Please provide degree']
      },
      field: {
        type: String,
        required: [true, 'Please provide field of study']
      },
      startDate: {
        type: String,
        required: [true, 'Please provide start date']
      },
      endDate: {
        type: String,
        required: [true, 'Please provide end date']
      },
      gpa: String
    }
  ],
  skills: [
    {
      category: {
        type: String,
        required: [true, 'Please provide skill category']
      },
      items: {
        type: [String],
        required: [true, 'Please provide skills']
      }
    }
  ],
  projects: [
    {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: [true, 'Please provide project name']
      },
      description: {
        type: String,
        required: [true, 'Please provide project description']
      },
      url: String,
      technologies: [String]
    }
  ],
  certifications: [
    {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: [true, 'Please provide certification name']
      },
      issuer: {
        type: String,
        required: [true, 'Please provide certification issuer']
      },
      date: {
        type: String,
        required: [true, 'Please provide date received']
      },
      url: String
    }
  ]
}, {
  timestamps: true
});

export default mongoose.model<IResume>('Resume', resumeSchema);