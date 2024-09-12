const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authentication');
const {
  getChatNotifications,
  markChatNotificationAsRead,
  deleteChatNotification
} = require('../controllers/chatNotificationController');

router.get('/', authenticateUser, getChatNotifications);
router.patch('/:id', authenticateUser, markChatNotificationAsRead);
router.delete('/:id', authenticateUser, deleteChatNotification);

module.exports = router;