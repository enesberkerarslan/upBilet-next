require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/error');
const { logger } = require('./utils/logger');
const { createAdminUser, seedDemoMemberAndListing } = require('./utils/seed');
const passport = require('./config/passport');
const redisClient = require('./config/redis');
require('./config/database');

// Admin Routers
const authRoutes = require('./routes/admin/auth.router');
const tagRoutes = require('./routes/admin/tag.router');
const eventRoutes = require('./routes/admin/event.router');
const memberRoutes = require('./routes/admin/member.router');
const listingRoutes = require('./routes/admin/listings.router');
const blogRoutes = require('./routes/admin/blog.router');
const venueStructureRoutes = require('./routes/admin/venueStructure.router');
const mediaRoutes = require('./routes/admin/media.routes');
const saleRoutes = require('./routes/admin/sale.router');
const adminHomepageRoutes = require('./routes/admin/homepage.router');

// Member Routers
const userRoutes = require('./routes/member/member.routes');
const socialRoutes = require('./routes/member/social.routes');
const memberAddressRoutes = require('./routes/member/memberAddress.routes');
const memberBankAccountRoutes = require('./routes/member/memberBankAccount.routes');
const memberProfileRoutes = require('./routes/member/memberProfile.routes');
const memberListingRoutes = require('./routes/member/memberListing.routes');
const memberSaleRoutes = require('./routes/member/memberSale.routes');
const memberSupportRoutes = require('./routes/member/support.routes');
const adminSupportRoutes = require('./routes/admin/support.router');


// Public Routers
const publicEventRoutes = require('./routes/public/publicEvent.routes');
const publicHomepageRoutes = require('./routes/public/homepage.routes');
const publicBlogRoutes = require('./routes/public/blog.routes');
const publicTagRoutes = require('./routes/public/tag.routes');

const paymentRoutes = require('./routes/payment.routes');
const healthCheckRoutes = require('../health-check');

const app = express();


// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(passport.initialize());


// Swagger konfigürasyonu
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Upbilet API',
      version: '1.0.0',
      description: 'Upbilet REST API Documentation',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3002}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Admin JWT token. Login: POST /api/auth/login',
        },
        memberBearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Member JWT token. Login: POST /api/user/login',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Admin kimlik doğrulama' },
      { name: 'Events', description: 'Etkinlik yönetimi (Admin)' },
      { name: 'Tags', description: 'Tag yönetimi (Admin)' },
      { name: 'Listings (Admin)', description: 'İlan yönetimi (Admin)' },
      { name: 'Sales (Admin)', description: 'Satış yönetimi (Admin)' },
      { name: 'Members (Admin)', description: 'Üye yönetimi (Admin)' },
      { name: 'Blogs (Admin)', description: 'Blog yönetimi (Admin)' },
      { name: 'Venue Structures', description: 'Mekan yapısı yönetimi (Admin)' },
      { name: 'Media', description: 'Medya yönetimi (Admin)' },
      { name: 'Homepage (Admin)', description: 'Ana sayfa yönetimi (Admin)' },
      { name: 'Member Auth', description: 'Üye kayıt ve giriş' },
      { name: 'Member Profile', description: 'Üye profil işlemleri' },
      { name: 'Member Listings', description: 'Üye ilan işlemleri' },
      { name: 'Member Sales', description: 'Üye satış işlemleri' },
      { name: 'Member Addresses', description: 'Üye adres işlemleri' },
      { name: 'Member Bank Accounts', description: 'Üye banka hesabı işlemleri' },
      { name: 'Public Events', description: 'Halka açık etkinlik endpoint\'leri' },
      { name: 'Public Blogs', description: 'Halka açık blog endpoint\'leri' },
      { name: 'Public Tags', description: 'Halka açık tag endpoint\'leri' },
      { name: 'Public Homepage', description: 'Halka açık ana sayfa endpoint\'leri' },
      { name: 'Health', description: 'Sağlık kontrolü' },
    ],
  },
  apis: [
    './src/routes/admin/*.js',
    './src/routes/member/*.js',
    './src/routes/public/*.js',
    './src/routes/*.js',
    '../health-check.js',
  ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/venue-structures', venueStructureRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/homepage', adminHomepageRoutes);


app.use('/api/user', userRoutes);
app.use('/api/user/addresses', memberAddressRoutes);
app.use('/api/user/bank-accounts', memberBankAccountRoutes);
app.use('/api/user/profile', memberProfileRoutes);
app.use('/api/user/social', socialRoutes);
app.use('/api/user/listings', memberListingRoutes);
app.use('/api/user/sales', memberSaleRoutes);
app.use('/api/user/support', memberSupportRoutes);

app.use('/api/support', adminSupportRoutes);

app.use('/api/public/events', publicEventRoutes);
app.use('/api/public/homepage', publicHomepageRoutes);
app.use('/api/public/blogs', publicBlogRoutes);
app.use('/api/public/tags', publicTagRoutes);

app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.use('/api', healthCheckRoutes);



// Error handling
app.use(errorHandler);

console.log(process.env.MONGODB_URI);
// MongoDB bağlantısı + idempotent seed (admin, demo üye/ilan)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB bağlantısı başarılı');
    await createAdminUser();
    await seedDemoMemberAndListing();
  })
  .catch((err) => console.error('MongoDB bağlantı hatası:', err));

// Redis bağlantısı
async function startServer() {
  try {
    await redisClient.connect();
    console.log('Redis bağlantısı başarılı');
    
    // Server'ı başlat
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server ${PORT} portunda çalışıyor..`);
    });
  } catch (error) {
    console.error('Redis bağlantı hatası:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; 