const mongoose = require('mongoose');

const singleOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    //required: true
  }
});

const orderSchema = new mongoose.Schema({
  shippingInfo: {
    userName: {
      type: String,
      //required: true
    },
    userLastName: {
      type: String,
      //required: true
    },
  
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    phoneNo: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['hazırlanıyor', 'kargolandı', 'teslim edildi'],
    default: 'hazırlanıyor'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [singleOrderItemSchema],
  paymentMethod: {
    type: String,
    required: [true, 'Lütfen ödeme türünü seçin.'],
    enum: {
      values: ['COD', 'Card'],
      message: 'Lütfen ödeme türünü seçin.'
    }
  },
  paymentInfo: {
    id: { // Iyzico ödeme ID'si
      type: String
    },
    status: {
    type: String,
    default: function() {
      if (this.paymentMethod === 'COD') {
        return 'Ödeme Bekliyor';
      } else if (this.paymentMethod === 'Card') {
        return 'Ödeme Alındı';
      }
    }
  },
    paymentId: { // Iyzico tarafından sağlanan ödeme ID'si
      type: String
    },
    fraudStatus: { // Sahtecilik kontrolü durumu
      type: String
    },
    paymentType: { // Ödeme türü (örneğin "Credit Card")
      type: String
    }
  },
  itemsAmount: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
  },
  shippingAmount: {
    type: Number,
  },
  totalAmount: {
    type: Number,
    required: true
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
