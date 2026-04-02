import { formatDateTR, formatTimeTR } from "@/lib/date";
import { getPublicApiBaseServer } from "@/lib/env";
import { clampPercent0to100, computeCheckoutPricing } from "@/lib/payment-pricing";
import type { CheckoutSaleInfo } from "@/components/payment/PaymentCardStep";

export type OdemeEventRecord = {
  _id: string;
  name?: string;
  date?: string;
  image?: string;
  tags?: { name?: string; tag?: string }[];
  /** Satıcı komisyonu % (şema: commission) */
  commission?: number;
  /** Alıcı hizmet bedeli % — şemada yazım: comissionCustomer */
  comissionCustomer?: number;
};

type ListingRecord = {
  _id: string;
  eventId: string;
  price: number;
  sellerAmount?: number;
  quantity: number;
  category: string;
  block?: string;
  row?: string;
  seat?: string;
};

export type OdemeSaleInfoBase = Omit<CheckoutSaleInfo, "ticketHolders" | "userEmail">;

export async function loadOdemeCheckoutData(
  listingId: string,
  quantity: number
): Promise<{ saleInfo: OdemeSaleInfoBase; event: OdemeEventRecord } | null> {
  const base = getPublicApiBaseServer();
  try {
    const listRes = await fetch(`${base}events/getListingById/${listingId}`, { cache: "no-store" });
    const listJson = (await listRes.json()) as { success?: boolean; listing?: ListingRecord };
    if (!listJson.success || !listJson.listing) return null;
    const listing = listJson.listing;

    const evRes = await fetch(`${base}events/${listing.eventId}`, { cache: "no-store" });
    const evJson = (await evRes.json()) as { success?: boolean; event?: OdemeEventRecord };
    if (!evJson.success || !evJson.event) return null;
    const event = evJson.event;

    const unit = listing.price;
    const customerPct = clampPercent0to100(event.comissionCustomer, 20);
    const { serviceFee, serviceFeeKdv, totalWithKdv } = computeCheckoutPricing(unit, quantity, {
      customerCommissionPercent: customerPct,
    });
    const sellerCommissionPct = clampPercent0to100(event.commission, 20);
    const sellerAmt =
      listing.sellerAmount ?? unit * (1 - sellerCommissionPct / 100);

    const eventDate = event.date ? `${formatDateTR(event.date)} ${formatTimeTR(event.date)}`.trim() : "";

    const saleInfo: OdemeSaleInfoBase = {
      listingId: String(listing._id),
      eventId: String(listing.eventId),
      eventName: event.name || "Etkinlik",
      eventDate,
      quantity,
      image: event.image,
      category: listing.category,
      block: listing.block,
      row: listing.row,
      seat: listing.seat,
      listingPrice: unit,
      sellerAmount: sellerAmt,
      serviceFee: serviceFee.toFixed(2),
      serviceFeeKdv: serviceFeeKdv.toFixed(2),
      totalPrice: totalWithKdv.toFixed(2),
      billingCity: "",
      billingDistrict: "",
      billingAddress: "",
    };

    return { saleInfo, event };
  } catch {
    return null;
  }
}
