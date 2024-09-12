const { StatusCodes } = require('http-status-codes');
const IyzipayInfo = require('../models/IyzipayInfo');
const CustomError = require('../errors');
const { encrypt, decrypt } = require('../utils/encryption');

const createIyzipayInfo = async (req, res) => {
  const { apiKey, secretKey, baseUrl } = req.body;

  const encryptedApiKey = encrypt(apiKey);
  const encryptedSecretKey = encrypt(secretKey);

  const iyzipayInfo = await IyzipayInfo.create({
    apiKey: encryptedApiKey,
    secretKey: encryptedSecretKey,
    baseUrl
  });

  res.status(StatusCodes.CREATED).json({ message: 'Iyzipay bilgileri başarıyla oluşturuldu' });
};

const getSingleIyzipayInfo = async (req, res) => {
  const iyzipayInfo = await IyzipayInfo.findOne();
  if (!iyzipayInfo) {
    throw new CustomError.NotFoundError(`Iyzipay bilgileri bulunamadı`);
  }

  const decryptedApiKey = decrypt(iyzipayInfo.apiKey);
  const decryptedSecretKey = decrypt(iyzipayInfo.secretKey);

  res.status(StatusCodes.OK).json({
    apiKey: decryptedApiKey,
    secretKey: decryptedSecretKey,
    baseUrl: iyzipayInfo.baseUrl
  });
};

const updateIyzipayInfo = async (req, res) => {
  const { apiKey, secretKey, baseUrl } = req.body;

  const iyzipayInfo = await IyzipayInfo.findOne();
  if (!iyzipayInfo) {
    throw new CustomError.NotFoundError(`Iyzipay bilgileri bulunamadı`);
  }

  iyzipayInfo.apiKey = encrypt(apiKey);
  iyzipayInfo.secretKey = encrypt(secretKey);
  iyzipayInfo.baseUrl = baseUrl;

  await iyzipayInfo.save();

  res.status(StatusCodes.OK).json({ message: 'Iyzipay bilgileri başarıyla güncellendi' });
};

const deleteIyzipayInfo = async (req, res) => {
  const iyzipayInfo = await IyzipayInfo.findOne();
  if (!iyzipayInfo) {
    throw new CustomError.NotFoundError(`Iyzipay bilgileri bulunamadı`);
  }

  await iyzipayInfo.deleteOne();
  res.status(StatusCodes.OK).json({ message: 'Iyzipay bilgileri başarıyla silindi' });
};

module.exports = {
  createIyzipayInfo,
  getSingleIyzipayInfo,
  updateIyzipayInfo,
  deleteIyzipayInfo
};