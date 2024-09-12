const express = require('express');
const router = express.Router();
const { authenticateUser, authorizePermissions } = require('../middleware/authentication.js');

const {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getProductReviews
} = require('../controllers/reviewController');


router.route('/')
  .get(getAllReviews)
  .post(authenticateUser, createReview);


router.route('/:id')
  .get(getSingleReview)
  .patch(authenticateUser, updateReview)
  .delete(authenticateUser,authorizePermissions('admin'), deleteReview)


router.route('/product/:id')
  .get(authenticateUser,authorizePermissions('admin'),getProductReviews)



module.exports = router;


