const User= require('../models/User.js');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { attachCookiesToResponse, createTokenUser, checkPermissions } = require('../utils');
const cloudinary = require('cloudinary').v2;


const getAllUsers = async (req, res) => { 
  const users = await User.find({ role: 'user' }).select('-password');
  res.status(StatusCodes.OK).json({ users, count: users.length });
  
};


const getSingleUser = async (req, res) => { 
  const user = await User.findOne({ _id: req.params.id }).select('-password');
  if (!user) {
    throw new CustomError.NotFoundError(`Bu : ${req.params.id} id'ye sahip bir kullanıcı bulunamadı`);
  }
  checkPermissions(req.user, user._id);
  res.status(StatusCodes.OK).json({ user });

};


const showCurrentUser = async (req, res) => { 
  const user = await User.findOne({ _id: req.user.userId }).select('-password');
  res.status(StatusCodes.OK).json({ user });
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!email || !name) {
    throw new CustomError.BadRequestError('Lütfen tüm alanları doldurun');
  }
 
  const user = await User.findById(id);

  if (!user) {
    throw new CustomError.NotFoundError(`Bu ID'ye sahip kullanıcı bulunamadı: ${id}`);
  }

  // Kullanıcının kendi profilini güncellemesine izin ver
  checkPermissions(req.user, user._id);
 
  user.email = email;
  user.name = name;

  await user.save();

  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};


const updateUserPassword = async (req, res) => {
  try {
   
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
  return res.status(400).json({ msg: 'Lütfen tüm alanları doldurun' });
}

if (oldPassword === newPassword) {
  return res.status(400).json({ msg: 'Yeni şifreniz, eski şifrenizle aynı olamaz' });
}
    const user = await User.findOne({ _id: req.user.userId });
    console.log('Bulunan kullanıcı:', user);

    if (!user) {
      throw new CustomError.NotFoundError('Kullanıcı bulunamadı');
    }

    const isPasswordCorrect = await user.comparePassword(oldPassword);
   

    if (!isPasswordCorrect) {
      throw new CustomError.UnauthenticatedError('Eski şifreniz yanlış');
    }

    user.password = newPassword;
    await user.save();
    res.status(StatusCodes.OK).json({ message: 'Şifreniz başarıyla değiştirildi' });
  } catch (error) {
    console.error('updateUserPassword hatası:', error);
    res.status(error.statusCode || 500).json({ msg: error.message || 'Bir hata oluştu' });
  }
};

const deleteUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id });
  if (!user) {
    throw new CustomError.NotFoundError(`Kullanıcı bulunamadı: ${req.params.id}`);
  }
  //cloudinary den resmi sil
  if (user.profilePic.public_id) {
    await cloudinary.uploader.destroy(user.profilePic.public_id);
  }

  await user.deleteOne();
  res.status(StatusCodes.OK).json({ message: 'Kullanıcı başarıyla silindi' });
};

const getChatUsers = async (req, res) => {
  const currentUser = req.user; // Mevcut kullanıcı bilgisi

  let users;
  if (currentUser.role === 'admin') {
    // Admin tüm kullanıcıları görebilir (kendisi hariç)
    users = await User.find({ _id: { $ne: currentUser.userId } }).select('name email role');
  } else {
    // Normal kullanıcılar sadece adminleri görebilir
    users = await User.find({ role: 'admin' }).select('name email role');
  }

  res.status(StatusCodes.OK).json({ users, count: users.length });
};







module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getChatUsers,
};
