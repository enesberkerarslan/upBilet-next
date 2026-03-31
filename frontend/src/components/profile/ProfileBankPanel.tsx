"use client";

import { useCallback, useEffect, useState } from "react";
import { ProfilePanelHeader } from "@/components/profile/ProfilePanelHeader";
import {
  ProfileAddressBankRowIcon,
  ProfileSidebarMaskedIcon,
  profileEmptyMaskedIconClass,
  profileSidebarIconSrc,
} from "@/components/profile/ProfileSidebarMaskedIcon";
import { useLocale } from "@/contexts/locale-context";
import {
  apiAddBankAccount,
  apiGetProfile,
  apiUpdateBankAccount,
  type BankAccountPayload,
  type BankAccountRecord,
} from "@/lib/api/member-api";

const emptyForm: BankAccountPayload = {
  bankName: "",
  accountHolder: "",
  iban: "",
  swiftCode: "",
};

const EMPTY_ICON_BOX =
  "mb-6 flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-2xl border border-[#615FFF]/15 bg-white md:h-[112px] md:w-[112px]";

type Props = { initialAccounts?: BankAccountRecord[] };

export function ProfileBankPanel({ initialAccounts }: Props = {}) {
  const { t } = useLocale();
  const fromServer = initialAccounts !== undefined;
  const [list, setList] = useState<BankAccountRecord[]>(() => (fromServer ? initialAccounts! : []));
  const [loading, setLoading] = useState(!fromServer);
  const [modal, setModal] = useState<"add" | { edit: BankAccountRecord } | null>(null);
  const [form, setForm] = useState<BankAccountPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetProfile();
      if (res.success && Array.isArray(res.member?.bankAccounts)) {
        setList(res.member.bankAccounts as BankAccountRecord[]);
      } else setList([]);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fromServer) return;
    void load();
  }, [fromServer, load]);

  function openAdd() {
    setErr(null);
    setForm(emptyForm);
    setModal("add");
  }

  function openEdit(b: BankAccountRecord) {
    setErr(null);
    setForm({
      bankName: b.bankName,
      accountHolder: b.accountHolder,
      iban: b.iban,
      swiftCode: b.swiftCode ?? "",
    });
    setModal({ edit: b });
  }

  async function submit() {
    setErr(null);
    const bankName = form.bankName.trim();
    const accountHolder = form.accountHolder.trim();
    const iban = form.iban.replace(/\s/g, "").trim();
    if (!bankName || !accountHolder || !iban) {
      setErr(t("profile.formRequiredFields"));
      return;
    }
    const payload: BankAccountPayload = {
      bankName,
      accountHolder,
      iban,
      swiftCode: form.swiftCode?.trim() || undefined,
    };
    setSaving(true);
    try {
      if (modal === "add") {
        const res = await apiAddBankAccount(payload);
        if (!res.success) {
          setErr(res.error ?? t("profile.errorGeneric"));
          return;
        }
        if (res.bankAccounts) setList(res.bankAccounts as BankAccountRecord[]);
        else await load();
      } else if (modal && typeof modal === "object" && "edit" in modal) {
        const res = await apiUpdateBankAccount(modal.edit._id, payload);
        if (!res.success) {
          setErr(res.error ?? t("profile.errorGeneric"));
          return;
        }
        await load();
      }
      setModal(null);
    } catch {
      setErr(t("profile.errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex w-full flex-1 flex-col rounded-2xl bg-white">
      <ProfilePanelHeader
        title={t("profile.bankPanelTitle")}
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-2 text-sm font-medium text-white transition-colors duration-200 ease-out hover:bg-indigo-500/90 hover:shadow-sm active:scale-[0.98]"
          >
            <span className="text-lg leading-none">+</span>
            {t("profile.bankAddLong")}
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500" aria-hidden />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className={EMPTY_ICON_BOX}>
            <ProfileSidebarMaskedIcon src={profileSidebarIconSrc.bank} className={profileEmptyMaskedIconClass} />
          </div>
          <div className="mb-2 text-lg font-semibold text-gray-800">{t("profile.bankEmptyTitle")}</div>
          <div className="max-w-md text-center text-sm text-gray-500">{t("profile.bankEmptyDesc")}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 py-8">
          {list.map((b) => (
            <div
              key={b._id}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <ProfileAddressBankRowIcon type="bank" />
                <div className="min-w-0">
                  <div className="text-base font-semibold text-gray-900">{b.bankName}</div>
                  <div className="text-xs text-gray-500">
                    {b.accountHolder} - {b.iban}
                  </div>
                </div>
              </div>
              <div className="relative shrink-0 pl-2">
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  aria-label={t("profile.bankEdit")}
                  className="cursor-pointer text-xl leading-none text-gray-400 transition-colors duration-200 ease-out hover:text-gray-500"
                >
                  ...
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal ? (
        <div className="fixed inset-0 z-100 flex items-end justify-center bg-zinc-900/35 p-4 backdrop-blur-[1px] sm:items-center">
          <div
            role="dialog"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/60"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {modal === "add" ? t("profile.bankAdd") : t("profile.bankEdit")}
            </h2>
            {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formBankName")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={form.bankName}
                  onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formAccountHolder")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={form.accountHolder}
                  onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formIban")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={form.iban}
                  onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formSwift")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={form.swiftCode ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, swiftCode: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 ease-out hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
              >
                {t("profile.cancel")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={submit}
                className="rounded-full bg-[#615FFF] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all duration-200 ease-out hover:bg-[#6d66ff] hover:shadow-md hover:shadow-indigo-500/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
              >
                {t("profile.save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
