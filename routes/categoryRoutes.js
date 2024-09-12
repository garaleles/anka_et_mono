const express = require('express');
const router = express.Router();
const { authenticateUser, authorizePermissions } = require('../middleware/authentication.js');
const {
  getAllCategories,
  getSingleCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController.js');

// Tüm kategorileri al
router.route('/')
  .get(getAllCategories)
  .post(authenticateUser, authorizePermissions('admin'), createCategory);

// Tek bir kategoriyi al, güncelle veya sil
router.route('/:id')
  .get(getSingleCategory)
  .patch(authenticateUser, authorizePermissions('admin'), updateCategory)
  .delete(authenticateUser, authorizePermissions('admin'), deleteCategory);

module.exports = router;
