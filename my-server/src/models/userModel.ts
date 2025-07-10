import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'applicant' | 'recruiter' | 'admin';
  companyName?: string;
  companyId?: mongoose.Schema.Types.ObjectId;
  location?: string;
  phone?: string;
  avatar?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  savedJobs?: mongoose.Types.ObjectId[] | mongoose.Schema.Types.ObjectId[]; // Add this line
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Please provide your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['applicant', 'recruiter', 'admin'],
    default: 'applicant',
    required: true
  },
  companyName: {
    type: String,
    required: function(this: IUser) {
      return this.role === 'recruiter';
    }
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  location: String,
  phone: String,
  avatar: String,
  headline: String,
  bio: String,
  skills: [String],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  savedJobs: [{
    type: Schema.Types.ObjectId,
    ref: 'Job'
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);