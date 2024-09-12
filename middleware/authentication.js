const CustomErr = require('../errors');
const { isTokenValid } = require('../utils');
const Token = require('../models/Token');
const { attachCookiesToResponse } = require('../utils');

const authenticateUser = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    if (accessToken) {
      const payload = isTokenValid(accessToken);
      req.user = payload.user;
      return next();
    }

    if (!refreshToken) {
      return next(new CustomErr.UnauthenticatedError('Kullanıcı kimliği doğrulanamadı. Lütfen giriş yapın'));
    }

    const payload = isTokenValid(refreshToken);
    const existingToken = await Token.findOne({
      refreshToken,
      user: payload.user._id
    });

    if (!existingToken || !existingToken.isValid) {
      return next(new CustomErr.UnauthenticatedError('Kullanıcı kimliği doğrulanamadı. Lütfen giriş yapın'));
    }

    attachCookiesToResponse(res, payload.user, existingToken.refreshToken);
    req.user = payload.user;
    next();

  } catch (error) {
    return next(new CustomErr.UnauthenticatedError('Kullanıcı kimliği doğrulanamadı. Lütfen giriş yapın'));
  }
};
const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new CustomErr.UnauthenticatedError('Kullanıcı kimliği doğrulanamadı. Lütfen giriş yapın'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new CustomErr.UnauthorizedError('Bu işlemi yapmaya yetkiniz yok'));
    }
    next();
  };
};

module.exports = { authenticateUser, authorizePermissions };