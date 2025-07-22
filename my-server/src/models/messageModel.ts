import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName?: string;
  senderRole?: string;
  content: string;
  subject?: string;
  read: Record<string, boolean>; // Define as object map of userId -> boolean
  starred: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  messageType: string;
  priority: string;
  timestamp: Date;
}

const messageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: String,
  senderRole: String,
  content: {
    type: String,
    required: true
  },
  subject: String,
  read: {
    type: Schema.Types.Mixed, // Use Mixed type for dynamic properties
    default: {}
  },
  starred: {
    type: Boolean,
    default: false
  },
  attachments: [{
    name: String,
    url: String,
    size: Number
  }],
  messageType: {
    type: String,
    enum: ['general', 'interview', 'offer', 'rejection', 'application_update', 'system'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ conversationId: 1 });
messageSchema.index({ senderId: 1 });

export default mongoose.model<IMessage>('Message', messageSchema);