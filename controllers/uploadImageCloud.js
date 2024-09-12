const cloudinary = require('cloudinary').v2;
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');
const fs=require('fs');

const uploadProductImage = async (req, res) => {
  try {
    // if (!req.files || !req.files.image) {
    //   return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Resim dosyası yükleyin' });
    // }

    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
      use_filename: true,
      folder: 'product',
      public_id: req.body.public_id
      
    });

    fs.unlinkSync(req.files.image.tempFilePath);

    res.status(StatusCodes.OK).json({ image: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Resim dosyası yüklenemedi.', error: error.message });
  }
};


module.exports = { uploadProductImage };