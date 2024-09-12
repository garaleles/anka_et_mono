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
  // console.log('Tüm req.body:', req.body);
  // console.log('req.params:', req.params);

  const { id } = req.params;
  const { name, email, role } = req.body.body || req.body;

  //console.log('Çıkarılan değerler:', { id, name, email, role });

  if (!email || !name || !role) {
    throw new CustomError.BadRequestError(`Lütfen tüm alanları doldurun. Eksik alanlar: ${!email ? 'email, ' : ''}${!name ? 'name, ' : ''}${!role ? 'role' : ''}`);
  }
 
  const user = await User.findById(id);

  if (!user) {
    throw new CustomError.NotFoundError(`Bu ID'ye sahip kullanıcı bulunamadı: ${id}`);
  }
 
  user.email = email;
  user.name = name;
  user.role = role;

  await user.save();

  res.status(StatusCodes.OK).json({ 
    success: true,
    message: 'Kullanıcı başarıyla güncellendi',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

const updateUserPassword = async (req, res) => { 
const { oldPassword, newPassword } = req.body;
  if (oldPassword === newPassword) {
    throw new CustomError.BadRequestError('Yeni şifreniz, eski şifrenizle aynı olamaz');
  }

  const user = await User.findOne({ _id: req.user.userId });
  

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
