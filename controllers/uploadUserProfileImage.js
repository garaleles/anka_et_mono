const cloudinary = require('cloudinary').v2;
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const fs = require('fs');


const uploadUserAvatar = async (req, res) => {
  try {
    

    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
      use_filename: true,
      folder: 'profile'
    });

    
    // Kullanıcıyı bul ve profilePic objesini güncelle
    const user = await User.findOne({ _id: req.user.userId });

    //eski profil resmi var mı diye kontrol et. varsa onu sil
    if (user.profilePic.public_id) {
      await cloudinary.uploader.destroy(user.profilePic.public_id);
    }
    
    user.profilePic = {
      public_id: result.public_id,
      url: result.secure_url
    };
    await user.save();

    fs.unlinkSync(req.files.image.tempFilePath);

    res.status(StatusCodes.OK).json({ image: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Resim dosyası yüklenemedi.', error: error.message });
  }
};

module.exports = { uploadUserAvatar };