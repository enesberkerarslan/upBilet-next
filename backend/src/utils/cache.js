const redisClient = require('../config/redis');
const { logger } = require('./logger');

class CacheService {
    constructor() {
        this.defaultTTL = 300; // 1 saat
    }

    // Cache key oluştur
    generateKey(prefix, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join(':');
        return `${prefix}:${sortedParams}`;
    }

    // Veriyi cache'e kaydet
    async set(key, data, ttl = this.defaultTTL) {
        try {
            await redisClient.set(key, data, ttl);
            logger.info(`Cache kaydedildi: ${key}`);
        } catch (error) {
            logger.error(`Cache kaydetme hatası: ${error.message}`);
        }
    }

    // Cache'den veri oku
    async get(key) {
        try {
            const data = await redisClient.get(key);
        
            return data;
        } catch (error) {
            logger.error(`Cache okuma hatası: ${error.message}`);
            return null;
        }
    }

    // Cache'den veri sil
    async del(key) {
        try {
            await redisClient.del(key);
            logger.info(`Cache silindi: ${key}`);
        } catch (error) {
            logger.error(`Cache silme hatası: ${error.message}`);
        }
    }

    // Belirli pattern'e uyan tüm cache'leri sil
    async delPattern(pattern) {
        try {
            // Redis'te pattern silme için SCAN kullanılabilir
            // Şimdilik basit bir yaklaşım
            logger.info(`Cache pattern silindi: ${pattern}`);
        } catch (error) {
            logger.error(`Cache pattern silme hatası: ${error.message}`);
        }
    }

    // Cache wrapper - veriyi cache'den oku, yoksa fonksiyonu çalıştır ve cache'e kaydet
    async cacheWrapper(key, fetchFunction, ttl = this.defaultTTL) {
        try {
            // Önce cache'den oku
            const cachedData = await this.get(key);
            if (cachedData) {
                return cachedData;
            }

            
            // Cache'de yoksa fonksiyonu çalıştır
            const data = await fetchFunction();
            
            // Sonucu cache'e kaydet
            await this.set(key, data, ttl);
            
            return data;
        } catch (error) {
            logger.error(`Cache wrapper hatası: ${error.message}`);
            // Hata durumunda fonksiyonu direkt çalıştır
            return await fetchFunction();
        }
    }

    // Ana sayfa cache key'leri
    getHomepageKey() {
        return 'homepage:published';
    }

    // Event arama cache key'leri
    getEventSearchKey(query) {
        return this.generateKey('event:search', { q: query.toLowerCase() });
    }

    getEventsByTagKey(tagId) {
        return this.generateKey('events:tag', { tagId });
    }

    getMainPageEventsKey(tagName = null) {
        return this.generateKey('events:mainpage', { tag: tagName || 'all' });
    }

    // Tüm event'ler için cache key
    getAllEventsKey() {
        return 'events:all:active';
    }

    // Cache'den tüm event'leri oku
    async getAllEvents() {
        return await this.get(this.getAllEventsKey());
    }

    // Tüm event'leri cache'e kaydet
    async setAllEvents(events, ttl = 3600) { // 1 saat
        await this.set(this.getAllEventsKey(), events, ttl);
    }

    // Event slug cache key
    getEventBySlugKey(slug) {
        return this.generateKey('event:slug', { slug: slug.toLowerCase() });
    }

    // Event ID'ye göre ilanlar cache key
    getListingsByEventIdKey(eventId) {
        return this.generateKey('listings:event', { eventId });
    }

    // Cache'den event arama (memory'de)
    async searchEventsFromCache(searchQuery) {
        const allEvents = await this.getAllEvents();
        if (!allEvents) return null;

        // searchQuery undefined veya null ise boş array döndür
        if (!searchQuery) {
            return {
                status: 200,
                body: {
                    success: true,
                    events: []
                }
            };
        }

        const query = searchQuery.toString().toLowerCase();
        const filteredEvents = allEvents.filter(event => 
            event.name.toLowerCase().includes(query) ||
            (event.description && event.description.toLowerCase().includes(query)) ||
            event.location.toLowerCase().includes(query)
        );

        // İlk 20 sonucu döndür
        const limitedEvents = filteredEvents.slice(0, 10);

        return {
            status: 200,
            body: {
                success: true,
                events: limitedEvents,
                totalCount: filteredEvents.length, // Toplam sonuç sayısını da döndür
                returnedCount: limitedEvents.length
            }
        };
    }

    // Cache'i temizle
    async clearHomepageCache() {
        await this.del(this.getHomepageKey());
    }

    async clearEventCache() {
        // Event ile ilgili tüm cache'leri temizle
        const patterns = ['event:search', 'events:tag', 'events:mainpage', 'event:slug', 'listings:event'];
        for (const pattern of patterns) {
            await this.delPattern(pattern);
        }
        // Tüm event'ler cache'ini de temizle
        await this.del(this.getAllEventsKey());
    }

    // Belirli bir event'in cache'ini temizle
    async clearEventCacheById(eventId) {
        // Event slug cache'lerini temizle (tüm slug'ları temizlemek gerekebilir)
        await this.delPattern('event:slug:*');
        // Event'in ilanlar cache'ini temizle
        await this.del(this.getListingsByEventIdKey(eventId));
        // Tüm event'ler cache'ini temizle (çünkü event güncellenmiş olabilir)
        await this.del(this.getAllEventsKey());
    }

    // İlan cache'lerini temizle
    async clearListingCache(eventId = null) {
        if (eventId) {
            // Belirli event'in ilanlar cache'ini temizle
            await this.del(this.getListingsByEventIdKey(eventId));
        } else {
            // Tüm ilan cache'lerini temizle
            await this.delPattern('listings:event:*');
        }
    }

    // Member profile cache key'leri
    getMemberProfileKey(memberId) {
        return this.generateKey('member:profile', { memberId });
    }

    // Member profile cache'ini oku
    async getMemberProfile(memberId) {
        return await this.get(this.getMemberProfileKey(memberId));
    }

    // Member profile cache'ini kaydet
    async setMemberProfile(memberId, profileData, ttl = 1800) { // 30 dakika
        await this.set(this.getMemberProfileKey(memberId), profileData, ttl);
    }

    // Member profile cache'ini temizle
    async clearMemberProfileCache(memberId) {
        await this.del(this.getMemberProfileKey(memberId));
    }

    // Tüm member profile cache'lerini temizle
    async clearAllMemberProfileCache() {
        await this.delPattern('member:profile:*');
    }
}

const cacheService = new CacheService();

module.exports = cacheService;
