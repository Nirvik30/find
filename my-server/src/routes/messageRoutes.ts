import express from 'express';
import { 
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  toggleStar,
  archiveConversation,
  deleteConversation,
  createConversation,
  getChatPartners // Add this import
} from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get all conversations
router.get('/conversations', getConversations);

// Get chat partners
router.get('/chat-partners', getChatPartners); // Add this route

// Get messages for a conversation
router.get('/:conversationId', getMessages);

// Send a message
router.post('/:conversationId', sendMessage);

// Mark a message as read
router.post('/:conversationId/read', markAsRead);

// Toggle star status for a message
router.post('/:conversationId/:messageId/star', toggleStar);

// Archive a conversation
router.post('/:conversationId/archive', archiveConversation);

// Delete a conversation
router.delete('/:conversationId', deleteConversation);

// Create a new conversation
router.post('/', createConversation);

export default router;