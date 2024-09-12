const { StatusCodes } = require('http-status-codes');
const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    // set default
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Bir hata oluştu. Daha sonra tekrar deneyin.',
  };
  if (err.name === 'ValidationError') {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(',');
    customError.statusCode = 400;
  }
  if (err.code && err.code === 11000) {
    customError.msg = `Şu alan için: ${Object.keys(
      err.keyValue
    )} yinelenen değer girildi. Lütfen başka bir değer girin.`;
    customError.statusCode = 400;
  }
  if (err.name === 'CastError') {
    customError.msg = `Yazdığınız bu : ${err.value} kimliğe sahip dosya/sayfa bulunamadı.`;
    customError.statusCode = 404;
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};

module.exports = errorHandlerMiddleware;
