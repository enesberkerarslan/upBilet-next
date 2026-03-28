const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/** Satıcının yüklediği bilet kanıtı (fotoğraf / PDF) — her ticketHolder için ayrı */
const sellerProofAttachmentSchema = new Schema({
    url: { type: String, required: true },
    fileKey: { type: String, default: '' },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    kind: { type: String, enum: ['image', 'pdf'], default: 'image' },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const ticketHolderSchema = new Schema({
    
    name: {
        type: String,
        required: false
    },
    surname: {
        type: String,
        required: false
    },
    nationality: {
        type: String,
        required: false
    },
    identityNumber: {
        type: String,
        required: false
    },
    passoligEmail: {
        type: String,
        required: false
    },
    passoligPassword: {
        type: String,
        required: false
    },
    deliveryStatus: {
        type: String,
        enum: ['pending', 'delivered', 'failed'],
        default: 'pending'
    },
    deliveredAt: Date,
    
    sellerProofAttachments: {
        type: [sellerProofAttachmentSchema],
        default: [],
        validate: {
            validator(arr) {
                return !arr || arr.length <= 5;
            },
            message: 'Bilet başına en fazla 5 satıcı kanıt dosyası eklenebilir',
        },
    },
}, { _id: false });

const billingInfoSchema = new Schema({
    city: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true }
}, { _id: false });

const saleSchema = new Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    listingId: {
        type: Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    ticketQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    category: {
        type: String,
        required: true
    },
    block: {   
        type: String,
    },
    row: {
        type: String,
    },  
    seat: {
        type: String,
    },
    ticketHolders: [{
        type: ticketHolderSchema,
        required: false
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    serviceFee: {
        type: Number,
        required: true,
        min: 0
    },
    serviceFeeKdv: {
        type: Number,
        required: true,
        min: 0
    },
    listingPrice: {
        type: Number,
        required: true,
        min: 0
    },
    sellerAmount: {
        type: Number,
        required: true,
        min: 0
    },
    sellerTotalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        required: true
    },
    stripePayment: {
        paymentIntentId: String,
        clientSecret: String,
        sessionId: String,
        paymentMethodId: String,
        paymentCurrency: {
            type: String,
            enum: ['TRY', 'USD', 'EUR'],
            default: 'TRY',
        },
        paymentStatus: {
            type: String,
            enum: ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled', 'failed'],
            default: 'requires_payment_method'
        },
        lastPaymentError: {
            code: String,
            message: String,
            type: String
        }
    },
    transactionId: {
        type: String,
        unique: true
    },
    saleDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'completed', 'pending_approval', 'approved', 'rejected'],
        default: 'pending_approval'
    },
    cancellationInfo: {
        reason: String,
        cancelledAt: Date,
        cancelledBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    refundInfo: {
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        amount: Number,
        processedAt: Date,
        processedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String,
        stripeRefundId: String
    },
    approvalDate: {
        type: Date
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String
    },
    billingInfo: {
        type: billingInfoSchema,
        required: true
    },
    deliveryStatus: {
        type: String,
        enum: ['pending', 'partial', 'delivered', 'failed'],
        default: 'pending'
    },
    deliveredAt: {
        type: Date
    },
    /** Müşteri / destek iletişimi için kısa kod (örn. SAT-B3N8P2Q4) */
    referenceCode: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
    },
}, {
    timestamps: true
});

saleSchema.pre('save', async function assignSaleRef() {
    if (this.referenceCode) return;
    const { assignUniqueSaleCode } = require('../utils/referenceCode');
    this.referenceCode = await assignUniqueSaleCode(this.constructor);
});

// Add indexes for better query performance
saleSchema.index({ eventId: 1 });
saleSchema.index({ listingId: 1 });
saleSchema.index({ seller: 1 });
saleSchema.index({ buyer: 1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ 'refundInfo.status': 1 });
saleSchema.index({ 'stripePayment.paymentIntentId': 1 });
saleSchema.index({ 'stripePayment.sessionId': 1 });

// Validate that ticketHolders array length matches ticketQuantity
saleSchema.pre('save', function (next) {
    if (this.ticketHolders.length !== this.ticketQuantity) {
        return next(new Error('Number of ticket holders must match ticket quantity'));
    }
    next();
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale; 