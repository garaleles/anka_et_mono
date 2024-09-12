const ChatNotification = require('../models/ChatNotification');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const getChatNotifications = async (req, res) => {
  try {
    const notifications = await ChatNotification.find({ receiver: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('sender', 'name');
    res.status(StatusCodes.OK).json({ notifications });
  } catch (error) {
    console.error('Error fetching chat notifications:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Chat bildirimleri alınırken bir hata oluştu' });
  }
};

const markChatNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await ChatNotification.findOneAndUpdate(
      { _id: id, receiver: req.user.userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      throw new CustomError.NotFoundError(`Chat bildirimi bulunamadı: ${id}`);
    }
    res.status(StatusCodes.OK).json({ notification });
  } catch (error) {
    console.error('Chat bildirimi güncelleme hatası:', error);
    throw new CustomError.InternalServerError('Chat bildirimi güncellenirken bir hata oluştu');
  }
};

const deleteChatNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await ChatNotification.findOneAndDelete({ _id: id, receiver: req.user.userId });
    if (!notification) {
      throw new CustomError.NotFoundError(`Chat bildirimi bulunamadı: ${id}`);
    }
    res.status(StatusCodes.OK).json({ message: 'Chat bildirimi başarıyla silindi' });
  } catch (error) {
    console.error('Chat bildirimi silme hatası:', error);
    throw new CustomError.InternalServerError('Chat bildirimi silinirken bir hata oluştu');
  }
};

module.exports = {
  getChatNotifications,
  markChatNotificationAsRead,
  deleteChatNotification
};