import express from 'express';
import * as messageController from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All message routes require authentication
router.use(protect);

// Conversations
router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.createConversation);
router.patch('/conversations/:conversationId/archive', messageController.updateConversationArchiveStatus);

// Messages
router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.patch('/messages/:messageId/star', messageController.updateMessageStarStatus);

export default router;