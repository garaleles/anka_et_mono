const nodemailer = require('nodemailer');
const EmailConfig = require('../models/EmailConfig');
const { decrypt } = require('./encryption');

const sendEmail = async ({ to, subject, html }) => {
  const emailConfig = await EmailConfig.findOne();
  if (!emailConfig) {
    throw new Error('E-posta yapılandırması bulunamadı');
  }

  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    auth: {
      user: decrypt(emailConfig.user),
      pass: decrypt(emailConfig.pass),
    },
  });

  return transporter.sendMail({
    from: `"Anka Online Pazarlama" <${decrypt(emailConfig.user)}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;