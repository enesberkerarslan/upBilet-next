"use client";

import { useCallback, useEffect, useState } from "react";
import { ProfileEmptyPanel } from "@/components/profile/ProfileEmptyPanel";
import { ProfilePanelHeader } from "@/components/profile/ProfilePanelHeader";
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
    setSaving(true);
    setErr(null);
    try {
      if (modal === "add") {
        const res = await apiAddBankAccount({
          ...form,
          swiftCode: form.swiftCode?.trim() || undefined,
        });
        if (!res.success) {
          setErr(res.error ?? t("profile.errorGeneric"));
          return;
        }
        if (res.bankAccounts) setList(res.bankAccounts as BankAccountRecord[]);
        else await load();
      } else if (modal && typeof modal === "object" && "edit" in modal) {
        const res = await apiUpdateBankAccount(modal.edit._id, {
          ...form,
          swiftCode: form.swiftCode?.trim() || undefined,
        });
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
    <main className="flex w-full flex-1 flex-col rounded-2xl bg-white px-2">
      <ProfilePanelHeader
        title={t("profile.menuBank")}
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="rounded-full bg-[#615FFF] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {t("profile.bankAdd")}
          </button>
        }
      />
      <div className="flex min-h-[min(50dvh,420px)] flex-1 flex-col py-4 md:px-6">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" aria-hidden />
          </div>
        ) : list.length === 0 ? (
          <ProfileEmptyPanel variant="bank" title={t("profile.bankEmptyTitle")} description={t("profile.bankEmptyDesc")} />
        ) : (
          <ul className="mx-auto w-full max-w-3xl space-y-3">
            {list.map((b) => (
              <li
                key={b._id}
                className="flex flex-col gap-2 rounded-2xl border border-gray-100 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">{b.bankName}</p>
                  <p className="text-sm text-gray-600">{b.accountHolder}</p>
                  <p className="mt-1 font-mono text-xs text-gray-500">{b.iban}</p>
                  {b.swiftCode ? (
                    <p className="text-xs text-gray-400">SWIFT: {b.swiftCode}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  className="shrink-0 rounded-xl border border-[#E4E4E7] px-4 py-2 text-sm font-medium text-[#615FFF] hover:bg-gray-50"
                >
                  {t("profile.bankEdit")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal ? (
        <div className="fixed inset-0 z-100 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {modal === "add" ? t("profile.bankAdd") : t("profile.bankEdit")}
            </h2>
            {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formBankName")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  value={form.bankName}
                  onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formAccountHolder")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  value={form.accountHolder}
                  onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formIban")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm"
                  value={form.iban}
                  onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formSwift")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  value={form.swiftCode ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, swiftCode: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t("profile.cancel")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={submit}
                className="rounded-full bg-[#615FFF] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
