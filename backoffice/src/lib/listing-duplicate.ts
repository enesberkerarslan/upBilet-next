import { Listing } from '@/types';
import { listingMemberId } from '@/lib/listing-member';

export function listingEventId(listing: Listing): string {
  const e = listing.eventId;
  if (e && typeof e === 'object' && '_id' in e) {
    return (e as { _id: string })._id;
  }
  return typeof e === 'string' ? e : '';
}

/** Liste fiyatı ve etkinlik satıcı komisyon (%) ile satıcıya kalacak net tutar (2 ondalık) */
export function sellerNetFromListPrice(listPrice: number, commissionPercent: number): number {
  const c = Math.min(100, Math.max(0, Number(commissionPercent) || 0));
  return Math.round(((listPrice * (100 - c)) / 100) * 100) / 100;
}

/** Mevcut ilan satırlarından create-listing gövdesi (yeni kayıt). */
export function buildDuplicateListingPayload(
  row: Listing,
  eventId: string,
  commissionPercent?: number
): Record<string, unknown> {
  let sellerAmount = row.sellerAmount;
  if (sellerAmount == null || Number.isNaN(Number(sellerAmount))) {
    sellerAmount =
      commissionPercent != null
        ? sellerNetFromListPrice(Number(row.price), commissionPercent)
        : Number(row.price);
  }

  return {
    eventId,
    memberId: listingMemberId(row),
    price: row.price,
    sellerAmount: Number(sellerAmount),
    ticketType: row.ticketType,
    quantity: row.quantity,
    category: row.category,
    block: row.block || undefined,
    row: row.row || undefined,
    seat: row.seat || undefined,
    status: row.status,
  };
}
