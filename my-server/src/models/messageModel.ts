import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface IMessage extends Document {
  conversationId: mongoose.Schema.Types.ObjectId;
  senderId: mongoose.Schema.Types.ObjectId;
  content: string;
  subject?: string;
  timestamp: Date;
  read: Record<string, boolean>; // Maps userId to read status
  starred: boolean;
  attachments?: IAttachment[];
  messageType: 'interview' | 'application_update' | 'general' | 'offer' | 'rejection' | 'system';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  subject: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  starred: {
    type: Boolean,
    default: false
  },
  attachments: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    size: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  messageType: {
    type: String,
    enum: ['interview', 'application_update', 'general', 'offer', 'rejection', 'system'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1 });
messageSchema.index({ senderId: 1 });

export default mongoose.model<IMessage>('Message', messageSchema);