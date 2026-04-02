const mongoose = require('mongoose');
const Sale = require('../../models/sale.model');
const Listing = require('../../models/listings.model');
const Member = require('../../models/member.model');
const Event = require('../../models/event.model');
const { persistSupportAttachments } = require('../../utils/supportAttachments');

const DAY_MS = 24 * 60 * 60 * 1000;
const PAYOUT_DELAY_AFTER_EVENT_DAYS = 14;
const PAYOUT_WINDOW_TAIL_DAYS = 7;

function startOfLocalDay(d) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function payoutWindowFromEventDate(eventDate) {
  const eventDay = startOfLocalDay(eventDate);
  if (!eventDay) return null;
  const payoutStart = new Date(eventDay.getTime() + PAYOUT_DELAY_AFTER_EVENT_DAYS * DAY_MS);
  const lastCalendarDay = new Date(payoutStart.getTime() + PAYOUT_WINDOW_TAIL_DAYS * DAY_MS);
  const payoutEnd = endOfLocalDay(lastCalendarDay);
  return { payoutStart, payoutEnd };
}

function periodOverlapsPayout(p, payoutStart, payoutEnd) {
  const ps = new Date(p.startDate);
  const pe = new Date(p.endDate);
  return ps <= payoutEnd && pe >= payoutStart;
}

function periodFullyContainsPayout(p, payoutStart, payoutEnd) {
  const ps = new Date(p.startDate);
  const pe = new Date(p.endDate);
  return ps <= payoutStart && pe >= payoutEnd;
}

const MAX_ADMIN_SELLER_PROOF_PER_TICKET = 5;
const MAX_ADMIN_SELLER_PROOF_PER_REQUEST = 1;

function parseTicketHolderIndexForUpdate(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Geçersiz bilet sırası');
  }
  return n;
}

function normalizeSellerProofAttachments(input) {
  if (!Array.isArray(input)) {
    throw new Error('sellerProofAttachments bir dizi olmalıdır');
  }
  if (input.length > MAX_ADMIN_SELLER_PROOF_PER_TICKET) {
    throw new Error(`Bilet başına en fazla ${MAX_ADMIN_SELLER_PROOF_PER_TICKET} kanıt dosyası`);
  }
  return input.map((rawItem, i) => {
    const o = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem) ? rawItem : {};
    const url = typeof o.url === 'string' ? o.url.trim() : '';
    if (!url) {
      throw new Error(`Kanıt ${i + 1}: geçerli bir url gerekli`);
    }
    let kind = o.kind === 'pdf' ? 'pdf' : 'image';
    const mimeType = typeof o.mimeType === 'string' ? o.mimeType.trim() : '';
    if (mimeType.includes('pdf')) {
      kind = 'pdf';
    }
    if (/\.pdf(\?|$)/i.test(url)) {
      kind = 'pdf';
    }
    let uploadedAt = o.uploadedAt != null ? new Date(o.uploadedAt) : new Date();
    if (Number.isNaN(uploadedAt.getTime())) {
      uploadedAt = new Date();
    }
    return {
      url,
      fileKey: typeof o.fileKey === 'string' ? o.fileKey.trim() : '',
      originalName: typeof o.originalName === 'string' ? o.originalName.trim() : '',
      mimeType,
      kind,
      uploadedAt,
    };
  });
}

class SaleService {
  // Tüm satışları listele
  async getAllSales(filter = {}) {
    return await Sale.find(filter).sort({ saleDate: -1 });
  }

  // Tek bir satışı ID ile getir
  async getSaleById(id) {
    return await Sale.findById(id);
  }

  // Satışın genel teslimat durumunu güncelle
  async updateDeliveryStatus(saleId, deliveryStatus, deliveredAt = null) {
    const update = { deliveryStatus };
    if (deliveryStatus === 'delivered') {
      update.deliveredAt = deliveredAt || new Date();
    } else {
      update.deliveredAt = null;
    }
    return await Sale.findByIdAndUpdate(saleId, update, { new: true });
  }

  // Tekil bilet teslimat durumunu güncelle
  async updateTicketHolderDeliveryStatus(saleId, ticketHolderIndex, deliveryStatus, deliveredAt = null) {
    const sale = await Sale.findById(saleId);
    if (!sale || ticketHolderIndex < 0 || ticketHolderIndex >= sale.ticketHolders.length) {
      throw new Error('Satış veya bilet bulunamadı');
    }
    sale.ticketHolders[ticketHolderIndex].deliveryStatus = deliveryStatus;
    sale.ticketHolders[ticketHolderIndex].deliveredAt = deliveryStatus === 'delivered' ? (deliveredAt || new Date()) : null;
    // Genel teslimat durumunu güncelle
    const allDelivered = sale.ticketHolders.every(t => t.deliveryStatus === 'delivered');
    const anyDelivered = sale.ticketHolders.some(t => t.deliveryStatus === 'delivered');
    if (allDelivered) {
      sale.deliveryStatus = 'delivered';
      sale.deliveredAt = new Date();
    } else if (anyDelivered) {
      sale.deliveryStatus = 'partial';
      sale.deliveredAt = null;
    } else {
      sale.deliveryStatus = 'pending';
      sale.deliveredAt = null;
    }
    // Tüm biletler teslim değilken satış "tamamlandı" kalmasın (yanlış teslim geri alındığında)
    if (sale.status === 'completed' && !allDelivered) {
      sale.status = 'approved';
    }
    await sale.save();
    return sale;
  }

  // Status değerine göre satışları listele
  async getSalesByStatus(status) {
    return await Sale.find({ status }).sort({ saleDate: -1 });
  }

  async updateTicketHolderInfo(saleId, ticketHolderIndex, updateData) {
    const idx = parseTicketHolderIndexForUpdate(ticketHolderIndex);
    const sale = await Sale.findById(saleId);
    if (!sale || !sale.ticketHolders[idx]) {
      throw new Error('Satış veya bilet bulunamadı');
    }
    const allowedFields = ['name', 'surname', 'nationality', 'identityNumber', 'passoligEmail', 'passoligPassword', 'deliveryStatus', 'deliveredAt', 'proofPhotos'];
    for (const key of Object.keys(updateData)) {
      if (key === 'sellerProofAttachments') {
        sale.ticketHolders[idx].sellerProofAttachments = normalizeSellerProofAttachments(updateData[key]);
        continue;
      }
      if (allowedFields.includes(key)) {
        sale.ticketHolders[idx][key] = updateData[key];
      }
    }
    sale.markModified('ticketHolders');
    await sale.save();
    return sale;
  }

  /** Admin: bilet satırına S3 kanıtı ekler (satıcı yükleme limitleri ile aynı) */
  async appendAdminSellerProofToTicketHolder(saleId, ticketIndexRaw, files) {
    const idxStr = String(ticketIndexRaw ?? '').trim();
    if (!/^\d+$/.test(idxStr)) {
      throw new Error('Geçersiz bilet sırası');
    }
    const ticketIndex = parseInt(idxStr, 10);
    const sale = await Sale.findById(saleId);
    if (!sale) throw new Error('Satış bulunamadı');
    if (!sale.ticketHolders?.[ticketIndex]) {
      throw new Error('Bilet bulunamadı');
    }
    const holder = sale.ticketHolders[ticketIndex];
    const current = holder.sellerProofAttachments?.length || 0;
    const incoming = files?.length || 0;
    if (incoming === 0) throw new Error('En az bir dosya seçin');
    if (incoming > MAX_ADMIN_SELLER_PROOF_PER_REQUEST) {
      throw new Error(`Tek seferde en fazla ${MAX_ADMIN_SELLER_PROOF_PER_REQUEST} dosya yükleyebilirsiniz`);
    }
    if (current + incoming > MAX_ADMIN_SELLER_PROOF_PER_TICKET) {
      throw new Error(`Bu bilet için toplam en fazla ${MAX_ADMIN_SELLER_PROOF_PER_TICKET} kanıt dosyası eklenebilir`);
    }
    const uploaded = await persistSupportAttachments(files, 'sale-seller-proof');
    if (!holder.sellerProofAttachments) holder.sellerProofAttachments = [];
    holder.sellerProofAttachments.push(...uploaded);
    sale.markModified('ticketHolders');
    await sale.save();
    return sale;
  }

  async updateAllTicketHolders(saleId, ticketHolders) {
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Satış bulunamadı');
    }
    
    // Ticket holders array'ini güncelle
    sale.ticketHolders = ticketHolders.map(holder => ({
      name: holder.name || '',
      surname: holder.surname || '',
      nationality: holder.nationality || 'Türkiye',
      identityNumber: holder.identityNumber || '',
      passoligEmail: holder.passoligEmail || '',
      passoligPassword: holder.passoligPassword || '',
      deliveryStatus: holder.deliveryStatus || 'pending',
      deliveredAt: holder.deliveredAt || null,
      proofPhotos: holder.proofPhotos || [],
      sellerProofAttachments: holder.sellerProofAttachments || [],
    }));
    
    await sale.save();
    return sale;
  }

  async updatePaymentStatus(saleId, paymentStatus) {
    const sale = await Sale.findById(saleId);

    if (!sale) {
      throw new Error('Satış bulunamadı');
    }

    sale.paymentStatus = paymentStatus; // 'pending', 'completed', 'failed', 'refunded'

    // Satış onayı (status) ayrı: approveSale. Burada sadece ödeme alanı.
    if (paymentStatus === 'failed') {
      sale.status = 'rejected';
    }

    await sale.save();
    return sale;
  }

  async updateSale(saleId, updateData) {
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new Error('Satış bulunamadı');
    }
    
    // Güncellenebilir alanları kontrol et
    const allowedFields = ['seller', 'buyer', 'ticketQuantity', 'totalAmount', 'sellerTotalAmount', 'status', 'paymentStatus', 'deliveryStatus', 'notes'];
    
    for (const key of Object.keys(updateData)) {
      if (allowedFields.includes(key)) {
        sale[key] = updateData[key];
      }
    }
    
    await sale.save();
    return sale;
  }

  _assertCanConfirmDelivery(sale) {
    if (!sale) throw new Error('Satış bulunamadı');
    if (['completed', 'cancelled', 'rejected', 'pending_approval'].includes(sale.status)) {
      if (sale.status === 'pending_approval') {
        throw new Error('Önce satışı onaylayın; teslimat onayı onaylı satışlarda yapılabilir.');
      }
      if (sale.status === 'completed') {
        throw new Error('Satış zaten tamamlandı.');
      }
      throw new Error('Bu satışta teslimat onayı yapılamaz.');
    }
    const n = sale.ticketHolders?.length || 0;
    if (n === 0 && (sale.ticketQuantity || 0) > 0) {
      throw new Error('Bilet sahibi kaydı yok; teslim onayı yapılamıyor.');
    }
  }

  async approveTicket(saleId, ticketIndex) {
    const sale = await Sale.findById(saleId)
      .populate('buyer', 'name email')
      .populate('eventId', 'name date location');

    this._assertCanConfirmDelivery(sale);

    const idx = parseInt(String(ticketIndex), 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= sale.ticketHolders.length) {
      throw new Error('Satış veya bilet bulunamadı');
    }

    // Biletin deliveryStatus'unu delivered yap
    sale.ticketHolders[idx].deliveryStatus = 'delivered';
    sale.ticketHolders[idx].deliveredAt = new Date();

    // Tüm biletler onaylandıysa satış durumunu da güncelle
    const allDelivered = sale.ticketHolders.every(ticket => ticket.deliveryStatus === 'delivered');
    if (allDelivered) {
      sale.deliveryStatus = 'delivered';
      sale.deliveredAt = new Date();
      sale.status = 'completed'; // Satış tamamlandı
    } else {
      // Kısmi teslimat durumu
      const anyDelivered = sale.ticketHolders.some(ticket => ticket.deliveryStatus === 'delivered');
      if (anyDelivered) {
        sale.deliveryStatus = 'partial';
      }
    }

    await sale.save();
    return sale;
  }

  async approveAllTickets(saleId) {
    const sale = await Sale.findById(saleId)
      .populate('buyer', 'name email')
      .populate('eventId', 'name date location');

    this._assertCanConfirmDelivery(sale);

    // Tüm biletleri onayla
    sale.ticketHolders = sale.ticketHolders.map(ticket => ({
      ...ticket,
      deliveryStatus: 'delivered',
      deliveredAt: new Date()
    }));

    // Satış durumunu güncelle
    sale.deliveryStatus = 'delivered';
    sale.deliveredAt = new Date();
    sale.status = 'completed'; // Satış tamamlandı

    await sale.save();

    return sale;
  }

  async _resolveSaleEventDate(sale) {
    if (sale.eventId && typeof sale.eventId === 'object' && sale.eventId.date) {
      return sale.eventId.date;
    }
    const eid = sale.eventId?._id ?? sale.eventId;
    if (!eid) return null;
    const ev = await Event.findById(eid).select('date');
    return ev?.date ?? null;
  }

  /**
   * Etkinlik +14 gün … +14+7 gün ödeme penceresine göre satıcı dönemine ekler (kesişen pending veya yeni dönem).
   */
  async _attachSaleToSellerPayoutPeriod(sale) {
    try {
      const sellerId = sale.seller?._id ?? sale.seller;
      if (!sellerId) return;

      const eventDate = await this._resolveSaleEventDate(sale);
      const window = payoutWindowFromEventDate(eventDate);
      if (!window) {
        console.warn('Satış için etkinlik tarihi yok; ödeme dönemine eklenmedi:', sale._id);
        return;
      }
      const { payoutStart, payoutEnd } = window;

      const member = await Member.findById(sellerId);
      if (!member) return;
      if (!member.paymentPeriods) member.paymentPeriods = [];

      const saleIdStr = sale._id.toString();
      for (const p of member.paymentPeriods) {
        for (const sid of p.sales || []) {
          if (sid.toString() === saleIdStr) return;
        }
      }

      const candidates = member.paymentPeriods.filter(
        (p) => p.status !== 'paid' && periodOverlapsPayout(p, payoutStart, payoutEnd)
      );

      let period;
      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          const fa = periodFullyContainsPayout(a, payoutStart, payoutEnd);
          const fb = periodFullyContainsPayout(b, payoutStart, payoutEnd);
          if (fa !== fb) return fb ? 1 : -1;
          const durA = new Date(a.endDate) - new Date(a.startDate);
          const durB = new Date(b.endDate) - new Date(b.startDate);
          if (durA !== durB) return durA - durB;
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        period = candidates[0];
        period.sales.push(sale._id);
      } else {
        const amt = Math.round((Number(sale.sellerTotalAmount) || 0) * 100) / 100;
        member.paymentPeriods.push({
          startDate: payoutStart,
          endDate: payoutEnd,
          sales: [sale._id],
          totalAmount: amt,
          status: 'pending',
        });
      }

      const target = period ?? member.paymentPeriods[member.paymentPeriods.length - 1];
      const oidList = target.sales.map((id) => id);
      const rows = await Sale.find({ _id: { $in: oidList } }).select('sellerTotalAmount');
      const sum = rows.reduce((acc, s) => acc + (Number(s.sellerTotalAmount) || 0), 0);
      target.totalAmount = Math.round(sum * 100) / 100;

      member.markModified('paymentPeriods');
      await member.save();
    } catch (err) {
      console.error('Satış satıcı ödeme dönemine eklenemedi:', err);
      throw err;
    }
  }

  /** Üye paneli: satışı etkinlik tarihine göre satıcının ödeme dönemine ekler */
  async attachSaleToSellerPayoutPeriodForMember(memberId, saleId) {
    if (!mongoose.Types.ObjectId.isValid(memberId) || !mongoose.Types.ObjectId.isValid(saleId)) {
      throw new Error('Geçersiz kimlik');
    }
    const sale = await Sale.findById(saleId).populate('eventId', 'date name location');
    if (!sale) throw new Error('Satış bulunamadı');
    const sellerRef = sale.seller?.toString?.() ?? String(sale.seller);
    if (sellerRef !== String(memberId)) {
      throw new Error('Bu satış bu üyenin satıcı satışı değil');
    }
    await this._attachSaleToSellerPayoutPeriod(sale);
    const member = await Member.findById(memberId).select('paymentPeriods');
    return {
      message: 'Satış ödeme dönemine eklendi',
      paymentPeriods: member?.paymentPeriods ?? [],
    };
  }

  async approveSale(saleId, adminId) {
    const sale = await Sale.findById(saleId)
      .populate('buyer', 'name email')
      .populate('eventId', 'name date location');

    if (!sale) throw new Error('Satış bulunamadı');
    if (sale.status !== 'pending_approval') throw new Error('Sadece onay bekleyen satışlar onaylanabilir');

    // Panelden "Onayla": para hesaba geldi kabulü — ödeme tamam + satış satıcıya açılır
    sale.paymentStatus = 'completed';
    sale.status = 'approved';
    sale.approvalDate = new Date();
    sale.approvedBy = adminId;

    await sale.save();
    try {
      await this._attachSaleToSellerPayoutPeriod(sale);
    } catch (e) {
      console.error('Onay sonrası ödeme dönemine ekleme hatası:', e);
    }
    return sale;
  }

  async cancelSale(saleId, reason, adminId) {
    const sale = await Sale.findById(saleId);
    if (!sale) throw new Error('Satış bulunamadı');
    if (['cancelled', 'completed'].includes(sale.status)) throw new Error('Bu satış iptal edilemez');

    sale.status = 'cancelled';
    sale.cancellationInfo = { reason, cancelledAt: new Date(), cancelledBy: adminId };
    await sale.save();
    return sale;
  }

  async refundSale(saleId, amount, notes, adminId) {
    const sale = await Sale.findById(saleId);
    if (!sale) throw new Error('Satış bulunamadı');

    sale.refundInfo = {
      status: 'processing',
      amount: amount || sale.totalAmount,
      processedAt: new Date(),
      processedBy: adminId,
      notes
    };
    sale.paymentStatus = 'refunded';
    sale.status = 'cancelled';
    await sale.save();
    return sale;
  }

  async rejectTicket(saleId, ticketIndex) {
    console.log('rejectTicket service çağrıldı:', { saleId, ticketIndex });
    
    const sale = await Sale.findById(saleId);
    if (!sale) {
      console.error('Satış bulunamadı:', saleId);
      throw new Error('Satış bulunamadı');
    }
    
    if (ticketIndex < 0 || ticketIndex >= sale.ticketHolders.length) {
      console.error('Geçersiz ticket index:', { ticketIndex, ticketCount: sale.ticketHolders.length });
      throw new Error('Geçersiz bilet indeksi');
    }

    console.log('Bilet reddediliyor:', {
      saleId,
      ticketIndex,
      currentStatus: sale.ticketHolders[ticketIndex].deliveryStatus
    });

    // Biletin deliveryStatus'unu failed yap
    sale.ticketHolders[ticketIndex].deliveryStatus = 'failed';
    sale.ticketHolders[ticketIndex].deliveredAt = null;

    // Satış durumunu güncelle - sadece deliveryStatus'u failed yap
    sale.deliveryStatus = 'failed';

    await sale.save();
    console.log('Bilet başarıyla reddedildi');
    return sale;
  }

  /** Üyenin satıcı / alıcı olduğu satışlar (admin üye detayı) */
  async getSalesByMemberId(memberId) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new Error('Geçersiz üye kimliği');
    }
    const oid = new mongoose.Types.ObjectId(memberId);
    const populates = (q) =>
      q
        .populate('eventId', 'name date location')
        .populate('listingId', 'category block row seat')
        .populate('seller', 'name surname email')
        .populate('buyer', 'name surname email')
        .sort({ saleDate: -1 });

    const [asSeller, asBuyer] = await Promise.all([
      populates(Sale.find({ seller: oid })),
      populates(Sale.find({ buyer: oid })),
    ]);

    return { asSeller, asBuyer };
  }
}

module.exports = new SaleService();
