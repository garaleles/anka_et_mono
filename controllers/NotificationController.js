const Notification = require('../models/Notification');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.userId }).sort({ createdAt: -1 }).limit(10);
    res.status(StatusCodes.OK).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Bildirimler alınırken bir hata oluştu' });
  }
};

const createNotification = async (req, res) => {
  const { message } = req.body;
  if (!message) {
    throw new CustomError.BadRequestError('Bildirim mesajı gereklidir');
  }
  
  const notification = await Notification.create({
    user: req.user.userId,
    message,
    isRead: false
  });
  
  // Socket.IO ile bildirimi gönder
  req.app.get('io').to(req.user.userId).emit('newNotification', notification);
  
  res.status(StatusCodes.CREATED).json({ notification });
};

const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: req.user.userId },
    { isRead: true },
    { new: true }
  );
  
  if (!notification) {
    throw new CustomError.NotFoundError(`Bildirim bulunamadı: ${id}`);
  }
  
  // Socket.IO ile bildirimin okunduğunu gönder
  req.app.get('io').to(req.user.userId).emit('notificationMarkedAsRead', id);
  
  res.status(StatusCodes.OK).json({ notification });
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;
  
  try {
    const notification = await Notification.findOneAndDelete({ _id: id, user: req.user.userId });
    
    if (!notification) {
      throw new CustomError.NotFoundError(`Bildirim bulunamadı: ${id}`);
    }
    
    res.status(200).json({ message: 'Bildirim başarıyla silindi' });
  } catch (error) {
    console.error('Bildirim silme hatası:', error);
    throw new CustomError.InternalServerError('Bildirim silinirken bir hata oluştu');
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  deleteNotification
};