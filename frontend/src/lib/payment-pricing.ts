export type PriceBreakdown = {
  basePrice: number;
  serviceFee: number;
  serviceFeeKdv: number;
  totalWithKdv: number;
};

/** Etkinlik şeması: 0–100 arası yüzde (varsayılan 20). */
export function clampPercent0to100(value: unknown, fallback = 20): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

/**
 * Hizmet bedeli: etkinlik `comissionCustomer` yüzdesi (backend sale.service ile uyumlu).
 * Hizmet üzerinden KDV: %20 (sabit).
 */
export function computeCheckoutPricing(
  unitListingPrice: number,
  quantity: number,
  options?: { customerCommissionPercent?: number }
): PriceBreakdown {
  const basePrice = unitListingPrice * quantity;
  const customerPct = clampPercent0to100(options?.customerCommissionPercent, 20);
  const serviceFee = basePrice * (customerPct / 100);
  const serviceFeeKdv = serviceFee * 0.2;
  const totalWithKdv = basePrice + serviceFee + serviceFeeKdv;
  return { basePrice, serviceFee, serviceFeeKdv, totalWithKdv };
}
