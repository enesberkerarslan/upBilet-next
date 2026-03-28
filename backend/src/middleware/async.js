/**
 * Async handler middleware
 * Express route handler'larındaki try-catch bloklarını otomatikleştirir
 * @param {Function} fn - Async route handler fonksiyonu
 * @returns {Function} Express middleware fonksiyonu
 */
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Doğrudan fonksiyonu export et
module.exports = asyncHandler; 