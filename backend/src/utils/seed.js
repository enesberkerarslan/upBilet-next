const User = require('../models/user.model');
const Member = require('../models/member.model');
const Event = require('../models/event.model');
const Listing = require('../models/listings.model');
const { logger } = require('./logger');

/** Member şeması e-posta TLD’sini 2–3 karakter bekler; .test vb. geçmez. */
const SEED_SELLER_EMAIL = 'seed.seller@example.com';
/** Test satışı gibi akışlarda alıcı seçmek için (satıcı listeden çıkarılır). */
const SEED_BUYER_EMAIL = 'seed.buyer@example.com';
const SEED_SELLER_PASSWORD = '123456';

const createAdminUser = async () => {
    try {
        const existing = await User.findOne({ email: 'admin@upbilet.com' });
        if (existing) {
            logger.info('Admin kullanıcısı zaten mevcut, atlanıyor.');
            return;
        }

        const admin = await User.create({
            fullName: 'Admin User',
            email: 'admin@upbilet.com',
            password: '123456',
            role: 'admin',
            status: 'active'
        });

        logger.info(`Admin kullanıcısı oluşturuldu: ${admin.email}`);
    } catch (error) {
        logger.error('Admin kullanıcısı oluşturulurken hata:', error);
    }
};

/**
 * Test / geliştirme: seed.seller (satıcı), seed.buyer (test alıcı) ve (varsa) etkinliğe bağlı örnek ilan.
 * Tekrar çalıştırılabilir; kayıtlar varsa atlanır.
 */
const seedDemoMemberAndListing = async () => {
    try {
        let member = await Member.findOne({ email: SEED_SELLER_EMAIL });
        if (!member) {
            member = await Member.create({
                name: 'Seed',
                surname: 'Satıcı',
                email: SEED_SELLER_EMAIL,
                password: SEED_SELLER_PASSWORD,
                phone: '5550000000',
                status: 'active',
                role: 'user',
            });
            logger.info(`Seed üye oluşturuldu: ${member.email} (şifre: ${SEED_SELLER_PASSWORD})`);
        } else {
            logger.info('Seed satıcı üye zaten mevcut, atlanıyor.');
        }

        const existingBuyer = await Member.findOne({ email: SEED_BUYER_EMAIL });
        if (!existingBuyer) {
            await Member.create({
                name: 'Seed',
                surname: 'Alıcı',
                email: SEED_BUYER_EMAIL,
                password: SEED_SELLER_PASSWORD,
                phone: '5550000001',
                status: 'active',
                role: 'user',
            });
            logger.info(`Seed alıcı üye oluşturuldu: ${SEED_BUYER_EMAIL} (şifre: ${SEED_SELLER_PASSWORD})`);
        } else {
            logger.info('Seed alıcı üye zaten mevcut, atlanıyor.');
        }

        let event = await Event.findOne({ status: 'active' }).sort({ createdAt: 1 });
        if (!event) {
            event = await Event.findOne().sort({ createdAt: 1 });
        }

        if (!event) {
            const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
            if (!admin) {
                logger.warn('Seed ilan: veritabanında etkinlik ve admin yok; ilan oluşturulamadı.');
                return;
            }
            event = await Event.create({
                name: 'Seed Demo Etkinlik',
                date: new Date(Date.now() + 30 * 86400000),
                location: 'Test Salonu, İstanbul',
                description: 'Otomatik seed etkinliği (geliştirme).',
                status: 'active',
                createdBy: admin._id,
            });
            logger.info(`Seed etkinlik oluşturuldu: ${event.name} (${event._id})`);
        }

        const existingListing = await Listing.findOne({
            memberId: member._id,
            eventId: event._id,
        });
        if (existingListing) {
            logger.info('Seed ilan zaten mevcut, atlanıyor.');
            return;
        }

        await Listing.create({
            eventId: event._id,
            memberId: member._id,
            price: 100,
            sellerAmount: 80,
            ticketType: 'e-ticket',
            quantity: 10,
            soldQuantity: 0,
            category: 'Genel',
            status: 'active',
        });
        logger.info('Seed ilan oluşturuldu (satıcı: seed.seller, test alıcı: seed.buyer).');

    } catch (error) {
        logger.error('Seed üye/ilan oluşturulurken hata:', error);
    }
};

module.exports = { createAdminUser, seedDemoMemberAndListing };
