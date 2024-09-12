const CompanyInfo = require('../models/CompanyInfo');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Firma bilgisini getir veya oluştur
exports.getOrCreateCompanyInfo = async (req, res) => {
  try {
    let companyInfo = await CompanyInfo.findOne();
    if (!companyInfo) {
      companyInfo = await CompanyInfo.create(req.body);
      res.status(StatusCodes.CREATED).json({ companyInfo });
    } else {
      res.status(StatusCodes.OK).json({ companyInfo });
    }
  } catch (error) {
    console.error('Hata:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

// Firma bilgisini güncelle
 exports.updateCompanyInfo = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // Banka bilgilerini JSON olarak parse et
    if (updateData.bank1) {
      updateData.bank1 = JSON.parse(updateData.bank1);
    }
    if (updateData.bank2) {
      updateData.bank2 = JSON.parse(updateData.bank2);
    }

    if (req.files) {
      if (req.files.logo) {
        const logoResult = await cloudinary.uploader.upload(req.files.logo.tempFilePath, {
          use_filename: true,
          folder: 'company'
        });
        updateData.logo = logoResult.secure_url;
        fs.unlinkSync(req.files.logo.tempFilePath);
      }
      if (req.files.invoice_logo) {
        const invoiceLogoResult = await cloudinary.uploader.upload(req.files.invoice_logo.tempFilePath, {
          use_filename: true,
          folder: 'company'
        });
        updateData.invoice_logo = invoiceLogoResult.secure_url;
        fs.unlinkSync(req.files.invoice_logo.tempFilePath);
      }
    }

    const companyInfo = await CompanyInfo.findOneAndUpdate({}, updateData, { 
      new: true, 
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true
    });
    
    if (!companyInfo) {
      throw new CustomError.NotFoundError('Firma bilgisi bulunamadı');
    }
    
    res.status(StatusCodes.OK).json({ companyInfo });
  } catch (error) {
    console.error('Hata:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

// Sadece firma logosunu getir
exports.getCompanyLogo = async (req, res) => {
  try {
    const companyInfo = await CompanyInfo.findOne().select('logo');
    if (!companyInfo) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Firma bilgisi bulunamadı' });
    }
    res.status(StatusCodes.OK).json({ logo: companyInfo.logo });
  } catch (error) {
    console.error('Hata:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};