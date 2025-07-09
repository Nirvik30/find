import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  industry: string;
  website?: string;
  location: string;
  size: string;
  about: string;
  founded: string;
  logo?: string;
  coverImage?: string; // Add this line
  employees?: string;
  benefits?: string[];
  culture?: string[];
}

const companySchema = new Schema<ICompany>({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  website: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  size: {
    type: String,
    required: [true, 'Company size is required'],
    enum: ['1-10', '11-50', '51-200', '201-1000', '1000+']
  },
  about: {
    type: String,
    required: [true, 'Company description is required']
  },
  founded: {
    type: String,
    required: [true, 'Founded year is required']
  },
  logo: {
    type: String,
    default: ''
  },
  coverImage: { // Add this field
    type: String,
    default: ''
  },
  employees: String,
  benefits: [String],
  culture: [String]
}, {
  timestamps: true
});

export default mongoose.model<ICompany>('Company', companySchema);