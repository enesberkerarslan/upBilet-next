const mongoose = require('mongoose');
const SupportTopic = require('../../models/supportTopic.model');
const Sale = require('../../models/sale.model');
const { persistSupportAttachments } = require('../../utils/supportAttachments');

function normalizeBody(body) {
  if (body == null) return '';
  return String(body).trim();
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
    throw new Error('Bu satışa referans veremezsiniz');
  }
  return sale._id;
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

class MemberSupportService {
  async listTopics(memberId) {
    return SupportTopic.find({ memberId })
      .sort({ updatedAt: -1 })
      .select('subject status unreadForMember referenceSaleId createdAt updatedAt')
      .lean();
  }

  async getTopicDetail(topicId, memberId) {
    await SupportTopic.updateOne({ _id: topicId, memberId }, { $set: { unreadForMember: false } });
    const topic = await SupportTopic.findOne({ _id: topicId, memberId }).populate(
      'referenceSaleId',
      'referenceCode totalAmount status saleDate'
    );
    if (!topic) return null;

    const { topic: t, messages } = splitTopicAndMessages(topic);
    return { topic: t, messages };
  }

  async createTopic(memberId, { subject, body, referenceSaleId }, files) {
    const subj = normalizeBody(subject);
    const text = normalizeBody(body);
    if (!subj) throw new Error('Konu başlığı zorunludur');
    if (!text && (!files || files.length === 0)) {
      throw new Error('Mesaj metni veya en az bir ek dosya gerekir');
    }

    const refSale = await assertSaleBelongsToMember(referenceSaleId, memberId);
    const attachments = await persistSupportAttachments(files || []);

    const topic = await SupportTopic.create({
      memberId,
      subject: subj,
      status: 'open',
      unreadForAdmin: true,
      unreadForMember: false,
      referenceSaleId: refSale,
      messages: [
        {
          body: text,
          fromRole: 'member',
          fromMemberId: memberId,
          fromUserId: null,
          attachments,
        },
      ],
    });

    const message = topic.messages[topic.messages.length - 1];
    const { topic: t } = splitTopicAndMessages(topic);
    return { topic: t, message };
  }

  async addMessage(topicId, memberId, { body }, files) {
    const topic = await SupportTopic.findOne({ _id: topicId, memberId });
    if (!topic) throw new Error('Konu bulunamadı');
    if (topic.status === 'closed') throw new Error('Bu konu kapatılmış; yeni mesaj eklenemez');

    const text = normalizeBody(body);
    const attachments = await persistSupportAttachments(files || []);
    if (!text && attachments.length === 0) {
      throw new Error('Mesaj metni veya en az bir ek dosya gerekir');
    }

    topic.messages.push({
      body: text,
      fromRole: 'member',
      fromMemberId: memberId,
      fromUserId: null,
      attachments,
    });
    topic.unreadForAdmin = true;
    topic.status = 'open';
    await topic.save();

    return topic.messages[topic.messages.length - 1];
  }
}

module.exports = new MemberSupportService();
