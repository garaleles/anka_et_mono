const express = require('express');
const router = express.Router();
const { getEmailConfig, updateEmailConfig } = require('../controllers/emailConfigController');
const { authenticateUser, authorizePermissions } = require('../middleware/authentication');

router.route('/')
  .get([authenticateUser, authorizePermissions('admin')], getEmailConfig)
  .patch([authenticateUser, authorizePermissions('admin')], updateEmailConfig);

module.exports = router;