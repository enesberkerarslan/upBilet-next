const Sale = require('../../models/sale.model');
const Listing = require('../../models/listings.model');
const Member = require('../../models/member.model');
const Event = require('../../models/event.model');
const { persistSupportAttachments } = require('../../utils/supportAttachments');
const { logger } = require('../../utils/logger');
const { sendPurchaseConfirmationEmail } = require('../../utils/resend-mail');

/** Bilet (ticketHolder) başına toplam kanıt; tek istekte yalnızca 1 dosya */
const MAX_SELLER_PROOF_PER_TICKET = 5;
const MAX_SELLER_PROOF_PER_REQUEST = 1;

const SELLER_PROOF_ALLOWED_STATUS = new Set([
  'pending_approval',
  'approved',
  'active',
  'completed',
]);

class MemberSaleService {
  async createSale(saleData) {
    try {
      // Önce listing'i bul ve seller bilgisini al
      const listing = await Listing.findById(saleData.listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }


      if (!listing.memberId) {
        throw new Error('Member information not found in listing');
      }

      // BURDA LİSTİNG PRİCE * QUANTITY YAPARAK SATICI TUTARINI BULUYORUZ AMA DBYE EKLEME YAPCAZ..
      const sellerTotalAmount = saleData.sellerAmount * saleData.quantity;
      // Quantity kadar boş ticket holder oluştur
      const emptyTicketHolders = Array(saleData.quantity).fill().map(() => ({
        identity: 'TEMP', // Geçici değerler
        identityNumber: 'TEMP',
        passoligEmail: 'TEMP',
        passoligPassword: 'TEMP',
        proofPhotos: [],
        sellerProofAttachments: [],
      }));

      const sale = new Sale({
        eventId: saleData.eventId,
        listingId: saleData.listingId,
        seller: listing.memberId, // Listing'den gelen memberId'yi seller olarak kullan
        buyer: saleData.memberId, // Frontend'den gelen memberId'yi buyer olarak kullan
        ticketQuantity: saleData.quantity,
        unitPrice: saleData.price,
        category: saleData.category,
        block: saleData.block,
        row: saleData.row,
        seat: saleData.seat,
        ticketHolders: saleData.ticketHolders || emptyTicketHolders,

        sellerAmount: saleData.sellerAmount,
        sellerTotalAmount: sellerTotalAmount,

        listingPrice: saleData.listingPrice,
        serviceFee: saleData.serviceFee,
        serviceFeeKdv: saleData.serviceFeeKdv,
        totalAmount: saleData.totalPrice,

        paymentStatus: saleData.paymentStatus,
        paymentMethod: saleData.paymentMethod,
        stripePayment: {
          ...saleData.stripePayment,
          paymentCurrency: saleData.stripePayment.paymentCurrency.toUpperCase()
        },
        transactionId: saleData.transactionId,
        billingInfo: saleData.billingInfo
      });


      await sale.save();

      const payOk =
        String(sale.paymentStatus || saleData.paymentStatus || '')
          .toLowerCase() === 'completed';
      if (payOk) {
        try {
          const buyer = await Member.findById(saleData.memberId)
            .select('email name surname')
            .lean();
          if (buyer?.email) {
            let eventName = '';
            if (saleData.eventName && String(saleData.eventName).trim()) {
              eventName = String(saleData.eventName).trim();
            } else {
              const ev = await Event.findById(sale.eventId).select('name').lean();
              eventName = ev?.name ? String(ev.name) : '';
            }
            const currency = (sale.stripePayment?.paymentCurrency || 'TRY').toUpperCase();
            const mailResult = await sendPurchaseConfirmationEmail({
              to: buyer.email,
              name: buyer.name,
              surname: buyer.surname,
              referenceCode: sale.referenceCode,
              eventName,
              ticketQuantity: sale.ticketQuantity,
              totalAmount: sale.totalAmount,
              currency,
            });
            if (!mailResult.ok && !mailResult.skipped) {
              logger.error(
                'Satın alma onay e-postası gönderilemedi (ref: %s)',
                sale.referenceCode || sale._id
              );
            }
          }
        } catch (e) {
          logger.error('Satın alma onay e-postası hatası: %s', e.message);
        }
      }

      return sale;
    } catch (error) {
      throw new Error(`Error creating sale: ${error.message}`);
    }
  }

  async getSaleById(id) {
    try {
      const sale = await Sale.findById(id)
        .populate('eventId')
        .populate('listingId')
        .populate('seller')
        .populate('buyer');
      return sale;
    } catch (error) {
      throw new Error(`Error fetching sale: ${error.message}`);
    }
  }

  async getSalesByMemberId(memberId) {
    try {
      const sales = await Sale.find({ buyer: memberId })
        .sort({ saleDate: -1 })
        .select('saleDate status totalAmount serviceFee serviceFeeKdv listingPrice ticketHolders ticketQuantity eventId _id category block row seat referenceCode')
        .populate({
          path: 'eventId',
          select: 'name date location tags',
          populate: {
            path: 'tags',
            select: 'name tag' // tags'ın name alanını getir
          }
        });
      return sales;
    } catch (error) {
      throw new Error(`Error fetching member sales: ${error.message}`);
    }
  }

  async appendSellerProofToTicketHolder(saleId, sellerMemberId, ticketIndexRaw, files) {
    const idxStr = String(ticketIndexRaw ?? '').trim();
    if (!/^\d+$/.test(idxStr)) {
      throw new Error('Geçersiz bilet sırası');
    }
    const ticketIndex = parseInt(idxStr, 10);
    const sale = await Sale.findById(saleId);
    if (!sale) throw new Error('Satış bulunamadı');
    if (sale.seller.toString() !== sellerMemberId.toString()) {
      throw new Error('Bu satış için kanıt yükleme yetkiniz yok');
    }
    if (!SELLER_PROOF_ALLOWED_STATUS.has(sale.status)) {
      throw new Error('Bu satış durumunda kanıt yüklenemez');
    }
    if (!sale.ticketHolders?.[ticketIndex]) {
      throw new Error('Bilet bulunamadı');
    }
    const holder = sale.ticketHolders[ticketIndex];
    const current = holder.sellerProofAttachments?.length || 0;
    const incoming = files?.length || 0;
    if (incoming === 0) throw new Error('En az bir dosya seçin');
    if (incoming > MAX_SELLER_PROOF_PER_REQUEST) {
      throw new Error(`Tek seferde en fazla ${MAX_SELLER_PROOF_PER_REQUEST} dosya yükleyebilirsiniz`);
    }
    if (current + incoming > MAX_SELLER_PROOF_PER_TICKET) {
      throw new Error(`Bu bilet için toplam en fazla ${MAX_SELLER_PROOF_PER_TICKET} kanıt dosyası eklenebilir`);
    }
    const uploaded = await persistSupportAttachments(files, 'sale-seller-proof');
    if (!holder.sellerProofAttachments) holder.sellerProofAttachments = [];
    holder.sellerProofAttachments.push(...uploaded);
    sale.markModified('ticketHolders');
    await sale.save();
    return sale;
  }

  async getSalesBySellerId(sellerId) {
    try {
      const sales = await Sale.find({
        seller: sellerId,
        status: { $nin: ['rejected', 'cancelled','pending_approval'] },
      })
        .sort({ saleDate: -1 })
        .select(
          'saleDate sellerAmount sellerTotalAmount ticketQuantity ticketHolders eventId _id status category block row seat referenceCode listingPrice serviceFee serviceFeeKdv totalAmount'
        )
        .populate({
          path: 'eventId',
          select: 'name date location tags',
          populate: {
            path: 'tags',
            select: 'name tag'
          }
        });
      return sales;
    } catch (error) {
      console.error("Error in getSalesBySellerId:", error);
      throw new Error(`Error fetching seller sales: ${error.message}`);
    }
  }

  async updateSaleStatus(id, status) {
    try {
      const sale = await Sale.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      
   
      
      return sale;
    } catch (error) {
      throw new Error(`Error updating sale status: ${error.message}`);
    }
  }
}

module.exports = new MemberSaleService(); 