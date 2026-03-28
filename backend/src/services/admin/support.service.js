const mongoose = require('mongoose');
const SupportTopic = require('../../models/supportTopic.model');
const Member = require('../../models/member.model');
const Sale = require('../../models/sale.model');
const { persistSupportAttachments } = require('../../utils/supportAttachments');

function normalizeBody(body) {
  if (body == null) return '';
  return String(body).trim();
}

function splitTopicAndMessages(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const messages = [...(o.messages || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  delete o.messages;
  return { topic: o, messages };
}

async function assertSaleBelongsToMember(saleId, memberId) {
  if (!saleId) return null;
  if (!mongoose.Types.ObjectId.isValid(saleId)) {
    throw new Error('Geçersiz satış referansı');
  }
  const sale = await Sale.findById(saleId).select('buyer seller');
  if (!sale) throw new Error('Satış bulunamadı');
  const mid = memberId.toString();
  const buyer = sale.buyer?.toString?.() ?? String(sale.buyer);
  const seller = sale.seller?.toString?.() ?? String(sale.seller);
  if (buyer !== mid && seller !== mid) {
    throw new Error('Bu satış seçilen üyeye ait değil');
  }
  return sale._id;
}

class AdminSupportService {
  /**
   * Admin üyeye yeni destek konusu açar; ilk mesaj admin tarafındandır.
   */
  async createTopicForMember(adminUserId, { memberId, subject, body, referenceSaleId }, files) {
    if (!memberId) throw new Error('memberId zorunludur');
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new Error('Geçersiz üye kimliği');
    }
    const member = await Member.findById(memberId).select('_id');
    if (!member) throw new Error('Üye bulunamadı');

    const subj = normalizeBody(subject);
    const text = normalizeBody(body);
    if (!subj) throw new Error('Konu başlığı zorunludur');
    const attachments = await persistSupportAttachments(files || []);
    if (!text && attachments.length === 0) {
      throw new Error('Mesaj metni veya en az bir ek dosya gerekir');
    }

    const refSale = await assertSaleBelongsToMember(referenceSaleId, memberId);

    const topic = await SupportTopic.create({
      memberId,
      subject: subj,
      status: 'open',
      unreadForAdmin: false,
      unreadForMember: true,
      referenceSaleId: refSale,
      messages: [
        {
          body: text,
          fromRole: 'admin',
          fromMemberId: null,
          fromUserId: adminUserId,
          attachments,
        },
      ],
    });

    const message = topic.messages[topic.messages.length - 1];
    const { topic: t } = splitTopicAndMessages(topic);
    return { topic: t, message };
  }

  async listTopics({ status = 'all', page = 1, limit = 30 } = {}) {
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 30));
    const filter = {};
    if (status === 'open' || status === 'closed') {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      SupportTopic.find(filter)
        .sort({ unreadForAdmin: -1, updatedAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .populate('memberId', 'name surname email')
        .populate('referenceSaleId', 'referenceCode')
        .select('-messages')
        .lean(),
      SupportTopic.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) || 1 },
    };
  }

  async getTopicDetail(topicId) {
    if (!mongoose.Types.ObjectId.isValid(topicId)) return null;
    await SupportTopic.updateOne({ _id: topicId }, { $set: { unreadForAdmin: false } });
    const topic = await SupportTopic.findById(topicId)
      .populate('memberId', 'name surname email phone')
      .populate('referenceSaleId', 'referenceCode totalAmount status saleDate buyer seller')
      .populate('messages.fromUserId', 'fullName email')
      .populate('messages.fromMemberId', 'name surname email');
    if (!topic) return null;

    return splitTopicAndMessages(topic);
  }

  async setTopicStatus(topicId, status) {
    if (!['open', 'closed'].includes(status)) {
      throw new Error('Durum open veya closed olmalıdır');
    }
    const topic = await SupportTopic.findByIdAndUpdate(
      topicId,
      { $set: { status } },
      { new: true }
    ).select('-messages');
    if (!topic) throw new Error('Konu bulunamadı');
    return topic;
  }

  async addAdminMessage(topicId, userId, { body }, files) {
    const topic = await SupportTopic.findById(topicId);
    if (!topic) throw new Error('Konu bulunamadı');
    if (topic.status === 'closed') throw new Error('Konu kapalı; önce açın');

    const text = normalizeBody(body);
    const attachments = await persistSupportAttachments(files || []);
    if (!text && attachments.length === 0) {
      throw new Error('Mesaj metni veya en az bir ek dosya gerekir');
    }

    topic.messages.push({
      body: text,
      fromRole: 'admin',
      fromMemberId: null,
      fromUserId: userId,
      attachments,
    });
    topic.unreadForMember = true;
    topic.unreadForAdmin = false;
    await topic.save();

    return topic.messages[topic.messages.length - 1];
  }
}

module.exports = new AdminSupportService();
