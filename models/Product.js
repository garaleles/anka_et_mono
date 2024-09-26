const { required } = require('joi');
const mongoose = require('mongoose');
const Review= require('./Review');



const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lütfen ürün adını girin.'],
    trim: true,
    maxlength: [100, 'Ürün adı en fazla 100 karakter olabilir.']
    
  },
  price: {
    type: Number,
    required: [true, 'Lütfen ürün fiyatını girin.'],
    default: 0,
    min: [0, 'Ürün fiyatı en az 0 olabilir.']
  },
  description: {
    type: String,
    required: [true, 'Lütfen ürün açıklamasını girin.'],
    maxlength: [1000, 'Ürün açıklaması en fazla 1000 karakter olabilir.']
  },
  images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],

  stock: {
    type: Number,
    required: [true, 'Lütfen ürün stoğunu girin.'],
    default: 1,
    min: [1, 'Ürün stoğu en az 1 olabilir.']
  },

  category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, 'Lütfen ürün kategorisini girin.'],
  },
  brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: [true, 'Lütfen ürün markasını girin.'],
      
  },
  colors: {
    type: [String],
    default: ['#e5e5e5da'],
        
  },
  featured: {
    type: Boolean,
    default: false
  },
  freeShipping: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    default: 0
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false
});


productSchema.pre('deleteOne', async function(next) {
  const productId = this.getQuery()['_id'];
  await Review.deleteMany({ product: productId });
  next();
});



module.exports = mongoose.model('Product', productSchema);
