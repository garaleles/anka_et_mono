const express = require('express');
const router = express.Router();
const { authenticateUser, authorizePermissions } = require('../middleware/authentication.js');
const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  canUserReview,
  getAdminProducts,
  deleteProductImage,
  featuredProducts,
  importProducts,
  exportProducts,
   downloadTemplate,
  importCreateProducts

} = require('../controllers/productController.js');


const { getSingleProductReviews } = require('../controllers/reviewController.js');

// fiyat güncelleme
router.route('/import').post(authenticateUser, authorizePermissions('admin'), importProducts);
router.route('/export').get(authenticateUser, authorizePermissions('admin'), exportProducts);
// Yeni ürün oluşturma
router.route('/download-template').get(authenticateUser, authorizePermissions('admin'), downloadTemplate);

// Ürün yükleme (dosya import)
router.route('/import-create').post(authenticateUser, authorizePermissions('admin'), importCreateProducts);

router.route('/')
  .get(getAllProducts)
  .post([authenticateUser, authorizePermissions('admin')], createProduct);

  router.route('/featuredProducts').get(featuredProducts);


  router.route("/can_review").get(authenticateUser, canUserReview);

  router.route('/uploadImage/:id')
  .patch([authenticateUser, authorizePermissions('admin')], uploadImage);

router.route('/:id')
  .get(getSingleProduct)
  .patch([authenticateUser, authorizePermissions('admin')], updateProduct)
  .delete([authenticateUser, authorizePermissions('admin')], deleteProduct);

router.route('/:id/delete_image')
  .delete([authenticateUser, authorizePermissions('admin')], deleteProductImage);



router.route('/admin/products').get([authenticateUser, authorizePermissions('admin')], getAdminProducts);

router.route('/:productId/reviews').get(getSingleProductReviews);




module.exports = router;

