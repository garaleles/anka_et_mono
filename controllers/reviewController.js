const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Review = require('../models/Review.js');
const Product = require('../models/Product.js');
const { checkPermissions } = require('../utils');


const createReview = async (req, res) => { 
  console.log(req.body);

  const { product: productId } = req.body;

  const isValidProduct = await Product.findOne({ _id: productId });

  if (!isValidProduct) {
    throw new CustomError.NotFoundError(`Aradığınız  ${productId} id'li ürün bulunamadı.`);
  }



  const alreadySubmitted = await Review.findOne({
    product: productId,
    user: req.user.userId
  });


  if (alreadySubmitted) {
    throw new CustomError.BadRequestError('Bu ürüne daha önce yorum yaptınız.');
  }


  req.body.user = req.user.userId;



  const review = await Review.create(req.body);
  if (!review) {
    throw new CustomError.BadRequestError('Yorum eklenemedi. Gerekli alanları doldurunuz.');
  }


  res.status(StatusCodes.CREATED).json({ review });
}

const getAllReviews = async (req, res) => { 
  const reviews = await Review.find({})
    .populate({
    path: 'product',
    select: 'name brand price'
    
  }).populate({
    path: 'user',
    select: 'name'
  });

  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
}

const getSingleReview = async (req, res) => { 
  const { id: reviewId } = req.params;

  const review = await Review.findOne({ _id: reviewId }).populate({
    path: 'product',
    select: 'name brand price'
  }).populate({
    path: 'user',
    select: 'name'
  });
  if (!review) {
    throw new CustomError.NotFoundError(`Aradığınız  ${reviewId} id'li ürün bulunamadı.`);
  }
  res.status(StatusCodes.OK).json({ review });


}

const updateReview = async (req, res) => {
 const { id: reviewId } = req.params;
  const { rating, title, comment} = req.body;
  

  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new CustomError.NotFoundError(`Aradığınız  ${reviewId} id'li yorum bulunamadı.`);
  }

  checkPermissions(req.user, review.user);
  review.rating = rating;
  review.title = title;
  review.comment = comment;
  await review.save();
  res.status(StatusCodes.OK).json({ review });
}

const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params
  const review = await Review.findById(reviewId)
  if (!review) {
    throw new NotFoundError(`Bu ${reviewId} id'li yorum bulunamadı.`)
  }
  checkPermissions(req.user, review.user)
  await Review.deleteOne({ _id: reviewId })
  await Review.calculateAverageRating(review.product)
  res.status(StatusCodes.OK).json({ msg: 'Yorum başarıyla silindi.' })
}

const getSingleProductReviews = async (req, res) => {
  const { productId } = req.params;
  const review = await Review.find({ product: productId }).populate('user', 'name profilePic');
  if (!review.length) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: `Aradığınız ${productId} id'li ürün bulunamadı.` });
  }
  res.status(StatusCodes.OK).json({ review, count: review.length });
}

const getProductReviews = async (req, res) => {
  const product=await Product.findById(req.params.id)
  if(!product){
    throw new CustomError.NotFoundError(`Aradığınız ${req.params.id} id'li ürün bulunamadı.`)
  }
  const reviews=await Review.find({product:product._id}).populate({
    path:'user',
    select:'name profilePic email'
  })
  res.status(StatusCodes.OK).json({reviews,count:reviews.length})
}



module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
  getProductReviews
}
