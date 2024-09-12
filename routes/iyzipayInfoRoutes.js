const express = require('express');
const router = express.Router();
const { authenticateUser, authorizePermissions } = require('../middleware/authentication.js');
const {
  createIyzipayInfo,
  getSingleIyzipayInfo,
  updateIyzipayInfo,
  deleteIyzipayInfo
} = require('../controllers/iyzipayInfoController.js');

router.route('/')
  .post(authenticateUser, authorizePermissions('admin'), createIyzipayInfo);

router.route('/:id')
  .get(getSingleIyzipayInfo)
  .patch(authenticateUser, authorizePermissions('admin'), updateIyzipayInfo)
  .delete(authenticateUser, authorizePermissions('admin'), deleteIyzipayInfo);

module.exports = router;


