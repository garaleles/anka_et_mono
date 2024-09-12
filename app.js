const express = require('express');
const app = express();
const http = require('http').createServer(app);
    const io = require('socket.io')(http, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://anka-et-mono.onrender.com",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
    });

const Notification = require('./models/Notification');
const ChatNotification = require('./models/ChatNotification');
const Message = require('./models/Message');
const connectDb = require('./configs/dbConnect.js');
const dotenv = require('dotenv');
require('express-async-errors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://anka-et-mono.onrender.com",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));


dotenv.config()
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const port = process.env.PORT || 4000;



// Routes
const authRouter = require('./routes/authRoutes.js');
const userRouter = require('./routes/userRoutes.js');
const categoryRouter = require('./routes/categoryRoutes.js');
const brandRouter = require('./routes/brandRoutes.js');
const productRouter = require('./routes/productRoutes.js');
const reviewRouter = require('./routes/reviewRoutes.js');
const orderRouter = require('./routes/orderRoutes.js');
const iyzipayInfoRouter = require('./routes/iyzipayInfoRoutes.js');
const companyInfoRouter = require('./routes/companyInfoRoutes.js');
const notificationRouter = require('./routes/NotificationRoutes.js');
const chatNotificationRouter = require('./routes/chatNotificationRoutes.js');
const emailConfigRouter = require('./routes/emailConfigRoutes.js');
// Middleware
const notFoundMiddleware = require('./middleware/not-found.js');
const errorHandlerMiddleware = require('./middleware/error-handler.js');

// Genel güvenlik önlemleri
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://kit.fontawesome.com", "https://ka-f.fontawesome.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://db.onlinewebfonts.com", "https://ka-f.fontawesome.com"],
    imgSrc: ["'self'", "data:", "http://me.kis.v2.scr.kaspersky-labs.com", "ws://me.kis.v2.scr.kaspersky-labs.com", "https://res.cloudinary.com"],
    connectSrc: ["'self'", "https://res.cloudinary.com", "https://ka-f.fontawesome.com"],
    fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://db.onlinewebfonts.com", "https://ka-f.fontawesome.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'"]
  }
}));
app.set('trust proxy', 1);



app.use(cors(corsOptions));






app.use(xss());
app.use(mongoSanitize());



// Diğer middleware'ler
app.use(morgan('tiny'));
app.use(express.json({limit:'10mb'}));
app.use(cookieParser(process.env.JWT_SECRET));



app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
}));




// Route'ları tanımla
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/brands', brandRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/iyzipay-info', iyzipayInfoRouter);
app.use('/api/v1/company-info', companyInfoRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/chat-notifications', chatNotificationRouter);
app.use('/api/v1/email-config', emailConfigRouter);

// Statik dosyaları sunmak için
app.use(express.static(path.join(__dirname, './frontend/build')));
/// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/build', 'index.html'));
});

// Hata yakalama middleware'leri
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

app.set('io', io);

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('Yeni bir kullanıcı bağlandı');

  socket.on('authenticate', async (userId) => {
    userSockets.set(userId, socket.id);
    socket.join(userId);
    console.log(`Kullanıcı ${userId} kimlik doğrulaması yapıldı ve odaya katıldı`);

    const notifications = await Notification.find({ user: userId, isRead: false })
      .sort({ createdAt: -1 })
      .limit(10);
    socket.emit('unreadNotifications', notifications);
  });

  socket.on('markAsRead', async (data) => {
    const { userId, notificationId } = data;
    await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true }
    );
    io.to(userId).emit('notificationMarkedAsRead', notificationId);
  });

  socket.on('deleteNotification', async (data) => {
    const { userId, notificationId } = data;
    try {
      await Notification.findOneAndDelete({ _id: notificationId, user: userId });
      io.to(userId).emit('notificationDeleted', notificationId);
    } catch (error) {
      console.error('Bildirim silme hatası:', error);
    }
  });

  socket.on('sendMessage', async (data, callback) => {
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

      callback({ success: true, message: newMessage });

      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        console.log('Alıcıya mesaj gönderiliyor');
        io.to(receiverSocketId).emit('newMessage', newMessage);
      }

      const newChatNotification = new ChatNotification({
        sender: senderId,
        receiver: receiverId,
        message: `Yeni bir mesajınız var: ${content.substring(0, 20)}...`
      });
      await newChatNotification.save();
      console.log('Chat bildirimi kaydedildi:', newChatNotification);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newChatNotification', newChatNotification);
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      callback({ success: false, error: error.message });
    }
  });
  
  socket.on('getMessages', async (data) => {
    try {
      const { userId, otherUserId } = data;
      console.log('Mesajlar istendi:', userId, otherUserId);
      const messages = await Message.find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId }
        ]
      }).sort({ timestamp: 1 });
      console.log('Bulunan mesajlar:', messages);
      socket.emit('loadMessages', messages);
    } catch (error) {
      console.error('Mesajları yükleme hatası:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı');
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});


app.set('userSockets', userSockets);


io.on('connection', (socket) => {
  socket.on('authenticate', (userId) => {
    userSockets.set(userId, socket.id);
    // ... diğer socket işlemleri ...
  });

  // ... diğer socket event'leri ...
});
const start = async () => { 
  try {
    await connectDb(process.env.MONGO_URI);
    console.log('MongoDB başarıyla bağlandı');
    http.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();