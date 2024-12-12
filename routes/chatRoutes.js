const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/start-conversation', userController.startConversation);
router.post('/send-message', userController.sendMessage);
router.get('/conversations/:userId', userController.getConversations);
router.get('/messages/:conversationId', userController.getMessages);
router.post('/mark-messages-read', userController.markMessagesAsRead);

module.exports = router;

