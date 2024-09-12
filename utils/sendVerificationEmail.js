const sendEmail = require('../utils/sendEmail.js');


const sendVerificationEmail = async ({ name, email, verificationToken, origin }) => { 
  const verifyEmail= `${origin}/user/verify-email?token=${verificationToken}&email=${email}`;
  const subject = 'Hesabınızı doğrulayın';
  const html = `
    <h1>Merhaba ${name}</h1>
    <p>Hesabınızı doğrulamak için lütfen aşağıdaki linke tıklayın.</p>
    <a href="${verifyEmail}">Doğrula</a>
  `;
  await sendEmail({ to: email, subject, html });
};

module.exports = sendVerificationEmail;