const { createJwt, isTokenValid, attachCookiesToResponse } = require('./jwt.js');
const createTokenUser  = require('./createTokenUser.js');
const checkPermissions = require('./checkPermissions.js');
const sendVerificationEmail = require('./sendVerificationEmail.js');
const sendResetPasswordEmail = require('./sendResetPasswordEmail.js');
const createHash = require('./createHash.js');

module.exports = {
  createJwt,
  isTokenValid,
  attachCookiesToResponse,
  createTokenUser,
  checkPermissions,
  sendVerificationEmail,
  sendResetPasswordEmail,
  createHash
};