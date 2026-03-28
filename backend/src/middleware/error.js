const { logger } = require('../utils/logger');
const ApiError = require('../utils/api.error');

/**
 * Hata yakalama middleware'i
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Geçersiz ID formatı';
        error = new ApiError(404, message);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Bu kayıt zaten mevcut';
        error = new ApiError(400, message);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new ApiError(400, message);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Geçersiz token';
        error = new ApiError(401, message);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token süresi doldu';
        error = new ApiError(401, message);
    }

    const statusCode =
        error.statusCode || err.statusCode || (err.name === 'MulterError' ? 400 : null) || 500;

    // Log error
    logger.error(`${error.message} - ${statusCode} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // Send response
    res.status(statusCode).json({
        success: false,
        error: error.message || 'Sunucu hatası',
        message: error.message || 'Sunucu hatası',
    });
};

module.exports = { errorHandler }; 