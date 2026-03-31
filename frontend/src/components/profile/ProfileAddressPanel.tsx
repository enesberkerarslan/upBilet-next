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

const EMPTY_ICON_BOX =
  "mb-6 flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-2xl border border-[#615FFF]/15 bg-white md:h-[112px] md:w-[112px]";

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
    setErr(null);
    const payload: AddressPayload = {
      title: form.title.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      neighborhood: form.neighborhood.trim(),
      postalCode: form.postalCode.trim(),
    };
    if (
      !payload.title ||
      !payload.address ||
      !payload.city ||
      !payload.district ||
      !payload.neighborhood ||
      !payload.postalCode
    ) {
      setErr(t("profile.formRequiredFields"));
      return;
    }
    setSaving(true);
    try {
      if (modal === "add") {
        const res = await apiAddAddress(payload);
        if (!res.success) {
          setErr(res.error ?? t("profile.errorGeneric"));
          return;
        }
        if (res.addresses) setList(res.addresses as AddressRecord[]);
        else await load();
      } else if (modal && typeof modal === "object" && "edit" in modal) {
        const res = await apiUpdateAddress(modal.edit._id, payload);
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
        title={t("profile.menuAddress")}
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-2 text-sm font-medium text-white transition-colors duration-200 ease-out hover:bg-indigo-500/90 hover:shadow-sm active:scale-[0.98]"
          >
            <span className="text-lg leading-none">+</span>
            {t("profile.addressAddLong")}
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
            <ProfileSidebarMaskedIcon src={profileSidebarIconSrc.address} className={profileEmptyMaskedIconClass} />
          </div>
          <div className="mb-2 text-lg font-semibold text-gray-800">{t("profile.addressEmptyTitle")}</div>
          <div className="max-w-md text-center text-sm text-gray-500">{t("profile.addressEmptyDesc")}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 py-8">
          {list.map((a) => (
            <div
              key={a._id}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <ProfileAddressBankRowIcon type="address" />
                <div className="min-w-0">
                  <div className="text-base font-semibold text-gray-900">{a.title}</div>
                  <div className="text-xs text-gray-500">
                    {a.address}, {a.neighborhood}, {a.district}/{a.city}
                  </div>
                </div>
              </div>
              <div className="relative shrink-0 pl-2">
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  aria-label={t("profile.addressEdit")}
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
              {modal === "add" ? t("profile.addressAdd") : t("profile.addressEdit")}
            </h2>
            {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formAddrTitle")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formAddrLine")}</label>
                <textarea
                  className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formCity")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formDistrict")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formNeighborhood")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={form.neighborhood}
                  onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{t("profile.formPostal")}</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
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
