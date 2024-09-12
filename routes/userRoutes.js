const express = require('express');
const router = express.Router();
const {authenticateUser, authorizePermissions} = require('../middleware/authentication.js');
const {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getChatUsers

} = require('../controllers/userController.js');
const {uploadUserAvatar} = require('../controllers/uploadUserProfileImage.js');


router.get('/chat-users', authenticateUser, getChatUsers);

router.route('/').get(authenticateUser, authorizePermissions('admin'), getAllUsers);
router.route('/showMe').get(authenticateUser, showCurrentUser);
router.route('/:id').patch(authenticateUser,authorizePermissions('admin'), updateUser);
router.route('/updateUserPassword').patch(authenticateUser, updateUserPassword);
router.route('/:id').get(authenticateUser, getSingleUser).delete(authenticateUser, authorizePermissions('admin'), deleteUser);

router.route('/uploadUserAvatar').post([authenticateUser, uploadUserAvatar]);







module.exports = router;
