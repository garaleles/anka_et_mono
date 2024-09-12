const CustomError = require('../errors');


const checkPermissions = (requestUser, resourceUserId) => {
  if (requestUser.role !== 'admin' && requestUser.userId !== resourceUserId.toString()) {
    throw new CustomError.UnauthorizedError('Bu işlemi gerçekleştirmek için yetkiniz yok');
  }
}

module.exports = checkPermissions;