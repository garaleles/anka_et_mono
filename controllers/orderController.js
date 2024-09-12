const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { checkPermissions } = require('../utils');
const { v4: uuidv4 } = require('uuid');
const Iyzipay = require('iyzipay');
const getIyzipayInstance = require('../utils/iyzipayService');
const Notification = require('../models/Notification');
const User = require('../models/User'); 

const getAllOrders = async (req, res) => { 
  const orders = await Order.find().populate('user', 'name');
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
}


const getSingleOrder = async (req, res) => { 
  const { id: orderId } = req.params;

  // Sipariş ile birlikte kullanıcı bilgilerini getirin
  const order = await Order.findOne({ _id: orderId }).populate('user', 'name email');
  
  if (!order) {
    throw new CustomError.NotFoundError(`Bu id'ye sahip bir sipariş bulunamadı: ${orderId}`);
  }

  checkPermissions(req.user, order.user._id);

  res.status(StatusCodes.OK).json({ order });
}


const getCurrentUserOrders = async (req, res) => { 
  const orders = await Order.find({ user: req.user.userId });
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
}

const createOrder = async (req, res) => {
  const { orderItems: cartItems, taxAmount, shippingAmount, paymentInfo, paymentMethod, shippingInfo } = req.body;

  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError('Sepetenizde ürün bulunmamaktadır');
  }

  // Sipariş öğelerini hesapla
  let orderItems = [];
  let itemsAmount = 0;

  for (const item of cartItems) {
    const dbProduct = await Product.findOne({ _id: item.id });
    if (!dbProduct) {
      throw new CustomError.NotFoundError(`Ürün bulunamadı: ${item.id}`);
    }
    const { name, price, image, _id } = dbProduct;
    const singleOrderItem = {
      quantity: item.quantity,
      name,
      price,
      image: item.image || image,
      product: _id
    };
    orderItems.push(singleOrderItem);
    itemsAmount += item.quantity * price;
  }

  const totalAmount = taxAmount + shippingAmount + itemsAmount;

  if (paymentMethod === 'COD') {
    // COD (Kapıda Ödeme) için İyzico'yu atla ve siparişi doğrudan oluştur
    const createdOrder = await Order.create({
      orderItems,
      totalAmount,
      itemsAmount,
      taxAmount,
      shippingAmount,
      shippingInfo,
      paymentInfo: 'Banka transferi',
      paymentMethod,
      user: req.user.userId
    });

// Bildirim oluşturma
const notification = await Notification.create({
  user: req.user.userId,
  message: `Yeni bir sipariş oluşturuldu. Sipariş ID: ${createdOrder._id}`,
});

// Socket.IO ile gerçek zamanlı bildirim gönderme
const io = req.app.get('io');
if (io) {
  const userSockets = req.app.get('userSockets');

  try {
    // Tüm admin kullanıcılarını bul
    const adminUsers = await User.find({ role: 'admin' });

    // Her admin kullanıcısına bildirim gönder
    adminUsers.forEach(admin => {
      const adminSocketId = userSockets.get(admin._id.toString());
      if (adminSocketId) {
        io.to(adminSocketId).emit('newNotification', notification);
      } else {
        console.log(`Admin kullanıcısı ${admin._id} için socket ID bulunamadı`);
      }
    });
  } catch (error) {
    console.error('Admin kullanıcıları bulunurken hata oluştu:', error);
  }
} else {
  console.log('Socket.IO nesnesi bulunamadı');
}
    return res.status(StatusCodes.CREATED).json({ order: createdOrder });
  } 
  
  // Iyzico ödeme bilgilerini al
  

  const { userName,userLastName, address, city, state, country, phoneNo } = req.body.shippingInfo;

  if (!address || !city || !state || !country || !phoneNo || !userName || !userLastName) {
    throw new CustomError.BadRequestError('Lütfen teslimat bilgilerinizi giriniz');
  }

  
  
  const randomId = uuidv4();
  const avgPrice = itemsAmount / cartItems.length;

  // İyzico ödeme isteği
  const paymentRequest = {
   locale: Iyzipay.LOCALE.TR,
  conversationId: String(new Date().getTime()),
  price: itemsAmount.toFixed(2),  // Sadece ürünlerin toplam fiyatı
  paidPrice: totalAmount.toFixed(2),  // Kullanıcıdan tahsil edilecek toplam ücret
  currency: Iyzipay.CURRENCY.TRY,
  installment: '1',
  basketId: randomId,
  paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
  paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
  paymentCard: {
    cardHolderName: paymentInfo.cardHolderName,
    cardNumber: paymentInfo.cardNumber,
    expireMonth: paymentInfo.expireMonth,
    expireYear: paymentInfo.expireYear,
    cvc: paymentInfo.cvc,
    registerCard: '0'
  },
    buyer: {
    id: req.body.user._id, 
    name: shippingInfo.userName,
    surname: shippingInfo.userLastName,
    gsmNumber: phoneNo,
    email: req.body.user.email,
    identityNumber: '11111111111',
    registrationAddress: address, 
    ip: req.ip,
    city: city,
    country: country,
    zipCode: '34732' 
},
shippingAddress: {
    contactName: `${shippingInfo.userName} ${shippingInfo.userLastName}`, 
    city: city,
    country: country,
    address: address,
    zipCode: '34732' 
},
billingAddress: {
    contactName: req.body.user.name, 
    city: city,
    country: country,
    address: address,
    zipCode: '34732' 
},
    basketItems: orderItems.map(item => ({
    id: item.product.toString(),
    name: item.name,
    category1: 'General', 
    itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
    price: (item.price * item.quantity).toFixed(2) // Her bir ürünün toplam fiyatı
  }))
  };

  const iyzipay = await getIyzipayInstance();
iyzipay.payment.create(paymentRequest, async (err, paymentResult) => {
  try {
    if (err) {
      // İyzipay'dan dönen hata
      throw new CustomError.BadRequestError(`Ödeme hatası: ${err.errorMessage || 'Bilinmeyen hata'}`);
    }

    if (paymentResult.status !== 'success') {
      // İyzipay ödeme işlemi başarısız
      throw new CustomError.BadRequestError(`Ödeme başarısız: ${paymentResult.errorMessage || 'Bilinmeyen hata'}`);
    }

    // Siparişi oluştur
    const createdOrder = await Order.create({
      orderItems,
      totalAmount,
      itemsAmount,
      taxAmount,
      shippingAmount,
      shippingInfo,
      paymentInfo: paymentResult.paymentId,  // Ödeme kimliği
      paymentMethod,
      user: req.user.userId
    });
// Bildirim oluşturma
const notification = await Notification.create({
  user: req.user.userId,
  message: `Yeni bir sipariş oluşturuldu. Sipariş ID: ${createdOrder._id}`,
});

// Socket.IO ile gerçek zamanlı bildirim gönderme
const io = req.app.get('io');
if (io) {
  const userSockets = req.app.get('userSockets');

  try {
    // Tüm admin kullanıcılarını bul
    const adminUsers = await User.find({ role: 'admin' });

    // Her admin kullanıcısına bildirim gönder
    adminUsers.forEach(admin => {
      const adminSocketId = userSockets.get(admin._id.toString());
      if (adminSocketId) {
        io.to(adminSocketId).emit('newNotification', notification);
      } else {
        console.log(`Admin kullanıcısı ${admin._id} için socket ID bulunamadı`);
      }
    });
  } catch (error) {
    console.error('Admin kullanıcıları bulunurken hata oluştu:', error);
  }
} else {
  console.log('Socket.IO nesnesi bulunamadı');
}
    // Başarılı yanıt
    res.status(StatusCodes.CREATED).json({ order: createdOrder, paymentResult });
  } catch (error) {
    // Hata durumunda uygun bir yanıt döndür
    res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
});

};




const updateOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new CustomError.NotFoundError(`Sipariş bulunamadı: ${req.params.id}`);
  }

  if (order?.orderStatus === "teslim edildi") {

      throw new CustomError.BadRequestError('Sipariş zaten teslim edildi');
    }

     order.orderItems.forEach(async (item) => {
     const dbProduct = await Product.findById({ _id: item.product });

     if (!dbProduct) {
     throw new CustomError.NotFoundError(`Ürün bulunamadı: ${item.product}`);
    }

    if (dbProduct.stock < item.quantity) {
     throw new CustomError.BadRequestError('Ürün stokta yok');
     }

    dbProduct.stock = dbProduct.stock - item.quantity;
      await dbProduct.save({
      validateBeforeSave: false,});
      });

    

    order.status = req.body.status;
    order.deliveredAt = Date.now();
    await order.save();
    res.status(StatusCodes.OK).json({ order });

  }
  


const deleteOrder = async (req, res) => { 
  const { id: orderId } = req.params;
  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new CustomError.NotFoundError(`Bu id'ye sahip bir sipariş bulunamadı: ${orderId}`);
  }
  checkPermissions(req.user, order.user);
  await order.deleteOne();
  res.status(StatusCodes.OK).json({ msg: 'Sipariş silindi.' });
}

async function getSalesData(startDate, endDate) {
  const salesData = await Order.aggregate([
    {
      // Stage 1 - Filter results
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      // Stage 2 - Group Data
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        },
        totalSales: { $sum: "$totalAmount" },
        numOrders: { $sum: 1 }, // count the number of orders
      },
    },
  ]);

  // Create a Map to store sales data and num of order by data
  const salesMap = new Map();
  let totalSales = 0;
  let totalNumOrders = 0;

  salesData.forEach((entry) => {
    const date = entry?._id.date;
    const sales = entry?.totalSales;
    const numOrders = entry?.numOrders;

    salesMap.set(date, { sales, numOrders });
    totalSales += sales;
    totalNumOrders += numOrders;
  });

  // Generate an array of dates between start & end Date
  const datesBetween = getDatesBetween(startDate, endDate);

  // Create final sales data array with 0 for dates without sales
  const finalSalesData = datesBetween.map((date) => ({
    date,
    sales: (salesMap.get(date) || { sales: 0 }).sales,
    numOrders: (salesMap.get(date) || { numOrders: 0 }).numOrders,
  }));

  return { salesData: finalSalesData, totalSales, totalNumOrders };
}

function getDatesBetween(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    const formattedDate = currentDate.toISOString().split("T")[0];
    dates.push(formattedDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}


const getSales = async (req, res) => {
    const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const { salesData, totalSales, totalNumOrders } = await getSalesData(
    startDate,
    endDate
  );

  res.status(200).json({
    totalSales,
    totalNumOrders,
    sales: salesData,
  });
};

   


module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getSales
}

