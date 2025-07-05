import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  logo?: string;
  coverImage?: string;
  industry: string;
  website: string;
  location: string;
  size: string;
  founded: string;
  about: string;
  mission: string;
  culture: string[];
  benefits: {
    id: string;
    title: string;
    description: string;
    icon: string;
  }[];
  socialMedia: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    github?: string;
  };
  gallery: {
    id: string;
    url: string;
    caption: string;
  }[];
  team: {
    id: string;
    name: string;
    title: string;
    avatar?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>({
  name: {
    type: String,
    required: [true, 'Please provide company name'],
    unique: true,
    trim: true
  },
  logo: String,
  coverImage: String,
  industry: {
    type: String,
    required: [true, 'Please provide company industry']
  },
  website: {
    type: String,
    required: [true, 'Please provide company website']
  },
  location: {
    type: String,
    required: [true, 'Please provide company location']
  },
  size: {
    type: String,
    required: [true, 'Please provide company size']
  },
  founded: String,
  about: {
    type: String,
    required: [true, 'Please provide company description']
  },
  mission: String,
  culture: [String],
  benefits: [
    {
      id: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      icon: {
        type: String,
        required: true
      }
    }
  ],
  socialMedia: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String,
    github: String
  },
  gallery: [
    {
      id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      caption: String
    }
  ],
  team: [
    {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      avatar: String
    }
  ]
}, {
  timestamps: true
});

export default mongoose.model<ICompany>('Company', companySchema);