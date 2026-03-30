"use client";

import { useCallback, useMemo, useState } from "react";
import { apiUploadSellerProof, type SaleRecord, type TicketHolderRecord } from "@/lib/api/member-api";
import {
  eventDateLoc,
  eventName,
  formatProfileUtcDateTime,
  sellerSaleStatusClass,
  sellerSaleStatusLabel,
} from "@/components/profile/profile-utils";

type Props = {
  open: boolean;
  ticket: SaleRecord | null;
  locale: string;
  onClose: () => void;
  t: (key: string) => string;
  onUploaded?: () => void;
};

function statusIconSrc(status: string | undefined): string {
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

const UPLOAD_ALLOWED = new Set(["pending_approval", "approved", "active"]);

export function ProfileSoldTicketDetailModal({ open, ticket, locale, onClose, t, onUploaded }: Props) {
  const [holderIdx, setHolderIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const holders: TicketHolderRecord[] = useMemo(() => ticket?.ticketHolders ?? [], [ticket]);

  const hideFileUpload = useMemo(() => {
    const s = ticket?.status;
    return s === "completed" || s === "rejected" || s === "cancelled" || !UPLOAD_ALLOWED.has(String(s));
  }, [ticket?.status]);

  const selected = holders[holderIdx];

  const onPickFile = useCallback(
    async (file: File) => {
      if (!ticket || !UPLOAD_ALLOWED.has(String(ticket.status))) return;
      setUploading(true);
      setUploadMsg(t("profile.modalUploading"));
      try {
        const res = await apiUploadSellerProof(ticket._id, holderIdx, file);
        if (res.success) {
          setUploadMsg("");
          onUploaded?.();
        } else {
          setUploadMsg(res.message ?? t("profile.errorGeneric"));
        }
      } catch (e) {
        setUploadMsg(e instanceof Error ? e.message : t("profile.errorGeneric"));
      } finally {
        setUploading(false);
      }
    },
    [holderIdx, onUploaded, t, ticket]
  );

  if (!open || !ticket) return null;

  const evName = eventName(ticket);
  const rawEvent = ticket.eventId;
  const evDate =
    rawEvent && typeof rawEvent === "object" && "date" in rawEvent
      ? formatProfileUtcDateTime(String((rawEvent as { date?: string }).date ?? ""), locale)
      : "";
  const evLoc =
    rawEvent && typeof rawEvent === "object" && "location" in rawEvent
      ? String((rawEvent as { location?: string }).location ?? "")
      : "";

  const listPrice = ticket.listingPrice ?? 0;
  const svc = ticket.serviceFee ?? 0;
  const kdv = ticket.serviceFeeKdv ?? 0;
  const total = ticket.totalAmount ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4">
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="mb-6 mt-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{t("profile.modalSaleDetailTitle")}</h2>
          <button type="button" className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label={t("header.close")}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <hr className="mb-4 mt-2 border-gray-200" />

        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="mb-3 text-lg font-semibold">{evName}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <img src="/generalicon/calender.svg" className="h-4 w-4" alt="" />
                <span>{evDate || eventDateLoc(ticket, locale)}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="/generalicon/location.svg" className="h-4 w-4" alt="" />
                <span>{evLoc}</span>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h4 className="mb-3 font-semibold">{t("profile.modalTicketInfo")}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t("profile.category")}:</span>
                <span className="ml-2">{ticket.category ?? "—"}</span>
              </div>
              <div>
                <span className="text-gray-500">{t("profile.block")}:</span>
                <span className="ml-2">{ticket.block ?? "—"}</span>
              </div>
              <div>
                <span className="text-gray-500">{t("profile.row")}:</span>
                <span className="ml-2">{ticket.row ?? "—"}</span>
              </div>
              <div>
                <span className="text-gray-500">{t("profile.soldQty")}:</span>
                <span className="ml-2">{ticket.ticketQuantity ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold">{t("profile.modalTicketHolders")}</h4>
              {holders.length > 0 ? (
                <div className="flex gap-2">
                  {holders.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setHolderIdx(index)}
                      className={`rounded-full px-3 py-1 text-sm ${
                        holderIdx === index ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {selected ? (
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-500">{t("profile.name")}:</span>
                    <span className="ml-2">{selected.name ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t("profile.surname")}:</span>
                    <span className="ml-2">{selected.surname ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t("profile.nationality")}:</span>
                    <span className="ml-2">{selected.nationality ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t("profile.tckn")}:</span>
                    <span className="ml-2">{selected.identityNumber ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t("profile.passoEmailField")}:</span>
                    <span className="ml-2">{selected.passoligEmail ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t("profile.passoPassword")}:</span>
                    <span className="ml-2">{selected.passoligPassword ?? "—"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">—</p>
            )}

            {!hideFileUpload && selected ? (
              <div className="p-4">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <TicketGlyph />
                    <div>
                      <div className="text-sm font-semibold">
                        {selected.sellerProofAttachments?.length
                          ? (selected.sellerProofAttachments[selected.sellerProofAttachments.length - 1]?.originalName ?? t("profile.modalViewTicket"))
                          : t("profile.modalNoFile")}
                      </div>
                      <div className="text-xs text-gray-400">
                        {selected.sellerProofAttachments?.length ? t("profile.modalViewTicket") : t("profile.modalUploadHint")}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept="application/pdf,image/png,image/jpeg"
                      className="hidden"
                      id={`sale-proof-${ticket._id}-${holderIdx}`}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void onPickFile(f);
                      }}
                    />
                    <label
                      htmlFor={`sale-proof-${ticket._id}-${holderIdx}`}
                      className="cursor-pointer rounded-[32px] bg-gray-100 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-200"
                    >
                      {t("profile.modalSelectFile")}
                    </label>
                    {uploading ? <span className="text-sm text-gray-500">{t("profile.modalUploading")}</span> : null}
                    {uploadMsg ? <span className="text-sm text-red-600">{uploadMsg}</span> : null}
                  </div>
                </div>
              </div>
            ) : null}

            {hideFileUpload ? (
              <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-blue-800">{t("profile.modalSupportTitle")}</div>
                    <p className="mt-1 text-xs text-blue-600">
                      {t("profile.modalSupportBeforeEmail")}{" "}
                      <a href="mailto:destek@upbilet.com" className="font-semibold underline">
                        destek@upbilet.com
                      </a>{" "}
                      {t("profile.modalSupportAfterEmail")}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h4 className="mb-3 font-semibold">{t("profile.modalPriceDetails")}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("profile.modalListPrice")}:</span>
                <span>
                  {listPrice} TL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("profile.modalServiceFee")}:</span>
                <span>{svc} TL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("profile.modalVat")}:</span>
                <span>{kdv} TL</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>{t("profile.modalTotal")}:</span>
                <span>{total} TL</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t("profile.status")}:</span>
              <span className={`flex items-center text-sm ${sellerSaleStatusClass(ticket.status)}`}>
                <img src={statusIconSrc(ticket.status)} className="mr-1 h-4 w-4" alt="" />
                {sellerSaleStatusLabel(ticket.status, t)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {t("profile.modalOrderDate")}: {ticket.saleDate ? formatProfileUtcDateTime(ticket.saleDate, locale) : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M1.6665 7.91634V4.99967C1.6665 4.0792 2.4127 3.33301 3.33317 3.33301H16.6665C17.587 3.33301 18.3332 4.0792 18.3332 4.99967V7.91634C17.1826 7.91634 16.2498 8.84909 16.2498 9.99967C16.2498 11.1503 17.1826 12.083 18.3332 12.083V14.9997C18.3332 15.9202 17.587 16.6663 16.6665 16.6663H3.33317C2.4127 16.6663 1.6665 15.9202 1.6665 14.9997V12.083C2.8171 12.083 3.74984 11.1503 3.74984 9.99967C3.74984 8.84909 2.8171 7.91634 1.6665 7.91634Z"
        stroke="#615FFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 3.33301V16.6663" stroke="#615FFF" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
