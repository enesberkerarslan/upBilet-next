const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
  try {
    const { 
      amount, 
      currency, 
      description,
      metadata,
      receipt_email 
    } = req.body;


    // Metadata'yı kontrol et
    if (!metadata || !metadata.eventId || !metadata.listingId || !metadata.quantity) {
      return res.status(400).json({ 
        error: 'Missing required metadata: eventId, listingId, and quantity are required' 
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // kuruş cinsinden (ör: 100 TL için 10000)
      currency: currency || 'try',
      payment_method_types: ['card'],
      description: description || 'Bilet ödemesi',
      metadata: {
        eventId: metadata.eventId,
        listingId: metadata.listingId,
        quantity: metadata.quantity
      },
      receipt_email: receipt_email,
      // 3D Secure'ü zorunlu yap (isteğe bağlı)
      payment_method_options: {
        card: {
          request_three_d_secure: 'any'
        }
      }
    });

    res.json({ 
      success: true,
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });
  } catch (err) {
    console.error('Payment intent creation error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}; 