const Product = require('../models/Product')
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const ApiFilters = require('../utils/apiFilters');
const Order=require('../models/Order')
const cloudinary = require('cloudinary').v2;
const ExcelJS = require('exceljs');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

const createProduct = async (req, res) => { 
  req.body.user = req.user.userId;
  const product = await Product.create(req.body);
  res.status(StatusCodes.CREATED).json({ product })
}

const getAllProducts = async (req, res) => { 
  const resPerPage = 8
  
  const apiFilters = new ApiFilters(Product, req.query).search().filter();

  let products = await apiFilters.query;

  let filteredProductsCount = products.length

  apiFilters.pagination(resPerPage);

  products = await apiFilters.query.clone()
    .populate('reviews')
    .populate('brand')
    .populate('category');

  // Eğer keyword varsa ve sonuç yoksa, benzer ürünleri öner
  if (req.query.keyword && products.length === 0) {
    const similarProducts = await Product.find({
      name: { $regex: req.query.keyword.split(' ').join('|'), $options: 'i' }
    }).limit(5);
    
    res.status(StatusCodes.OK).json({ 
      products: [], 
      count: 0, 
      resPerPage, 
      filteredProductsCount: 0,
      suggestions: similarProducts.map(p => p.name)
    });
  } else {
    res.status(StatusCodes.OK).json({ 
      products, 
      count: products.length, 
      resPerPage, 
      filteredProductsCount 
    });
  }
}
const getAdminProducts = async (req, res) => { 
  const products = await Product.find().populate('brand').populate('category');
  res.status(StatusCodes.OK).json({ products, count: products.length });
}

const getSingleProduct = async (req, res) => { 
  const { id: productId } = req.params;
  const product = await Product.findOne({ _id: productId }).populate('reviews').populate('brand').populate('category');
  if (!product) {
    throw new CustomError.NotFoundError(`Aradığınız bu: ${productId} id'li ürün bulunamadı.`);
  }
  res.status(StatusCodes.OK).json({ product });
}

const updateProduct = async (req, res) => { 
  try {

    const { id: productId } = req.params;
    
    const product = await Product.findByIdAndUpdate(
     productId, 
     req.body.body, 
     { new: true, runValidators: true }
    );
    
    if (!product) {
      throw new CustomError.NotFoundError(`Aradığınız,  ${productId} id'li ürün bulunamadı.`);
    }
 
    res.status(StatusCodes.OK).json({ product });
    
  } catch (error) {
  
    res.status(StatusCodes.BAD_REQUEST).json({ msg: "Ürün güncellenirken bir hata oluştu." });
  }
}


const deleteProduct = async (req, res) => { 
  try {
    const { id: productId } = req.params;
    
    // Önce ürünü bul
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new CustomError.NotFoundError(`Aradığınız bu: ${productId} id'li ürün bulunamadı.`);
    }
    
    // Ürüne ait resimleri sil  
    if (product.images) {
      for(let i = 0; i < product.images?.length; i++){
        await cloudinary.uploader.destroy(product.images[i].public_id);
      }
    }
    

    // Ürünü sil
    await Product.deleteOne({ _id: productId });
    
    res.status(StatusCodes.OK).json({msg:'Ürün başarıyla silindi.', product });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ msg: "Ürün silinirken bir hata oluştu.", error: error.message });
  }
}



const uploadImage = async (req, res) => {
    const { id } = req.params;
    const { body } = req.body;

    if (!body || !body.images || !Array.isArray(body.images)) {
        return res.status(400).json({
            msg: "Resim dosyası yüklenemedi.",
            error: "Geçersiz veri yapısı, 'images' alanı bulunamadı.",
        });
    }

    try {
        const uploadedImages = await Promise.all(
            body.images.map(async (image) => {
                const result = await cloudinary.uploader.upload(image, {
                    folder: "product",
                });
                return {
                    public_id: result.public_id,
                    url: result.secure_url,
                };
            })
        );

        let product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ msg: "Ürün bulunamadı." });
        }

        // Mevcut resimleri koruyarak yeni resimleri ekleyin
        product.images = [...product.images, ...uploadedImages];
        
        // Ürünü güncelleyin ve yeni versiyonunu alın
        product = await Product.findByIdAndUpdate(
            id,
            { images: product.images },
            { new: true, runValidators: false }
        );

        res.status(200).json({
            msg: "Resimler başarıyla yüklendi.",
            images: product.images,
        });
    } catch (error) {
        console.error('Ürün güncellenirken bir hata oluştu:', error);
        res.status(500).json({
            msg: "Resim dosyası yüklenemedi.",
            error: error.message,
        });
    }
};



const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imgId } = req.body;

    if (!id || !imgId) {
      throw new CustomError.BadRequestError("Ürün ID'si ve resim ID'si gereklidir.");
    }

    let product = await Product.findById(id);

    if (!product) {
      throw new CustomError.NotFoundError(`Aradığınız bu: ${id} id'li ürün bulunamadı.`);
    }

    const isDeleted = await cloudinary.uploader.destroy(imgId);

    if (isDeleted.result !== "ok") {
      throw new CustomError.BadRequestError("Cloudinary'den resim silinemedi.");
    }

    // Filter out the image with the given imgId
    product.images = product.images.filter(img => img.public_id !== imgId);

    // Ürünü güncelleyin ve yeni versiyonunu alın
    product = await Product.findByIdAndUpdate(
      id,
      { images: product.images },
      { new: true, runValidators: false }
    );

    res.status(StatusCodes.OK).json({
      msg: "Resim başarıyla silindi.",
      images: product.images,
    });

  } catch (error) {
    console.error('Resim silinirken bir hata oluştu:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Resim silinirken bir hata oluştu.",
      error: error.message,
    });
  }
};


const canUserReview = async (req, res) => {
  console.log('canUserReview metodu çağrıldı'); // Metodun çağrılıp çağrılmadığını kontrol etmek için
  
  const { productId } = req.query;
  console.log('Gelen productId:', productId); // Gelen productId'yi kontrol etmek için

  // Product ID'nin geçerliliğini kontrol edin
  const product = await Product.findById(productId);
  console.log('Bulunan ürün:', product); // Ürünün bulunup bulunmadığını kontrol edin

  if (!product) {
    console.log('Ürün bulunamadı');
    return res.status(404).json({ msg: 'Bu productId ile ilgili ürün bulunamadı.' });
  }

  const orders = await Order.find({
    user: req.user.userId,
    "orderItems.product": productId,
  });
  console.log('Bulunan siparişler:', orders); // Siparişlerin bulunup bulunmadığını kontrol edin

  if (orders.length === 0) {
    console.log('Sipariş bulunamadı, canReview: false');
    return res.status(200).json({ canReview: false });
  }

  console.log('Sipariş bulundu, canReview: true');
  return res.status(200).json({
    canReview: true,
  });
};

const featuredProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).limit(3);
    res.status(StatusCodes.OK).json(products);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};



const { ObjectId } = require('mongodb'); // ObjectId'yi import ediyoruz

const importProducts = async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Lütfen bir Excel dosyası yükleyin.' });
  }

  const file = req.files.file;
  const uploadDir = path.join(__dirname, '../uploads');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uploadPath = path.join(uploadDir, file.name);

  try {
    await file.mv(uploadPath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(uploadPath);
    const worksheet = workbook.getWorksheet(1);

    let updatedCount = 0;
    let unchangedCount = 0;
    let errorCount = 0;
    let errorMessages = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const [id, name, price] = row.values.slice(1);

      if (!id || !name || !price) {
        console.log(`Eksik veri bulunan satır: ${rowNumber} - ${row.values}`);
        errorCount++;
        errorMessages.push(`Satır ${rowNumber}: Eksik veri`);
        continue;
      }

      try {
        // ObjectId dönüşümü yapıyoruz
        const objectId = new ObjectId(id.replace(/^"+|"+$/g, '')); // Tırnak işaretlerini kaldırıyoruz
        const existingProduct = await Product.findById(objectId);
        
        if (existingProduct) {
          if (existingProduct.price !== price) {
            existingProduct.price = price;
            await existingProduct.save({ validateBeforeSave: false });
            updatedCount++;
          } else {
            unchangedCount++;
          }
        } else {
          console.log(`Ürün bulunamadı: ${id}`);
          errorCount++;
          errorMessages.push(`Satır ${rowNumber}: Ürün bulunamadı (ID: ${id})`);
        }
      } catch (productError) {
        console.error(`Ürün işleme hatası (Satır ${rowNumber}):`, productError);
        errorCount++;
        errorMessages.push(`Satır ${rowNumber}: İşlem hatası (${productError.message})`);
      }
    }

    fs.unlinkSync(uploadPath);

    res.status(StatusCodes.OK).json({ 
      success: true, 
      message: `${updatedCount} ürün fiyatı güncellendi, ${unchangedCount} ürün fiyatı değişmedi, ${errorCount} hata oluştu.`,
      errors: errorMessages
    });
  } catch (error) {
    console.error('İçe aktarma işlemi sırasında hata:', error);
    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'İçe aktarma işlemi sırasında bir hata oluştu.',
      error: error.message
    });
  }
};

const exportProducts = async (req, res) => {
  try {
    const products = await Product.find({}, 'id name price');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ürünler');

    worksheet.columns = [
      { header: 'Ürün Kodu', key: 'id', width: 15 },
      { header: 'Ürün Adı', key: 'name', width: 30 },
      { header: 'Fiyat', key: 'price', width: 15 }
    ];

    products.forEach(p => {
      worksheet.addRow({
        id: p._id,
        name: p.name,
        price: p.price
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=urunler.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel dosyası oluşturma hatası:', error);
    res.status(500).json({ success: false, message: 'Excel dosyası oluşturulurken bir hata oluştu.', error: error.message });
  }
};


module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  canUserReview,
  getAdminProducts,
  deleteProductImage,
  featuredProducts,
  importProducts,
  exportProducts,
};