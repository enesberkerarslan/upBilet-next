const winston = require('winston');

// Log formatını tanımla
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Logger'ı oluştur — kökte format yok; konsol sadece seviye + mesaj (sonda JSON timestamp olmaz)
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message }) => `${level}: ${message}`)
            ),
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: logFormat,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: logFormat,
        }),
    ],
});

// Geliştirme ortamında daha detaylı log
if (process.env.NODE_ENV !== 'production') {
    logger.debug('Loglama başlatıldı');
}

module.exports = { logger }; 