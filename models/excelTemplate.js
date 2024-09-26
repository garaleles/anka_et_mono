const mongoose = require('mongoose');

const excelTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  stock: { type: Number, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const ExcelTemplate = mongoose.model('ExcelTemplate', excelTemplateSchema);

module.exports = ExcelTemplate;


