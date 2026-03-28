/**
 * Asenkron fonksiyonları try-catch bloğu içinde çalıştırmak için yardımcı fonksiyon
 * @param {Function} fn - Asenkron fonksiyon
 * @returns {Function} - Express middleware fonksiyonu
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync; 