const mongoose = require('mongoose')

const companyInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lütfen bir isim girin.'],
   
  },
  address: {
    type: String,
   
  },
  phone: {
    type: String,
    
  },
  email: {
    type: String,
    
  },
 
   bank1: {
    bankName: String,
    accountHolder: String,
    bankAccountNumber: String,
    bankIBAN: String,
  },
  bank2: {
    bankName: String,
    accountHolder: String,
    bankAccountNumber: String,
    bankIBAN: String,
  },
  whatsapp: String,
  twitter: String,
  instagram: String,
  footerText: String,

   logo: {
    type: String,
    default: ''
  },
  invoice_logo: {
    type: String,
    default: ''
  },
  

  
}, { timestamps: true})

module.exports = mongoose.model('CompanyInfo', companyInfoSchema)


