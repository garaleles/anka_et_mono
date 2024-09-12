const mongoose = require('mongoose')

const IyzipayInfoSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: [true, 'Lütfen bir API key girin.'],
  },
  secretKey: {
    type: String,
    required: [true, 'Lütfen bir secret key girin.'],
  },
  baseUrl: {
    type: String,
    //required: [true, 'Lütfen bir base URL girin.'],
    default: 'https://sandbox-api.iyzipay.com',
  },
   installment: {
    type: Number,
    
  },
});

module.exports = mongoose.model('IyzipayInfo', IyzipayInfoSchema);



