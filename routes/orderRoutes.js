const express = require('express');
const router = express.Router();
const { authenticateUser, authorizePermissions } = require('../middleware/authentication.js');
const {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getSales
} = require('../controllers/orderController.js');


router.route('/')
  .get(authenticateUser, authorizePermissions('admin'), getAllOrders)
  .post(authenticateUser, createOrder);

router.route('/showAllMyOrders')
  .get(authenticateUser, getCurrentUserOrders);

router.route('/admin/get_sales').get(authenticateUser, authorizePermissions('admin'), getSales)

router.route('/:id')
  .get(authenticateUser, getSingleOrder)
  .patch(authenticateUser, authorizePermissions('admin'), updateOrder)
  .delete(authenticateUser, authorizePermissions('admin'), deleteOrder)


module.exports = router
