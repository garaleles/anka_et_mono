const sendEmail = require('./sendEmail');


const sendResetPasswordEmail = async ({ name, email, token, origin }) => { 
  const resetUrl = `${origin}/user/reset-password?token=${token}&email=${email}`;

  const html = `<h2>Merhaba ${name}</h2>
  <p>Şifrenizi sıfırlamak için linke tıklayın: <a href="${resetUrl}">şifreyi sıfırla</a></p>
  <p>Link 10 dakika boyunca geçerlidir.</p>
  <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelin.</p>`;

  const subject = 'Şifre Sıfırlama İsteği';
  return sendEmail({
     to: email,
    subject,
    html
  });

  
};

module.exports = sendResetPasswordEmail;
