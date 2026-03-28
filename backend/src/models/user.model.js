const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Ad soyad alanı zorunludur'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'E-posta alanı zorunludur'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Lütfen geçerli bir e-posta adresi girin']
    },
    password: {
        type: String,
        required: [true, 'Şifre alanı zorunludur'],
        minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Şifre hashleme middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        logger.debug('Şifre karşılaştırma başladı', {
            email: this.email,
            hasPassword: !!this.password
        });
        
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        
        logger.debug('Şifre karşılaştırma sonucu', {
            email: this.email,
            isMatch
        });
        
        return isMatch;
    } catch (error) {
        logger.error('Şifre karşılaştırma hatası', {
            email: this.email,
            error: error.message
        });
        throw error;
    }
};

// JWT token oluştur
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '365d' }
    );
};

// Statik metodlar
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User; 