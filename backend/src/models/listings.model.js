const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Event ID is required'],
    },
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Member ID is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    sellerAmount: {
        type: Number,
        required: [true, 'Seller amount is required'],
        min: [0, 'Seller amount cannot be negative']
    },
    ticketType: {
        type: String,
        required: [true, 'Ticket type is required'],
        enum: ['paper', 'pdf', 'e-ticket'],
        default: null
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    soldQuantity: {
        type: Number,
        default: 0,
        min: [0, 'Sold tickets cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    block: {
        type: String,
        trim: true
    },
    row: {
        type: String,
        trim: true
    },
    seat: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'rejected', 'active', 'inactive'],
        default: 'pending'
    },
    /** Müşteri / destek iletişimi için kısa kod (örn. ILN-X7K2MP9Q) */
    referenceCode: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
    },
}, {
    timestamps: true
});

listingSchema.pre('save', async function assignListingRef() {
    if (this.referenceCode) return;
    const { assignUniqueListingCode } = require('../utils/referenceCode');
    this.referenceCode = await assignUniqueListingCode(this.constructor);
});

// Create indexes for better query performance
listingSchema.index({ category: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ eventId: 1 });

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
