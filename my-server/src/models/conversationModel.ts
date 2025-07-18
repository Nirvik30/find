import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: {
    userId: mongoose.Types.ObjectId;
    role: string;
    isTyping: boolean;
    lastSeen: Date;
  }[];
  jobId?: mongoose.Types.ObjectId;
  jobTitle?: string;
  lastMessage?: {
    id: mongoose.Types.ObjectId;
    senderId: string;
    content: string;
    timestamp: Date;
  };
  unreadCount: Record<string, number>; // Changed from number to Record
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true
    },
    isTyping: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job'
  },
  jobTitle: String,
  lastMessage: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    senderId: String,
    content: String,
    timestamp: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ jobId: 1 });

export default mongoose.model<IConversation>('Conversation', conversationSchema);