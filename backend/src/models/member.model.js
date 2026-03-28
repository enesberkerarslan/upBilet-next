const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const addressSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  neighborhood: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  }
}, { timestamps: true });

const bankAccountSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true
  },
  accountHolder: {
    type: String,
    required: true
  },
  iban: {
    type: String,
    required: true
  },
  swiftCode: {
    type: String
  }
}, { timestamps: true });

const paymentPeriodSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  sales: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  }],
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paidAt: {
    type: Date,
    default: null
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Adalanı zorunludur'],
    trim: true
  },
  surname: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'E-posta alanı zorunludur'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Lütfen geçerli bir e-posta adresi girin']
  },
  role: {
    type: String,
    enum: ['user','broker'],
    default: 'user'
  },
  birthDate: {
    type: Date,
    default: null,
    set: function(v) {
      if (!v) return null;
      const date = new Date(v);
      return isNaN(date.getTime()) ? null : date;
    },
    validate: {
      validator: function(v) {
        if (!v) return true;
        return v instanceof Date && !isNaN(v.getTime());
      },
      message: 'Geçerli bir tarih giriniz'
    }
  },
  identityNumber: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    default: 'Türkiye'
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    default: 'male'
  },
  passoligEmail: {
    type: String,
    trim: true
  },
  passoligPassword: {
    type: String,
    trim: true
  },
  
  password: {
    type: String,
    required: [true, 'Şifre alanı zorunludur'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  addresses: [addressSchema],
  bankAccounts: [bankAccountSchema],
  paymentPeriods: [paymentPeriodSchema],
  favorites: {
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    tags:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }]
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Şifre hashleme middleware
memberSchema.pre('save', async function(next) {
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
memberSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// JWT token oluştur
memberSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
      { id: this._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '365d' }
  );
};
const Member = mongoose.model('Member', memberSchema);

module.exports = Member; 