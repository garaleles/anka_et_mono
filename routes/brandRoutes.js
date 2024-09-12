const express = require('express');
const router = express.Router();
const { authenticateUser, authorizePermissions } = require('../middleware/authentication.js');
const {
  getAllBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');


// Tüm markaları al
router.route('/')
  .get(getAllBrands)
  .post(authenticateUser, authorizePermissions('admin'), createBrand);

// Tek bir markayı al, güncelle veya sil
router.route('/:id')
  .get(getBrand)
  .patch(authenticateUser, authorizePermissions('admin'), updateBrand)
  .delete(authenticateUser, authorizePermissions('admin'), deleteBrand);

module.exports = router;
