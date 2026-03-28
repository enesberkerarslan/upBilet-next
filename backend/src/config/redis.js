const { createClient } = require('redis');
const { logger } = require('../utils/logger');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            this.client = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            logger.error('Redis bağlantısı başarısız oldu');
                            return false;
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            this.client.on('error', (err) => {
                logger.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                logger.info('Redis bağlantısı başarılı');
                this.isConnected = true;
            });

            this.client.on('ready', () => {
                logger.info('Redis hazır');
            });

            this.client.on('end', () => {
                logger.info('Redis bağlantısı sonlandı');
                this.isConnected = false;
            });

            await this.client.connect();
            return this.client;
        } catch (error) {
            logger.error('Redis bağlantı hatası:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    async set(key, value, expireTime = null) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis bağlantısı yok');
            }
            
            if (expireTime) {
                await this.client.setEx(key, expireTime, JSON.stringify(value));
            } else {
                await this.client.set(key, JSON.stringify(value));
            }
        } catch (error) {
            logger.error('Redis set hatası:', error);
            throw error;
        }
    }

    async get(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis bağlantısı yok');
            }
            
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Redis get hatası:', error);
            throw error;
        }
    }

    async del(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis bağlantısı yok');
            }
            
            await this.client.del(key);
        } catch (error) {
            logger.error('Redis del hatası:', error);
            throw error;
        }
    }

    async exists(key) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis bağlantısı yok');
            }
            
            return await this.client.exists(key);
        } catch (error) {
            logger.error('Redis exists hatası:', error);
            throw error;
        }
    }

    async expire(key, seconds) {
        try {
            if (!this.isConnected) {
                throw new Error('Redis bağlantısı yok');
            }
            
            await this.client.expire(key, seconds);
        } catch (error) {
            logger.error('Redis expire hatası:', error);
            throw error;
        }
    }

    async flushAll() {
        try {
            if (!this.isConnected) {
                throw new Error('Redis bağlantısı yok');
            }
            
            await this.client.flushAll();
        } catch (error) {
            logger.error('Redis flushAll hatası:', error);
            throw error;
        }
    }
}

const redisClient = new RedisClient();

module.exports = redisClient;
