const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Category = require('../models/Category.js');


const getAllCategories = async (req, res) => { 
  //tüm kategorileri al
  const categories = await Category.find({});

  if (categories.length < 1) {
    throw new CustomError.NotFoundError('Kategori bulunamadı');
  }

  res.status(StatusCodes.OK).json({ categories });

};

const getSingleCategory = async (req, res) => { 
  //tek bir kategoriyi al
  const { id: categoryID } = req.params;
  const category = await Category.findOne({ _id: categoryID });
  if (!category) {
    throw new CustomError.NotFoundError(`Bu: ${categoryID} id'ye ait kategori bulunamadı`);
  }
  res.status(StatusCodes.OK).json({ category });
};



const createCategory = async (req, res) => { 
  //yeni bir kategori oluştur
  const category = await Category.create(req.body);
  res.status(StatusCodes.CREATED).json({ category });
};

const updateCategory = async (req, res) => { 
  //bir kategoriyi güncelle
  const { id: categoryID } = req.params;
 

  const category = await Category.findOneAndUpdate({ _id: categoryID }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    throw new CustomError.NotFoundError(`Bu: ${categoryID} id'ye ait kategori bulunamadı`);
  }

  res.status(StatusCodes.OK).json({ category });
};

const deleteCategory = async (req, res) => { 
  //bir kategoriyi sil
  const { id: categoryID } = req.params;
  const category = await Category.findOneAndDelete({ _id: categoryID });

  if (!category) {
    throw new CustomError.NotFoundError(`Bu: ${categoryID} id'ye ait kategori bulunamadı`);
  }

  res.status(StatusCodes.OK).json({ category });
};

module.exports = {
  getAllCategories,
  getSingleCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
