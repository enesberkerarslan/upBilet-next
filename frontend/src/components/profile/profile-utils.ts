import { formatDateTR, formatTimeTR } from "@/lib/date";
import type { SaleRecord } from "@/lib/api/member-api";

export function eventName(sale: SaleRecord): string {
  const e = sale.eventId;
  if (e && typeof e === "object" && "name" in e) return String((e as { name?: string }).name ?? "");
  return "";
}

/** Human-facing sale id: `referenceCode` when set, else Mongo `_id`. */
export function saleRefDisplay(sale: SaleRecord): string {
  const code = sale.referenceCode?.trim();
  return code || sale._id;
}

export function eventDateLoc(sale: SaleRecord, locale: string): string {
  const e = sale.eventId;
  const raw = e && typeof e === "object" && "date" in e ? (e as { date?: string }).date : undefined;
  if (!raw) return "";
  return formatSaleDate(raw, locale);
}

export function formatSaleDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (locale === "en") {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return `${formatDateTR(iso)} ${formatTimeTR(iso)}`.trim();
}

/** UTC date+time for profile listing/sale headers (matches legacy web display). */
export function formatProfileUtcDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const h = date.getUTCHours().toString().padStart(2, "0");
  const m = date.getUTCMinutes().toString().padStart(2, "0");
  if (locale === "en") {
    const day = date.getUTCDate();
    const mo = date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
    const y = date.getUTCFullYear();
    return `${day} ${mo} ${y} ${h}:${m}`;
  }
  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];
  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year} ${h}:${m}`;
}

export function saleStatusLabel(status: string | undefined, t: (p: string) => string): string {
  switch (status) {
    case "pending_approval":
      return t("profile.stPending");
    case "approved":
      return t("profile.stApproved");
    case "rejected":
      return t("profile.stRejected");
    case "completed":
      return t("profile.stCompleted");
    case "active":
      return t("profile.stActive");
    default:
      return t("profile.stUnknown");
  }
}

/** Icon for sale/ticket progress badges (buyer + seller profile cards). */
export function saleProgressIconSrc(status: string | undefined): string {
  switch (status) {
    case "pending_approval":
    case "approved":
    case "active":
      return "/generalicon/pending.svg";
    case "completed":
      return "/generalicon/succesful.svg";
    case "rejected":
      return "/generalicon/rejected.svg";
    default:
      return "/generalicon/pending.svg";
  }
}

/** Buyer “Aldığım Biletler”: onay → bilet bekleniyor → tamamlandı. */
export function buyerPurchaseStatusLabel(status: string | undefined, t: (p: string) => string): string {
  switch (status) {
    case "pending_approval":
      return t("profile.stPending");
    case "approved":
    case "active":
      return t("profile.ticketsStAwaitingDelivery");
    case "completed":
      return t("profile.stCompleted");
    case "rejected":
      return t("profile.stRejected");
    default:
      return t("profile.stUnknown");
  }
}

export function buyerPurchaseStatusClass(status: string | undefined): string {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "rejected":
      return "text-red-600";
    case "pending_approval":
    case "approved":
    case "active":
      return "text-[#FF6900]";
    default:
      return "text-gray-500";
  }
}

/** Mobile pill background for buyer ticket cards. */
export function buyerPurchaseStatusBadgeClass(status: string | undefined): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "pending_approval":
    case "approved":
    case "active":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

/** Status copy for seller “my sales” views (legacy UpBilet wording). */
export function sellerSaleStatusLabel(status: string | undefined, t: (p: string) => string): string {
  switch (status) {
    case "pending_approval":
      return t("profile.soldStPaymentPending");
    case "approved":
    case "active":
      return t("profile.soldStTicketsPending");
    case "completed":
      return t("profile.stCompleted");
    case "rejected":
      return t("profile.stRejected");
    default:
      return t("profile.stUnknown");
  }
}

export function sellerSaleStatusClass(status: string | undefined): string {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "rejected":
      return "text-red-600";
    case "pending_approval":
    case "approved":
    case "active":
      return "text-[#FF6900]";
    default:
      return "text-gray-500";
  }
}
