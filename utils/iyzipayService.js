const Iyzipay = require('iyzipay');
const IyzipayInfo = require('../models/IyzipayInfo');
const { decrypt } = require('./encryption');

const getIyzipayInstance = async () => {
  const iyzipayInfo = await IyzipayInfo.findOne();
  
  if (!iyzipayInfo) {
    throw new Error('Iyzipay bilgileri bulunamadı');
  }

  const apiKey = decrypt(iyzipayInfo.apiKey);
  const secretKey = decrypt(iyzipayInfo.secretKey);

  return new Iyzipay({
    apiKey: apiKey,
    secretKey: secretKey,
    uri: iyzipayInfo.baseUrl,
  });
};

module.exports = getIyzipayInstance;
