const EmailConfig = require('../models/EmailConfig');
const { encrypt, decrypt } = require('../utils/encryption');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');

const getEmailConfig = async (req, res) => {
  let config = await EmailConfig.findOne();
  
  if (!config) {
    // Eğer yapılandırma bulunamazsa, varsayılan bir yapılandırma oluştur
    const defaultConfig = {
      host: 'smtp.example.com',
      port: 587,
      user: encrypt('default@example.com'),
      pass: encrypt('defaultPassword')
    };
    
    // Varsayılan yapılandırmayı veritabanına kaydet
    config = await EmailConfig.create(defaultConfig);
  }
  
  const decryptedConfig = {
    host: config.host,
    port: config.port,
    user: decrypt(config.user),
    pass: decrypt(config.pass),
  };
  
  res.status(StatusCodes.OK).json({ emailConfig: decryptedConfig });
};

const updateEmailConfig = async (req, res) => {
  const { host, port, user, pass } = req.body;
  
  const encryptedConfig = {
    host,
    port,
    user: encrypt(user),
    pass: encrypt(pass),
  };
  
  const config = await EmailConfig.findOneAndUpdate({}, encryptedConfig, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  
  res.status(StatusCodes.OK).json({ message: 'E-posta yapılandırması güncellendi', emailConfig: config });
};

module.exports = {
  getEmailConfig,
  updateEmailConfig,
};