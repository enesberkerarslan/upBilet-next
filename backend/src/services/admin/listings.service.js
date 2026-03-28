const mongoose = require('mongoose');
const Listing = require('../../models/listings.model');
const Event = require('../../models/event.model');
const ApiError = require('../../utils/api.error');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');
const Member = require('../../models/member.model');
const { ensureReferenceCodeIfMissing } = require('../../utils/referenceCode');


class ListingService {
    /**
     * Admin panel: etkinlik için ilan oluştur (satıcı üye seçilir).
     */
    async createAdminListing(data) {
        const {
            eventId,
            memberId,
            price,
            sellerAmount,
            ticketType,
            quantity,
            category,
            block,
            row,
            seat,
            status,
            soldQuantity,
        } = data;

        if (!eventId || !memberId) {
            throw new Error('eventId ve memberId zorunludur');
        }
        if (price == null || sellerAmount == null || !ticketType || quantity == null || !category) {
            throw new Error('price, sellerAmount, ticketType, quantity ve category zorunludur');
        }

        const event = await Event.findById(eventId);
        if (!event) {
            throw new Error('Etkinlik bulunamadı');
        }
        const member = await Member.findById(memberId);
        if (!member) {
            throw new Error('Üye (satıcı) bulunamadı');
        }

        const allowedStatus = ['pending', 'rejected', 'active', 'inactive'];
        const st = allowedStatus.includes(status) ? status : 'active';

        const listing = new Listing({
            eventId,
            memberId,
            price: Number(price),
            sellerAmount: Number(sellerAmount),
            ticketType,
            quantity: Number(quantity),
            soldQuantity: soldQuantity != null ? Math.max(0, Number(soldQuantity)) : 0,
            category: String(category).trim(),
            block: block ? String(block).trim() : undefined,
            row: row ? String(row).trim() : undefined,
            seat: seat ? String(seat).trim() : undefined,
            status: st,
        });

        return await listing.save();
    }

    // Create a new listing
    async createListing(listingData, token) {
        try {
            console.log("token", token);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;
            console.log("userId", userId);

            const user = await User.findById(userId);
            
            if (!user) {
                console.log("user not found");
                throw new ApiError(404, 'User not found');
            }
            
            const listing = new Listing({
                ...listingData,
                userId
            });
            const savedListing = await listing.save();
            return savedListing;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new Error(`Error creating listing: ${error.message}`);
        }
    }

    // Get all listigs
    async getAllListings(query = {}) {
        try {
            return await Listing.find(query)
                .select('eventId userId memberId price sellerAmount ticketType quantity soldQuantity category block row seat status createdAt updatedAt referenceCode')
                .populate({ path: 'eventId', select: 'name date location commission' })
                .sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching listings: ${error.message}`);
        }
    } 

    // Get listing by ID
    async getListingById(id) {
        try {
            const listing = await Listing.findById(id)
                .select('eventId userId memberId price sellerAmount ticketType quantity soldQuantity category block row seat status createdAt updatedAt referenceCode');
            if (!listing) {
                throw new Error('Listing not found');
            }
            await ensureReferenceCodeIfMissing(listing);
            return listing;
        } catch (error) {
            throw new Error(`Error fetching listing: ${error.message}`);
        }
    }

    // Update listing
    async updateListing(id, updateData) {
        try {
            let listing = await Listing.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            )
            .select('eventId userId memberId price sellerAmount ticketType quantity soldQuantity category block row seat status createdAt updatedAt referenceCode');

            if (!listing) {
                throw new Error('Listing not found');
            }
            await ensureReferenceCodeIfMissing(listing);
            return listing;
        } catch (error) {
            throw new Error(`Error updating listing: ${error.message}`);
        }
    }

    // Delete listing
    async deleteListing(id) {
        try {
            const listing = await Listing.findById(id);
            if (!listing) {
                throw new Error('Listing not found');
            }
            const sold = Number(listing.soldQuantity) || 0;
            if (sold > 0) {
                throw new Error(
                    `Bu ilanda ${sold} adet satılmış bilet kaydı var; ilan silinemez.`
                );
            }
            await listing.deleteOne();
            return listing;
        } catch (error) {
            if (
                error.message === 'Listing not found' ||
                (typeof error.message === 'string' && error.message.includes('silinemez'))
            ) {
                throw error;
            }
            throw new Error(`Error deleting listing: ${error.message}`);
        }
    }

    // Update sold tickets count
    async updateSoldTickets(id, quantity) {
        try {
            const listing = await Listing.findById(id);
            if (!listing) {
                throw new Error('Listing not found');
            }

            // Check if there are enough tickets available
            if (listing.quantity - listing.soldTickets < quantity) {
                throw new Error('Not enough tickets available');
            }

            listing.soldTickets += quantity;
            
            // If all tickets are sold, update status to inactive
            if (listing.soldTickets >= listing.quantity) {
                listing.status = 'inactive';
            }

            return await listing.save();
        } catch (error) {
            throw new Error(`Error updating sold tickets: ${error.message}`);
        }
    }

    // Get listings by event ID
    async getListingsByEventId(eventId) {
        try {
            return await Listing.find({ eventId })
                .select('eventId userId memberId price sellerAmount ticketType quantity soldQuantity category block row seat status createdAt updatedAt referenceCode')
                .sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching event listings: ${error.message}`);
        }
    }

    // Search listings
    async searchListings(searchQuery) {
        try {
            return await Listing.find(
                { $text: { $search: searchQuery } },
                { score: { $meta: "textScore" } }
            )
            .select('eventId userId memberId price sellerAmount ticketType quantity soldQuantity category block row seat status createdAt updatedAt referenceCode')
            .sort({ score: { $meta: "textScore" } });
        } catch (error) {
            throw new Error(`Error searching listings: ${error.message}`);
        }
    }

    // Toggle listing status
    async toggleListingStatus(id) {
        try {
            const listing = await Listing.findById(id);
            if (!listing) {
                throw new Error('Listing not found');
            }
            // Toggle status between active and inactive
            listing.status = listing.status === 'active' ? 'inactive' : 'active';
            
            
            return await listing.save();
        } catch (error) {
            throw new Error(`Error toggling listing status: ${error.message}`);
        }
    }

    /**
     * Admin: bir üyenin belirli etkinlikteki ilanlarını toplu aktif/pasif yap.
     * Yayınla: pending + inactive → active. Durdur: yalnızca active → inactive.
     */
    async toggleAllListingsByMemberEvent(memberId, eventId, targetStatus) {
        if (!mongoose.Types.ObjectId.isValid(memberId) || !mongoose.Types.ObjectId.isValid(eventId)) {
            throw new Error('Geçersiz üye veya etkinlik kimliği');
        }
        if (!['active', 'inactive'].includes(targetStatus)) {
            throw new Error('Durum active veya inactive olmalıdır');
        }
        const filter = { memberId, eventId };
        if (targetStatus === 'active') {
            filter.status = { $in: ['pending', 'inactive'] };
        } else {
            filter.status = 'active';
        }
        const result = await Listing.updateMany(filter, { $set: { status: targetStatus } });
        return { modifiedCount: result.modifiedCount };
    }
}

module.exports = new ListingService(); 