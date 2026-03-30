export type PriceBreakdown = {
  basePrice: number;
  serviceFee: number;
  serviceFeeKdv: number;
  totalWithKdv: number;
};

/** Nuxt ile aynı: %20 hizmet + hizmet üzerinden %20 KDV */
export function computeCheckoutPricing(unitListingPrice: number, quantity: number): PriceBreakdown {
  const basePrice = unitListingPrice * quantity;
  const serviceFee = basePrice * 0.2;
  const serviceFeeKdv = serviceFee * 0.2;
  const totalWithKdv = basePrice + serviceFee + serviceFeeKdv;
  return { basePrice, serviceFee, serviceFeeKdv, totalWithKdv };
}
