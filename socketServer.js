const Message = require('./models/Message');
const User = require('./models/User');

module.exports = (io) => {
  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı');

    socket.on('authenticate', (userId) => {
      userSockets.set(userId, socket.id);
      console.log(`Kullanıcı ${userId} kimlik doğrulaması yaptı`);
    });

 socket.on('sendMessage', async (data) => {
  console.log('Mesaj alındı:', data);
  try {
    const { senderId, receiverId, content } = data;
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content
    });
    await newMessage.save();
    console.log('Mesaj kaydedildi:', newMessage);

    // Yeni chat bildirimi oluştur
    const newChatNotification = new ChatNotification({
      sender: senderId,
      receiver: receiverId,
      message: `Yeni bir mesajınız var: ${content.substring(0, 20)}...`
    });
    await newChatNotification.save();

    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      console.log('Alıcıya mesaj ve bildirim gönderiliyor');
      io.to(receiverSocketId).emit('newMessage', newMessage);
      io.to(receiverSocketId).emit('newChatNotification', newChatNotification);
    }

    console.log('Gönderene mesaj onayı gönderiliyor');
    socket.emit('messageSent', newMessage);
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
  }
});

    socket.on('getMessages', async (data) => {
      try {
        const { userId, otherUserId } = data;
        const messages = await Message.find({
          $or: [
            { sender: userId, receiver: otherUserId },
            { sender: otherUserId, receiver: userId }
          ]
        }).sort({ timestamp: 1 });
        socket.emit('loadMessages', messages);
        console.log('Mesajlar yüklendi:', messages);
      } catch (error) {
        console.error('Mesajları yükleme hatası:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Bir kullanıcı bağlantıyı kesti');
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
    });
  });
};