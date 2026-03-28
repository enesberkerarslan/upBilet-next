require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/error');
const { logger } = require('./utils/logger');
const { createAdminUser, seedDemoMemberAndListing } = require('./utils/seed');
const passport = require('./config/passport');

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

/** Sunucunun yerel saati (24 saat, HH:mm:ss) */
morgan.token('local-time', () =>
  new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
);
app.use(
  morgan(
    ':local-time ":method :url HTTP/:http-version" ":user-agent"',
    { stream: { write: (message) => logger.info(message.trim()) } }
  )
);
app.use(passport.initialize());

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
app.use('/api/support', adminSupportRoutes);


app.use('/api/user', userRoutes);
app.use('/api/user/addresses', memberAddressRoutes);
app.use('/api/user/bank-accounts', memberBankAccountRoutes);
app.use('/api/user/profile', memberProfileRoutes);
app.use('/api/user/social', socialRoutes);
app.use('/api/user/listings', memberListingRoutes);
app.use('/api/user/sales', memberSaleRoutes);
app.use('/api/user/support', memberSupportRoutes);


app.use('/api/public/events', publicEventRoutes);
app.use('/api/public/homepage', publicHomepageRoutes);
app.use('/api/public/blogs', publicBlogRoutes);
app.use('/api/public/tags', publicTagRoutes);
app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.use('/api', healthCheckRoutes);



// Error handling
app.use(errorHandler);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB bağlantısı başarılı');
    await createAdminUser();
    await seedDemoMemberAndListing();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server ${PORT} portunda çalışıyor..`);
    });
  })
  .catch((err) => console.error('MongoDB bağlantı hatası:', err));

module.exports = app; 