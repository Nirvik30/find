import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  subject: string;
  content: string;
  timestamp: Date;
  read: { [key: string]: boolean };
  starred: boolean;
  attachments?: {
    name: string;
    url: string;
    size: string;
    type: string;
  }[];
  messageType: string;
  priority: string;
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
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    required: true,
    enum: ['applicant', 'recruiter', 'admin', 'system']
  },
  subject: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Map,
    of: Boolean,
    default: () => new Map()
  },
  starred: {
    type: Boolean,
    default: false
  },
  attachments: [{
    name: String,
    url: String,
    size: String,
    type: String
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

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message;