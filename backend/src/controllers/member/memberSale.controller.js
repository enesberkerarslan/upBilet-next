const memberSaleService = require('../../services/member/memberSale.service');

class MemberSaleController {
  async createSale(req, res) {
    try {
      const saleData = {
        ...req.body,
        memberId: req.member._id // Token'dan gelen member ID'sini kullan
      };
      const sale = await memberSaleService.createSale(saleData);
      res.status(201).json({
        success: true,
        data: sale
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSaleById(req, res) {
    try {
      const { id } = req.params;
      const sale = await memberSaleService.getSaleById(id);

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: 'Satış bulunamadı',
        });
      }
      const mid = req.member._id.toString();
      const buyerId = sale.buyer?._id?.toString?.() ?? sale.buyer?.toString?.();
      const sellerId = sale.seller?._id?.toString?.() ?? sale.seller?.toString?.();
      const isBuyer = buyerId === mid;
      const isSeller = sellerId === mid;
      if (!isBuyer && !isSeller) {
        return res.status(404).json({
          success: false,
          message: 'Satış bulunamadı veya bu satışa erişim izniniz yok',
        });
      }

      let data = sale;
      if (isSeller && !isBuyer) {
        const o = sale.toObject ? sale.toObject({ virtuals: true }) : { ...sale };
        delete o.billingInfo;
        delete o.stripePayment;
        delete o.transactionId;
        data = o;
      }

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSalesByMemberId(req, res) {
    try {
      // Token'dan gelen member ID'sini kullan
      const sales = await memberSaleService.getSalesByMemberId(req.member._id);
      res.status(200).json({
        success: true,
        data: sales
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSalesBySellerId(req, res) {
    try {
      // Token'dan gelen member ID'sini kullan
      const sales = await memberSaleService.getSalesBySellerId(req.member._id);
      res.status(200).json({
        success: true,
        data: sales
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async uploadSellerProof(req, res) {
    try {
      const { id, ticketIndex } = req.params;
      const sale = await memberSaleService.appendSellerProofToTicketHolder(
        id,
        req.member._id,
        ticketIndex,
        req.files || []
      );
      res.status(200).json({
        success: true,
        data: sale,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateSaleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Önce satışı kontrol et
      const sale = await memberSaleService.getSaleById(id);
      if (!sale || sale.buyer.toString() !== req.member._id.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Satış bulunamadı veya bu satışı güncelleme izniniz yok'
        });
      }

      const updatedSale = await memberSaleService.updateSaleStatus(id, status);
      res.status(200).json({
        success: true,
        data: updatedSale
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new MemberSaleController(); 