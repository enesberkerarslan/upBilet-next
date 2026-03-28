const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority',
            debug: true // Hata ayıklama modunu aktif ediyoruz
        });

        logger.info(`MongoDB bağlantısı başarılı: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`MongoDB bağlantı hatası: ${error.message}`);
        logger.error(`Hata detayları: ${JSON.stringify(error, null, 2)}`);
        process.exit(1);
    }
};

module.exports = connectDB; 