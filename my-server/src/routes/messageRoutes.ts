import express from 'express';
import {
  getChatPartners,
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markAsRead,
  toggleStar,
  archiveConversation,
  deleteConversation
} from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware'; // Change this line

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect); // Change this line

// Chat partners route
router.get('/chat-partners', getChatPartners);

// Conversation routes
router.get('/conversations', getConversations);
router.post('/', createConversation);

// Message routes
router.get('/:conversationId', getMessages);
router.post('/:conversationId', sendMessage);

// Mark a message as read
router.post('/:conversationId/read', markAsRead);

// Toggle star status for a message
router.post('/:conversationId/:messageId/star', toggleStar);

// Archive a conversation
router.post('/:conversationId/archive', archiveConversation);

// Delete a conversation
router.delete('/:conversationId', deleteConversation);

export default router;