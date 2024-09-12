const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authentication');
const {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  deleteNotification
} = require('../controllers/NotificationController');

router.use(authenticateUser);

router.route('/').get(getNotifications).post(createNotification);
router.route('/:id').patch(markNotificationAsRead).delete(deleteNotification);

module.exports = router;