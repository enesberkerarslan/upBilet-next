"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/contexts/locale-context";
import {
  apiGetMyPurchases,
  apiGetMySales,
  apiSupportAddMessage,
  apiSupportCreateTopic,
  apiSupportGetTopic,
  apiSupportListTopics,
  type SaleRecord,
  type SupportMessageRow,
  type SupportTopicDetail,
  type SupportTopicListRow,
} from "@/lib/api/member-api";
import { ProfileEmptyPanel } from "@/components/profile/ProfileEmptyPanel";
import { ProfilePanelHeader } from "@/components/profile/ProfilePanelHeader";
import { eventName } from "@/components/profile/profile-utils";

type View = "list" | "detail" | "new";

function formatDt(iso: string | undefined, locale: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

type SupportProps = { initialTopics?: SupportTopicListRow[] };

export function ProfileSupportPanel({ initialTopics }: SupportProps = {}) {
  const { t, locale } = useLocale();
  const [view, setView] = useState<View>("list");
  const prevView = useRef<View>(view);
  const [topics, setTopics] = useState<SupportTopicListRow[]>(() => initialTopics ?? []);
  const [loadingList, setLoadingList] = useState(initialTopics === undefined);
  const [listErr, setListErr] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportTopicDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [reply, setReply] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newSaleId, setNewSaleId] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [saleOptions, setSaleOptions] = useState<SaleRecord[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setListErr(null);
    try {
      const res = await apiSupportListTopics();
      if (res.success && Array.isArray(res.data)) setTopics(res.data);
      else {
        setTopics([]);
        setListErr(res.message ?? t("profile.errorGeneric"));
      }
    } catch {
      setTopics([]);
      setListErr(t("profile.errorGeneric"));
    } finally {
      setLoadingList(false);
    }
  }, [t]);

  useEffect(() => {
    if (view !== "list") {
      prevView.current = view;
      return;
    }
    const enteredListFromElsewhere = prevView.current !== "list";
    prevView.current = view;
    if (initialTopics !== undefined && !enteredListFromElsewhere) return;
    void loadList();
  }, [view, loadList, initialTopics]);

  const loadDetail = useCallback(
    async (id: string) => {
      setLoadingDetail(true);
      try {
        const res = await apiSupportGetTopic(id);
        if (res.success && res.data) setDetail(res.data);
        else setDetail(null);
      } catch {
        setDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    []
  );

  useEffect(() => {
    if (view === "detail" && activeId) loadDetail(activeId);
  }, [view, activeId, loadDetail]);

  useEffect(() => {
    if (view !== "new") return;
    let cancelled = false;
    (async () => {
      try {
        const [a, b] = await Promise.all([apiGetMyPurchases(), apiGetMySales()]);
        const map = new Map<string, SaleRecord>();
        if (a.success && Array.isArray(a.data)) for (const s of a.data) map.set(s._id, s);
        if (b.success && Array.isArray(b.data)) for (const s of b.data) map.set(s._id, s);
        if (!cancelled) setSaleOptions([...map.values()]);
      } catch {
        if (!cancelled) setSaleOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view]);

  const saleLabel = useCallback(
    (s: SaleRecord) => {
      const ev = eventName(s);
      return ev ? `${ev} · ${s._id.slice(-6)}` : s._id;
    },
    []
  );

  const statusLabel = useMemo(
    () =>
      (s: string) =>
        s === "closed" ? t("profile.supportStatusClosed") : t("profile.supportStatusOpen"),
    [t]
  );

  function goToTopic(id: string) {
    setActiveId(id);
    setReply("");
    setReplyFiles([]);
    setView("detail");
  }

  async function submitNew() {
    setActionMsg(null);
    setCreating(true);
    try {
      const res = await apiSupportCreateTopic({
        subject: newSubject.trim(),
        body: newBody.trim(),
        referenceSaleId: newSaleId || undefined,
        files: newFiles.length ? newFiles : undefined,
      });
      if (res.success && res.data?.topic?._id) {
        const id = res.data.topic._id;
        setNewSubject("");
        setNewBody("");
        setNewSaleId("");
        setNewFiles([]);
        goToTopic(id);
        await loadDetail(id);
        await loadList();
      } else {
        setActionMsg(res.message ?? t("profile.errorGeneric"));
      }
    } catch {
      setActionMsg(t("profile.errorGeneric"));
    } finally {
      setCreating(false);
    }
  }

  async function submitReply() {
    if (!activeId || !detail) return;
    if (detail.topic.status === "closed") return;
    setActionMsg(null);
    setSending(true);
    try {
      const res = await apiSupportAddMessage(
        activeId,
        reply.trim(),
        replyFiles.length ? replyFiles : undefined
      );
      if (res.success) {
        setReply("");
        setReplyFiles([]);
        await loadDetail(activeId);
        await loadList();
      } else {
        setActionMsg(res.message ?? t("profile.errorGeneric"));
      }
    } catch {
      setActionMsg(t("profile.errorGeneric"));
    } finally {
      setSending(false);
    }
  }

  function onPickReplyFiles(f: FileList | null) {
    if (!f?.length) return;
    const next = [...replyFiles, ...Array.from(f)].slice(0, 5);
    setReplyFiles(next);
  }

  function onPickNewFiles(f: FileList | null) {
    if (!f?.length) return;
    const next = [...newFiles, ...Array.from(f)].slice(0, 5);
    setNewFiles(next);
  }

  const refSaleLabel = (d: SupportTopicDetail) => {
    const r = d.topic.referenceSaleId;
    if (!r) return null;
    if (typeof r === "string") return r;
    const obj = r as { referenceCode?: string };
    return obj.referenceCode ?? null;
  };

  return (
    <main className="flex w-full flex-1 flex-col rounded-2xl bg-white px-2">
      <ProfilePanelHeader
        title={t("profile.supportTitle")}
        actions={
          view === "list" ? (
            <button
              type="button"
              onClick={() => setView("new")}
              className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
            >
              {t("profile.supportNew")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setView("list");
                setActiveId(null);
                setDetail(null);
              }}
              className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              {t("profile.supportBack")}
            </button>
          )
        }
      />

      <div className="flex min-h-[min(50dvh,420px)] flex-1 flex-col py-4 md:px-6">
        {actionMsg ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionMsg}</div>
        ) : null}
        {view === "list" ? (
          loadingList ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" aria-hidden />
            </div>
          ) : listErr ? (
            <div className="mx-auto w-full max-w-3xl rounded-2xl border border-dashed border-red-200/80 bg-red-50/40 px-6 py-10 text-center md:py-12">
              <p className="text-sm font-medium text-red-800">{listErr}</p>
              <button
                type="button"
                onClick={loadList}
                className="mt-4 rounded-full border border-red-200 bg-white px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                {t("profile.retry")}
              </button>
            </div>
          ) : topics.length === 0 ? (
            <ProfileEmptyPanel
              variant="support"
              title={t("profile.supportEmptyTitle")}
              description={t("profile.supportEmptyDesc")}
             
            />
          ) : (
            <ul className="flex w-full max-w-3xl flex-col gap-3">
              {topics.map((row) => (
                <li key={row._id}>
                  <button
                    type="button"
                    onClick={() => goToTopic(row._id)}
                    className="flex w-full flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{row.subject}</p>
                      <p className="text-xs text-gray-500">
                        {t("profile.supportUpdated")}: {formatDt(row.updatedAt, locale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.status === "closed" ? "bg-gray-100 text-gray-600" : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {statusLabel(row.status)}
                      </span>
                      <span className="text-sm font-medium text-indigo-600">{t("profile.supportOpen")} →</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {view === "new" ? (
          <div className="mx-auto w-full max-w-3xl space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-xs text-gray-500">{t("profile.supportSubject")}</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">{t("profile.supportMessage")}</label>
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">{t("profile.supportRelatedSale")}</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800"
                value={newSaleId}
                onChange={(e) => setNewSaleId(e.target.value)}
              >
                <option value="">{t("profile.supportNoSale")}</option>
                {saleOptions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {saleLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">{t("profile.supportAttach")}</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="text-sm text-gray-600"
                onChange={(e) => onPickNewFiles(e.target.files)}
              />
              {newFiles.length > 0 ? (
                <p className="mt-1 text-xs text-gray-500">{newFiles.map((f) => f.name).join(", ")}</p>
              ) : null}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={creating}
                onClick={submitNew}
                className="rounded-full bg-indigo-500 px-8 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
              >
                {t("profile.supportSend")}
              </button>
            </div>
          </div>
        ) : null}

        {view === "detail" ? (
          loadingDetail || !detail ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" aria-hidden />
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">{detail.topic.subject}</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      detail.topic.status === "closed" ? "bg-gray-100 text-gray-600" : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {statusLabel(detail.topic.status)}
                  </span>
                  {refSaleLabel(detail) ? (
                    <span className="rounded-full bg-gray-50 px-2 py-0.5">SAT: {refSaleLabel(detail)}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {detail.messages.map((m: SupportMessageRow) => (
                  <div
                    key={m._id}
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm ${
                      m.fromRole === "member"
                        ? "ml-auto bg-indigo-50 text-gray-900"
                        : "mr-auto bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="mb-1 text-xs font-medium text-gray-500">
                      {m.fromRole === "member" ? t("profile.supportYou") : t("profile.supportTeam")} ·{" "}
                      {formatDt(m.createdAt, locale)}
                    </div>
                    {m.body ? <p className="whitespace-pre-wrap">{m.body}</p> : null}
                    {m.attachments?.length ? (
                      <ul className="mt-2 space-y-1">
                        {m.attachments.map((a, i) => (
                          <li key={i}>
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 underline"
                            >
                              {a.originalName || "Ek"}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
              {detail.topic.status === "closed" ? (
                <p className="text-center text-sm text-amber-700">{t("profile.supportClosedNote")}</p>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <textarea
                    className="min-h-[88px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    placeholder={t("profile.supportReplyPlaceholder")}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input type="file" multiple accept="image/*,.pdf" onChange={(e) => onPickReplyFiles(e.target.files)} />
                    <button
                      type="button"
                      disabled={sending}
                      onClick={submitReply}
                      className="ml-auto rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
                    >
                      {t("profile.supportSend")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : null}
      </div>
    </main>
  );
}
