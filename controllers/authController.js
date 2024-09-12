const User = require('../models/User.js');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { attachCookiesToResponse, createTokenUser, sendVerificationEmail, sendResetPasswordEmail, createHash } = require('../utils');
const crypto = require('crypto');
const Token = require('../models/Token.js');
const e = require('express');



const register = async (req, res) => {
  const { email, name, password, profilePic } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError('Bu e-posta adresi zaten kullanımda.');
  }

  //?ilk kullanıcıyı admin olarak kaydet
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? 'admin' : 'user';

  const verificationToken = crypto.randomBytes(40).toString('hex');

  const user = await User.create({ email, name, password, profilePic, role, verificationToken });

  const origin = 'http://localhost:3000';
  
  await sendVerificationEmail({
   name: name,
   email: email,
   verificationToken: verificationToken,
  origin: origin
  
  });
  
  res.status(StatusCodes.CREATED).json({ msg: 'Hesabınız başarıyla oluşturuldu. Lütfen e-postanızı kontrol edin ve hesabınızı doğrulayın.' });
 

};

const verifyEmail = async (req, res) => { 
  const { verificationToken, email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.BadRequestError('Geçersiz e-posta.');
  }

  if (user.verificationToken !== verificationToken) {
    throw new CustomError.BadRequestError('Geçersiz doğrulama kodu.');
  }

  user.isVerified = true;
  user.verified = Date.now();
  user.verificationToken = '';
  await user.save();
  res.status(StatusCodes.OK).json({ msg: 'Hesabınız başarıyla doğrulandı.' });

 
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError('E-posta ve şifre zorunludur.');
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError('Geçersiz e-posta veya şifre.');
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Geçersiz e-posta veya şifre.');
  }

  if (!user.isVerified) {
    throw new CustomError.UnauthenticatedError('Lütfen e-postanızı kontrol edin ve hesabınızı doğrulayın.');
  }

  const tokenUser = createTokenUser(user);

  // Create refresh token
  let refreshToken = '';

  // Check for existing token
  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    const { isValid } = existingToken;
    if (!isValid) {
      throw new CustomError.UnauthenticatedError('Geçersiz oturum.');
    }
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ user: tokenUser });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString('hex');
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await Token.create(userToken);

  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId });

  res.cookie('accessToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie('refreshToken', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ message: 'Çıkış yapıldı.' });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError.BadRequestError('E-posta zorunludur.');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.NotFoundError('Kullanıcı bulunamadı.');
  } else {
    const passwordToken = crypto.randomBytes(70).toString('hex');
    //?send email with password reset link
    const origin = 'http://localhost:3000';
    await sendResetPasswordEmail({
      name: user.name,
      email: user.email,
      token: passwordToken,
      origin
    });

    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.passwordToken = createHash(passwordToken);
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await user.save();

  }


 res.status(StatusCodes.OK).json({ msg: 'Şifre sıfırlama e-postası gönderildi. Lütfen e-postanızı kontrol edin.' });
}

const resetPassword = async (req, res) => {
  const { email, token, password } = req.body;

  if (!email || !token || !password) {
    throw new CustomError.BadRequestError('E-posta, şifre ve token zorunludur.');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.NotFoundError('Kullanıcı bulunamadı.');
  }

  if (user.passwordToken !== createHash(token)) {
    throw new CustomError.BadRequestError('Geçersiz token.');
  }

  if (user.passwordTokenExpirationDate < Date.now()) {
    throw new CustomError.BadRequestError('Token süresi doldu.');
  }

  user.password = password;
  user.passwordToken = '';
  user.passwordTokenExpirationDate = null;
  await user.save();

  res.status(StatusCodes.OK).json({ msg: 'Şifreniz başarıyla sıfırlandı.' });

}

//upload user avatar

 

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,

};