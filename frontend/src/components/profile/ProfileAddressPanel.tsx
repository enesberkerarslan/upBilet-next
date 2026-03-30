"use client";

import { useCallback, useEffect, useState } from "react";
import { ProfileEmptyPanel } from "@/components/profile/ProfileEmptyPanel";
import { ProfilePanelHeader } from "@/components/profile/ProfilePanelHeader";
import { useLocale } from "@/contexts/locale-context";
import {
  apiAddAddress,
  apiGetProfile,
  apiUpdateAddress,
  type AddressPayload,
  type AddressRecord,
} from "@/lib/api/member-api";

const emptyForm: AddressPayload = {
  title: "",
  address: "",
  city: "",
  district: "",
  neighborhood: "",
  postalCode: "",
};

type Props = { initialAddresses?: AddressRecord[] };

export function ProfileAddressPanel({ initialAddresses }: Props = {}) {
  const { t } = useLocale();
  const fromServer = initialAddresses !== undefined;
  const [list, setList] = useState<AddressRecord[]>(() => (fromServer ? initialAddresses! : []));
  const [loading, setLoading] = useState(!fromServer);
  const [modal, setModal] = useState<"add" | { edit: AddressRecord } | null>(null);
  const [form, setForm] = useState<AddressPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetProfile();
      if (res.success && Array.isArray(res.member?.addresses)) {
        setList(res.member.addresses as AddressRecord[]);
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

  function openEdit(a: AddressRecord) {
    setErr(null);
    setForm({
      title: a.title,
      address: a.address,
      city: a.city,
      district: a.district,
      neighborhood: a.neighborhood,
      postalCode: a.postalCode,
    });
    setModal({ edit: a });
  }

  async function submit() {
    setSaving(true);
    setErr(null);
    try {
      if (modal === "add") {
        const res = await apiAddAddress(form);
        if (!res.success) {
          setErr(res.error ?? t("profile.errorGeneric"));
          return;
        }
        if (res.addresses) setList(res.addresses as AddressRecord[]);
        else await load();
      } else if (modal && typeof modal === "object" && "edit" in modal) {
        const res = await apiUpdateAddress(modal.edit._id, form);
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
        title={t("profile.menuAddress")}
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="rounded-full bg-[#615FFF] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {t("profile.addressAdd")}
          </button>
        }
      />
      <div className="flex min-h-[min(50dvh,420px)] flex-1 flex-col py-4 md:px-6">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" aria-hidden />
          </div>
        ) : list.length === 0 ? (
          <ProfileEmptyPanel
            variant="address"
            title={t("profile.addressEmptyTitle")}
            description={t("profile.addressEmptyDesc")}
          />
        ) : (
          <ul className="mx-auto w-full max-w-3xl space-y-3">
            {list.map((a) => (
              <li
                key={a._id}
                className="flex flex-col gap-2 rounded-2xl border border-gray-100 p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">{a.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{a.address}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {a.district}, {a.neighborhood} · {a.city} {a.postalCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  className="shrink-0 rounded-xl border border-[#E4E4E7] px-4 py-2 text-sm font-medium text-[#615FFF] hover:bg-gray-50"
                >
                  {t("profile.addressEdit")}
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
              {modal === "add" ? t("profile.addressAdd") : t("profile.addressEdit")}
            </h2>
            {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formAddrTitle")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formAddrLine")}</label>
                <textarea
                  className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formCity")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formDistrict")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formNeighborhood")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  value={form.neighborhood}
                  onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formPostal")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
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
