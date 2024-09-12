const mongoose = require('mongoose');

const EmailConfigSchema = new mongoose.Schema({
  host: {
    type: String,
    required: [true, 'SMTP host gereklidir'],
  },
  port: {
    type: Number,
    required: [true, 'SMTP port gereklidir'],
  },
  user: {
    type: String,
    required: [true, 'SMTP kullanıcı adı gereklidir'],
  },
  pass: {
    type: String,
    required: [true, 'SMTP şifresi gereklidir'],
  },
});

module.exports = mongoose.model('EmailConfig', EmailConfigSchema);