const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt=require('bcryptjs');


const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lütfen isim girin.'],
    minLength: 3,
    maxLength: 50,
  },
  
  email: {
    type: String,
    required: [true, 'Lütfen geçerli bir e-posta adresi girin.'],
    validate: {
      validator:validator.isEmail,
      message: (props) => `${props.value} geçerli bir e-posta adresi değil.`,
    },
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Lütfen şifre girin.'],
    minLength: 6,
  },
  phone: {
    type: String,
    //required: [true, 'Lütfen telefon numarası girin.'],
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },

   deliveryAddress: {
        type: String,
        //required: true,
    },
  profilePic: {
    public_id:String,
    url:String
    },
        
  verificationToken: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Date,
  },
  passwordToken: {
    type: String,
  },
  passwordTokenExpirationDate: {
    type: Date,
  },
   
}, {timestamps: true});

UserSchema.pre('save', async function () { 
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword) { 
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model('User', UserSchema);