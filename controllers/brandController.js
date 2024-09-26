const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Brand = require('../models/Brand.js');


const getAllBrands = async (req, res) => { 
  //markaları listele
  const brands = await Brand.find({});
  res.status(StatusCodes.OK).json({ brands });
};



const getBrand = async (req, res) => {
  //marka id'sine göre markayı getir
  const brand = await Brand.findOne({ _id: req.params.id });
  if (!brand) {
    throw new CustomError.NotFoundError(`Verilen bu : ${req.params.id} id'li marka bulunamadı`);
  }
  res.status(StatusCodes.OK).json({ brand });
};

const createBrand = async (req, res) => {
  //marka oluştur
  const brand = await Brand.create({ ...req.body });
  res.status(StatusCodes.CREATED).json({ brand });
};

const updateBrand = async (req, res) => {
  //marka güncelle
  const { id: brandID } = req.params;
 

  const brand = await Brand.findOneAndUpdate({ _id: brandID }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!brand) {
    throw new CustomError.NotFoundError(`Bu: ${brandID} id'ye ait marka bulunamadı`);
  }

  res.status(StatusCodes.OK).json({ brand });

};

const deleteBrand = async (req, res) => {
  //marka sil
  const { id: brandID } = req.params;
  const brand = await Brand.findOneAndDelete({ _id: brandID });
  if (!brand) {
    throw new CustomError.NotFoundError(`Bu: ${brandID} id'ye ait marka bulunamadı`);
  }
  res.status(StatusCodes.OK).json({ brand });
};


module.exports = {
  getAllBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};