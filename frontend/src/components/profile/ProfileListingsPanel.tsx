"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProfileEmptyPanel } from "@/components/profile/ProfileEmptyPanel";
import { ProfileListingCreateModal } from "@/components/profile/ProfileListingCreateModal";
import { ProfilePanelHeader } from "@/components/profile/ProfilePanelHeader";
import { ProfileListingEditModal } from "@/components/profile/ProfileListingEditModal";
import { formatProfileUtcDateTime, formatSaleDate } from "@/components/profile/profile-utils";
import { useLocale } from "@/contexts/locale-context";
import {
  apiGetListings,
  apiToggleListingStatus,
  type ListingRecord,
  type ListingsPagination,
} from "@/lib/api/member-api";

type TabKey = "aktif" | "gecmis";

function listingEventName(l: ListingRecord): string {
  const e = l.eventId;
  if (e && typeof e === "object" && "name" in e) return String((e as { name?: string }).name ?? "");
  return "";
}

function listingEventDateRaw(l: ListingRecord): string {
  const e = l.eventId;
  return e && typeof e === "object" && "date" in e ? String((e as { date?: string }).date ?? "") : "";
}

function listingEventLocation(l: ListingRecord): string {
  const e = l.eventId;
  return e && typeof e === "object" && "location" in e ? String((e as { location?: string }).location ?? "") : "";
}

function listingDisplayId(l: ListingRecord): string {
  return (l.referenceCode && String(l.referenceCode)) || l._id;
}

/** PATCH responses often send eventId as id string or lean object — keep UI event name/location from the row */
function mergeListingPatch(prev: ListingRecord, patch: ListingRecord): ListingRecord {
  const next: ListingRecord = { ...prev, ...patch };
  if (!("eventId" in patch)) return next;
  const pe = patch.eventId;
  const isRichObject =
    pe != null &&
    typeof pe === "object" &&
    String((pe as { name?: string }).name ?? "").trim() !== "";
  if (!isRichObject && prev.eventId != null) {
    next.eventId = prev.eventId;
  }
  return next;
}

function listingStatusIcon(status: string | undefined): string {
  switch (status) {
    case "pending":
      return "/generalicon/pending.svg";
    case "rejected":
      return "/generalicon/rejected.svg";
    case "active":
      return "/generalicon/succesful.svg";
    case "inactive":
      return "/generalicon/inactive.svg";
    default:
      return "/generalicon/pending.svg";
  }
}

function listingStatusLong(status: string | undefined, t: (k: string) => string): string {
  switch (status) {
    case "pending":
      return t("profile.listingStatusPending");
    case "rejected":
      return t("profile.listingStatusRejected");
    case "active":
      return t("profile.listingStatusActive");
    case "inactive":
      return t("profile.listingStatusInactive");
    default:
      return "—";
  }
}

function listingStatusShort(status: string | undefined, t: (k: string) => string): string {
  switch (status) {
    case "pending":
      return t("profile.listingStatusShortPending");
    case "rejected":
      return t("profile.listingStatusShortRejected");
    case "active":
      return t("profile.listingStatusShortActive");
    case "inactive":
      return t("profile.listingStatusShortInactive");
    default:
      return "—";
  }
}

function listingStatusChipClass(status: string | undefined): string {
  switch (status) {
    case "pending":
      return "bg-orange-100 text-orange-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "active":
      return "bg-green-100 text-green-700";
    case "inactive":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-400";
  }
}

function listingStatusRowClass(status: string | undefined): string {
  switch (status) {
    case "pending":
      return "text-[#FF6900]";
    case "rejected":
      return "text-[#FF0000]";
    case "active":
      return "text-green-600";
    case "inactive":
      return "text-gray-500";
    default:
      return "text-gray-400";
  }
}

function filterListings(list: ListingRecord[], tab: TabKey): ListingRecord[] {
  return list.filter((listing) => {
    if (tab === "aktif") {
      return ["active", "pending", "inactive"].includes(String(listing.status));
    }
    if (tab === "gecmis") {
      const raw = listingEventDateRaw(listing);
      const eventDate = raw ? new Date(raw) : null;
      const now = new Date();
      return listing.status === "rejected" || (eventDate != null && !Number.isNaN(eventDate.getTime()) && eventDate < now);
    }
    return true;
  });
}

function buildPaginationPages(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (current <= 4) {
    for (let i = 2; i <= 5; i++) pages.push(i);
    pages.push("...");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push("...");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push("...");
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push("...");
    pages.push(total);
  }
  return pages;
}

type PanelProps = {
  initialListings?: ListingRecord[];
  initialPagination?: ListingsPagination | null;
  initialPage?: number;
};

export function ProfileListingsPanel({
  initialListings,
  initialPagination = null,
  initialPage = 1,
}: PanelProps = {}) {
  const { t, locale } = useLocale();
  const fromServer = initialListings !== undefined;
  const [list, setList] = useState<ListingRecord[]>(() => (fromServer ? initialListings! : []));
  const [loading, setLoading] = useState(!fromServer);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("aktif");
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pagination, setPagination] = useState<ListingsPagination | null>(() =>
    fromServer ? initialPagination ?? null : null
  );
  const [editTarget, setEditTarget] = useState<ListingRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  /** After leaving SSR initial page, returning to `initialPage` must refetch. */
  const leftInitialPageRef = useRef(false);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGetListings(page, 10);
        if (res.success && Array.isArray(res.listings)) {
          setList(res.listings);
          if (res.pagination) setPagination(res.pagination);
        } else {
          setList([]);
          setPagination(null);
        }
      } catch {
        setError(t("profile.listingsLoadError"));
        setList([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (currentPage !== initialPage) leftInitialPageRef.current = true;
    if (fromServer && currentPage === initialPage && !leftInitialPageRef.current) return;
    void load(currentPage);
  }, [load, currentPage, fromServer, initialPage]);

  useEffect(() => {
    if (!statusToast) return;
    const id = window.setTimeout(() => setStatusToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [statusToast]);

  const filtered = useMemo(() => filterListings(list, activeTab), [list, activeTab]);

  const paginationPages = useMemo(
    () => buildPaginationPages(pagination?.currentPage ?? 1, pagination?.totalPages ?? 1),
    [pagination]
  );

  async function onToggleStatus(listing: ListingRecord) {
    const prevStatus = listing.status;
    try {
      const res = await apiToggleListingStatus(listing._id);
      if (res.success) {
        const updated = res.listing;
        setList((items) =>
          items.map((l) => {
            if (l._id !== listing._id) return l;
            if (updated) return mergeListingPatch(l, updated);
            const ns =
              prevStatus === "active" ? "inactive" : prevStatus === "inactive" ? "active" : l.status;
            return { ...l, status: ns };
          })
        );
        const newStatus =
          updated?.status ??
          (prevStatus === "active" ? "inactive" : prevStatus === "inactive" ? "active" : undefined);
        if (newStatus === "inactive") setStatusToast(t("profile.listingToastPaused"));
        else if (newStatus === "active") setStatusToast(t("profile.listingToastActivated"));
        else setStatusToast(t("profile.savedOk"));
      } else {
        window.alert(res.error ?? t("profile.errorGeneric"));
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("profile.errorGeneric"));
    }
  }

  const sellerPayout = (l: ListingRecord) => {
    const n = l.sellerAmount ?? (Number(l.price) || 0) * 0.8;
    return n.toFixed(2);
  };

  return (
    <main className="relative flex w-full flex-1 flex-col rounded-3xl bg-white">
      {statusToast ? (
        <div
          role="status"
          className="fixed right-4 top-4 z-100 max-w-[min(90vw,20rem)] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-lg"
        >
          {statusToast}
        </div>
      ) : null}
      <ProfilePanelHeader
        title={t("profile.listingsTitle")}
        actions={
          <button
            type="button"
            className="rounded-[20px] bg-indigo-500 px-6 py-2 text-white"
            onClick={() => setCreateOpen(true)}
          >
            {t("profile.listingsCreate")}
          </button>
        }
      />

      <div className="flex flex-1 flex-col px-4 py-8">
      <div className="mb-6 flex gap-2 text-sm">
        <button
          type="button"
          className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
            activeTab === "aktif" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-600"
          }`}
          onClick={() => setActiveTab("aktif")}
        >
          <img src="/profile/activeListings.svg" width={20} height={20} alt="" />
          <span>{t("profile.listingsTabActive")}</span>
        </button>
        <button
          type="button"
          className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
            activeTab === "gecmis" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-600"
          }`}
          onClick={() => setActiveTab("gecmis")}
        >
          <img src="/profile/clock.svg" width={20} height={20} alt="" />
          <span>{t("profile.listingsTabPast")}</span>
        </button>
      </div>

      <div className="flex min-h-[min(50dvh,420px)] flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500" aria-hidden />
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-red-500">{error}</div>
        ) : filtered.length > 0 ? (
          filtered.map((listing) => (
            <div
              key={listing._id}
              className="mb-4 w-full rounded-3xl border border-gray-200 bg-white shadow-sm md:mb-6"
            >
              <div className="hidden p-6 md:block">
                <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>
                      {listing.createdAt ? formatProfileUtcDateTime(listing.createdAt, locale) : "—"}
                    </span>
                    <span> • </span>
                    <span>{listingDisplayId(listing)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="flex items-center gap-2 rounded px-2 py-1 text-xs">
                      <img src="/generalicon/football.svg" width={20} height={20} alt="" />
                      {t("profile.listingsFootball")}
                    </span>
                  </div>
                </div>
                <div className="mb-5 border-b border-gray-200" />
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-800">{listingEventName(listing)}</span>
                </div>
                <div className="mb-2 mt-3 grid grid-cols-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <img src="/generalicon/calender.svg" className="h-4 w-4" alt="" />
                    <span>{formatProfileUtcDateTime(listingEventDateRaw(listing), locale) || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src="/generalicon/location.svg" className="h-4 w-4" alt="" />
                    <span>{listingEventLocation(listing)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-xs">
                  <div className="grid grid-cols-4 gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.category")}:</span>
                      <span>{listing.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.block")}:</span>
                      <span>{listing.block}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.row")}:</span>
                      <span>{listing.row}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.listingsSeat")}:</span>
                      <span>{listing.seat}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.listingsTotal")}:</span>
                      <span>
                        {listing.quantity} {t("profile.listingsTicketUnit")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.listingsSold")}:</span>
                      <span>
                        {listing.soldQuantity ?? 0} {t("profile.listingsTicketUnit")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.listingsListPrice")}:</span>
                      <span>{listing.price} TL</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{t("profile.listingsSellerPayout")}:</span>
                      <span>{sellerPayout(listing)} TL</span>
                    </div>
                  </div>
                </div>
                <div className="mb-5 mt-5 border-b border-gray-200" />
                <div className="mt-5 flex items-center justify-between">
                  <span className={`flex items-center gap-1 text-xs ${listingStatusRowClass(listing.status)}`}>
                    <img src={listingStatusIcon(listing.status)} className="h-4 w-4" alt="" />
                    {listingStatusLong(listing.status, t)}
                  </span>
                  {listing.status !== "pending" && listing.status !== "rejected" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-[32px] bg-gray-100 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-200"
                        onClick={() => void onToggleStatus(listing)}
                      >
                        {listing.status === "active" ? t("profile.listingPause") : t("profile.listingActivate")}
                      </button>
                      <button
                        type="button"
                        className="rounded-[32px] bg-gray-100 px-4 py-2 text-sm text-gray-900 transition hover:bg-gray-200"
                        onClick={() => setEditTarget(listing)}
                      >
                        {t("profile.listingEdit")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="block p-4 md:hidden">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-xs text-gray-400">{listingDisplayId(listing)}</span>
                    </div>
                    <h3 className="text-sm font-semibold leading-tight text-gray-800">{listingEventName(listing)}</h3>
                    <div className="mt-2 flex items-center gap-1">
                      <img src="/generalicon/calender.svg" className="h-3 w-3" alt="" />
                      <span className="text-xs text-gray-500">
                        {formatSaleDate(listingEventDateRaw(listing), locale) || "—"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs ${listingStatusChipClass(
                      listing.status
                    )}`}
                  >
                    <img src={listingStatusIcon(listing.status)} className="h-3 w-3" alt="" />
                    {listingStatusShort(listing.status, t)}
                  </span>
                </div>
                <div className="mb-3 rounded-2xl bg-gray-50 p-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.category")}:</span>
                      <span className="font-medium">{listing.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.block")}:</span>
                      <span className="font-medium">{listing.block}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.row")}:</span>
                      <span className="font-medium">{listing.row}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.listingsSeat")}:</span>
                      <span className="font-medium">{listing.seat}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-200 pt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.qty")}:</span>
                      <span className="font-medium">{listing.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.listingsSold")}:</span>
                      <span className="font-medium">{listing.soldQuantity ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.amount")}:</span>
                      <span className="font-semibold text-indigo-600">{listing.price} TL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("profile.soldYourAmount")}:</span>
                      <span className="font-semibold text-green-600">{sellerPayout(listing)} TL</span>
                    </div>
                  </div>
                </div>
                {listing.status !== "pending" && listing.status !== "rejected" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                      onClick={() => void onToggleStatus(listing)}
                    >
                      {listing.status === "active" ? t("profile.listingPauseMobile") : t("profile.listingActivateMobile")}
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-lg bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-200"
                      onClick={() => setEditTarget(listing)}
                    >
                      {t("profile.listingEdit")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <ProfileEmptyPanel
            variant="listings"
            title={t("profile.emptyListingsTitle")}
            description={t("profile.emptyListingsDesc")}
          />
        )}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="mb-6 mt-8 flex justify-center">
          <nav className="flex items-center space-x-2" aria-label="Pagination">
            {pagination.hasPrevPage ? (
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-200"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : null}
            {paginationPages.map((page, i) =>
              page === "..." ? (
                <span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${
                    pagination.currentPage === page ? "bg-[#6366F1] text-white" : "hover:bg-gray-200"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}
            {pagination.hasNextPage ? (
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-200"
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : null}
          </nav>
        </div>
      ) : null}
      </div>

      <ProfileListingEditModal
        open={editTarget != null}
        listing={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => void load(currentPage)}
        t={t}
      />

      <ProfileListingCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void load(currentPage)}
        t={t}
      />
    </main>
  );
}
