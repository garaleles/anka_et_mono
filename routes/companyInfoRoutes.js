const express = require('express');
const router = express.Router();
const { authenticateUser, authorizePermissions } = require('../middleware/authentication');
const {
  getOrCreateCompanyInfo,
  updateCompanyInfo,
  getCompanyLogo
} = require('../controllers/companyInfoController');

// Firma bilgisini getir (herkese açık)
router.route('/')
  .get(getOrCreateCompanyInfo);

// Firma bilgisini güncelle (sadece admin)
router.route('/')
  .patch(authenticateUser, authorizePermissions('admin'), updateCompanyInfo);

// Logo'yu getir (herkese açık)
router.route('/logo')
  .get(getCompanyLogo);

module.exports = router;