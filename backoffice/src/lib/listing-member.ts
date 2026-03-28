import { Listing, Member } from '@/types';

/** İlandaki satıcı üye ID'si — EventListingFormModal ile aynı mantık */
export function listingMemberId(listing: Listing): string {
  const m = listing.memberId;
  if (m && typeof m === 'object' && '_id' in m) {
    return (m as Member)._id;
  }
  return typeof m === 'string' ? m : '';
}
