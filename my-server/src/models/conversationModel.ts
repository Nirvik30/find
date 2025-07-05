import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
  userId: mongoose.Schema.Types.ObjectId;
  role: 'applicant' | 'recruiter' | 'hr' | 'hiring_manager' | 'admin';
  lastSeen?: Date;
  isTyping?: boolean;
}

export interface IConversation extends Document {
  participants: IParticipant[];
  jobId?: mongoose.Schema.Types.ObjectId;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
  unreadCount: Record<string, number>; // Maps userId to number of unread messages
}

const conversationSchema = new Schema<IConversation>({
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['applicant', 'recruiter', 'hr', 'hiring_manager', 'admin'],
      required: true
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    isTyping: {
      type: Boolean,
      default: false
    }
  }],
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  archived: {
    type: Boolean,
    default: false
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Index for faster queries
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ jobId: 1 });

export default mongoose.model<IConversation>('Conversation', conversationSchema);