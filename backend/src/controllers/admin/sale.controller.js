const saleService = require('../../services/admin/sale.service');

class SaleController {
  async getAllSales(req, res) {
    try {
      const sales = await saleService.getAllSales();
      res.json({ success: true, data: sales });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSaleById(req, res) {
    try {
      const sale = await saleService.getSaleById(req.params.id);
      if (!sale) return res.status(404).json({ success: false, message: 'Satış bulunamadı' });
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSalesByStatus(req, res) {
    try {
      const { status } = req.query;
      const sales = await saleService.getSalesByStatus(status);
      res.json({ success: true, data: sales });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /** Etkinlik ID'sine göre satışlar (admin panel) */
  async getSalesByEvent(req, res) {
    try {
      const { eventId } = req.query;
      if (!eventId) {
        return res.status(400).json({ success: false, message: 'eventId gerekli' });
      }
      const sales = await saleService.getAllSales({ eventId });
      res.json({ success: true, data: sales });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /** Üye ID'sine göre satıcı / alıcı satışlar (admin üye detayı) */
  async createTestSale(req, res) {
    try {
      const { listingId, buyerMemberId, quantity } = req.body;
      if (!listingId || !buyerMemberId) {
        return res.status(400).json({
          success: false,
          message: 'listingId ve buyerMemberId zorunludur',
        });
      }
      const sale = await saleService.createTestSale({ listingId, buyerMemberId, quantity });
      res.status(201).json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getSalesByMember(req, res) {
    try {
      const { memberId } = req.query;
      if (!memberId) {
        return res.status(400).json({ success: false, message: 'memberId gerekli' });
      }
      const data = await saleService.getSalesByMemberId(memberId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateDeliveryStatus(req, res) {
    try {
      const { deliveryStatus, deliveredAt } = req.body;
      const sale = await saleService.updateDeliveryStatus(req.params.id, deliveryStatus, deliveredAt);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateTicketHolderDeliveryStatus(req, res) {
    try {
      const { ticketHolderIndex, deliveryStatus, deliveredAt } = req.body;
      const sale = await saleService.updateTicketHolderDeliveryStatus(req.params.id, ticketHolderIndex, deliveryStatus, deliveredAt);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateTicketHolderInfo(req, res) {
    try {
      const { ticketHolderIndex, updateData } = req.body;
      const sale = await saleService.updateTicketHolderInfo(req.params.id, ticketHolderIndex, updateData);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async adminUploadTicketHolderSellerProof(req, res) {
    try {
      const { id, ticketIndex } = req.params;
      const sale = await saleService.appendAdminSellerProofToTicketHolder(id, ticketIndex, req.files || []);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateAllTicketHolders(req, res) {
    try {
      const { ticketHolders } = req.body;
      const sale = await saleService.updateAllTicketHolders(req.params.id, ticketHolders);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updatePaymentStatus(req, res) {
    try {
      const { paymentStatus } = req.body;
      const sale = await saleService.updatePaymentStatus(req.params.id, paymentStatus);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateSale(req, res) {
    try {
      const updateData = req.body;
      const sale = await saleService.updateSale(req.params.id, updateData);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async approveTicket(req, res) {
    try {
      const { ticketIndex } = req.body;
      const sale = await saleService.approveTicket(req.params.id, ticketIndex);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async approveAllTickets(req, res) {
    try {
      console.log('approveAllTickets çağrıldı:', {
        saleId: req.params.id,
        body: req.body
      });
      
      const sale = await saleService.approveAllTickets(req.params.id);
      res.json({ success: true, data: sale });
    } catch (error) {
      console.error('approveAllTickets hatası:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async approveSale(req, res) {
    try {
      const sale = await saleService.approveSale(req.params.id, req.user?._id);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async cancelSale(req, res) {
    try {
      const { reason } = req.body;
      const sale = await saleService.cancelSale(req.params.id, reason, req.user?._id);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async refundSale(req, res) {
    try {
      const { amount, notes } = req.body;
      const sale = await saleService.refundSale(req.params.id, amount, notes, req.user?._id);
      res.json({ success: true, data: sale });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async rejectTicket(req, res) {
    try {
      console.log('rejectTicket çağrıldı:', {
        saleId: req.params.id,
        body: req.body,
        ticketIndex: req.body.ticketIndex
      });
      
      const { ticketIndex } = req.body;
      
      if (ticketIndex === undefined || ticketIndex === null) {
        console.error('ticketIndex eksik:', req.body);
        return res.status(400).json({ 
          success: false, 
          message: 'ticketIndex parametresi gerekli' 
        });
      }
      
      const sale = await saleService.rejectTicket(req.params.id, ticketIndex);
      res.json({ success: true, data: sale });
    } catch (error) {
      console.error('rejectTicket hatası:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new SaleController(); 