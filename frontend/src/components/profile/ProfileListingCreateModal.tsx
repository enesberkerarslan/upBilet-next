"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiAddAddress,
  apiAddBankAccount,
  apiCreateListing,
  apiGetProfile,
  type AddressPayload,
  type AddressRecord,
  type BankAccountPayload,
  type BankAccountRecord,
  type MemberProfile,
} from "@/lib/api/member-api";
import { formatDateTR, formatTimeTR } from "@/lib/date";
import {
  fetchPublicVenueStructure,
  type PublicSearchEvent,
  type VenueCategory,
  searchPublicEvents,
} from "@/lib/public-api-browser";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  t: (key: string) => string;
};

type UiAddress = {
  id: string;
  title: string;
  desc: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  postalCode: string;
};

type UiBank = {
  id: string;
  title: string;
  iban: string;
};

type BlockOpt = { value: string; label: string };

function mapProfileToUi(m: MemberProfile): { addresses: UiAddress[]; banks: UiBank[] } {
  const addresses: UiAddress[] = (m.addresses ?? []).map((a: AddressRecord) => ({
    id: a._id,
    title: a.title,
    desc: `${a.address}, ${a.district}/${a.city}`,
    city: a.city,
    district: a.district,
    neighborhood: a.neighborhood,
    address: a.address,
    postalCode: a.postalCode,
  }));
  const banks: UiBank[] = (m.bankAccounts ?? []).map((b: BankAccountRecord) => ({
    id: b._id,
    title: b.bankName,
    iban: b.iban,
  }));
  return { addresses, banks };
}

function ListingCreateAddressModal({
  open,
  onClose,
  onSave,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (p: AddressPayload) => void;
  t: (key: string) => string;
}) {
  const [form, setForm] = useState({
    title: "",
    city: "",
    district: "",
    neighborhood: "",
    postalCode: "",
    address: "",
  });

  useEffect(() => {
    if (open) {
      setForm({ title: "", city: "", district: "", neighborhood: "", postalCode: "", address: "" });
    }
  }, [open]);

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.address || !form.city || !form.district || !form.neighborhood) {
      window.alert(t("profile.formRequiredFields"));
      return;
    }
    onSave({
      title: form.title.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      neighborhood: form.neighborhood.trim(),
      postalCode: form.postalCode.trim() || "00000",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/30 px-4 py-4">
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <button
          type="button"
          className="absolute right-6 top-6 text-xl text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label={t("header.close")}
        >
          &times;
        </button>
        <div className="mb-4 text-lg font-semibold">{t("profile.listingsModalNewAddress")}</div>
        <hr className="-mx-8 mb-6" />
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div>
            <label className="mb-2 block text-sm text-gray-600">{t("profile.listingsModalCountry")}</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled
                value="TR"
              >
                <option value="TR">{t("profile.listingsModalCountryTr")}</option>
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">▼</span>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-600">{t("profile.formAddrTitle")}</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm text-gray-600">{t("profile.formCity")}</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm text-gray-600">{t("profile.formDistrict")}</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                value={form.district}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm text-gray-600">{t("profile.formNeighborhood")}</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                value={form.neighborhood}
                onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm text-gray-600">{t("profile.formPostal")}</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                maxLength={5}
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-600">{t("profile.formAddrLine")}</label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-indigo-500 py-3 font-semibold text-white transition hover:bg-indigo-600"
          >
            {t("profile.save")}
          </button>
        </form>
      </div>
    </div>
  );
}

function ListingCreateBankModal({
  open,
  onClose,
  onSave,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (p: BankAccountPayload) => void;
  t: (key: string) => string;
}) {
  const [form, setForm] = useState({ bankName: "", accountHolder: "", iban: "", swiftCode: "" });

  useEffect(() => {
    if (open) setForm({ bankName: "", accountHolder: "", iban: "", swiftCode: "" });
  }, [open]);

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bankName || !form.accountHolder || !form.iban) {
      window.alert(t("profile.formRequiredFields"));
      return;
    }
    onSave({
      bankName: form.bankName.trim(),
      accountHolder: form.accountHolder.trim(),
      iban: form.iban.trim(),
      swiftCode: form.swiftCode.trim() || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/30 px-4 py-4">
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <button
          type="button"
          className="absolute right-6 top-6 text-xl text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label={t("header.close")}
        >
          &times;
        </button>
        <div className="mb-4 text-lg font-semibold">{t("profile.listingsModalNewBank")}</div>
        <hr className="-mx-8 mb-6" />
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div>
            <label className="mb-2 block text-sm text-gray-600">{t("profile.formBankName")}</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-600">{t("profile.formAccountHolder")}</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={form.accountHolder}
              onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-600">{t("profile.formIban")}</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={form.iban}
              onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-600">{t("profile.formSwift")}</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={form.swiftCode}
              onChange={(e) => setForm((f) => ({ ...f, swiftCode: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-indigo-500 py-3 font-semibold text-white transition hover:bg-indigo-600"
          >
            {t("profile.save")}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ProfileListingCreateModal({ open, onClose, onCreated, t }: Props) {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicSearchEvent[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PublicSearchEvent | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedBlockValue, setSelectedBlockValue] = useState("");
  const [blocks, setBlocks] = useState<BlockOpt[]>([]);
  const [row, setRow] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [ticketFormat, setTicketFormat] = useState("paper");
  const [venueStructure, setVenueStructure] = useState<{ categories?: VenueCategory[] } | null>(null);
  const [venueFieldError, setVenueFieldError] = useState("");

  const [addresses, setAddresses] = useState<UiAddress[]>([]);
  const [banks, setBanks] = useState<UiBank[]>([]);
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [selectedBank, setSelectedBank] = useState(0);

  const [price, setPrice] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [finishSuccess, setFinishSuccess] = useState(false);
  /** Shown on success: API referenceCode, or listing _id if missing */
  const [createdListingRef, setCreatedListingRef] = useState("");
  const [finishError, setFinishError] = useState("");

  const sellerAmount = useMemo(() => {
    const listPrice = parseFloat(price) || 0;
    return (listPrice * 0.8).toFixed(2);
  }, [price]);

  const resetAll = useCallback(() => {
    setStep(1);
    setQuery("");
    setResults([]);
    setSelectedEvent(null);
    setSelectedCategoryId("");
    setSelectedBlockValue("");
    setBlocks([]);
    setRow("");
    setSeatNumber("");
    setTicketQuantity(1);
    setTicketFormat("paper");
    setVenueStructure(null);
    setVenueFieldError("");
    setPrice("");
    setValidationMessage("");
    setFinishSuccess(false);
    setCreatedListingRef("");
    setFinishError("");
    setSaving(false);
    setShowAddressModal(false);
    setShowBankModal(false);
  }, []);

  const loadProfileForStepper = useCallback(async () => {
    try {
      const res = await apiGetProfile();
      if (res.success && res.member) {
        const { addresses: a, banks: b } = mapProfileToUi(res.member);
        setAddresses(a);
        setBanks(b);
        setSelectedAddress(0);
        setSelectedBank(0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) {
      resetAll();
      return;
    }
    setStep(1);
    setQuery("");
    setResults([]);
    setSelectedEvent(null);
    setSelectedCategoryId("");
    setSelectedBlockValue("");
    setBlocks([]);
    setVenueStructure(null);
    setVenueFieldError("");
    setValidationMessage("");
    void loadProfileForStepper();
  }, [open, resetAll, loadProfileForStepper]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void (async () => {
        if (!query.trim()) {
          setResults([]);
          return;
        }
        setSearching(true);
        try {
          const evs = await searchPublicEvents(query);
          setResults(evs);
        } catch {
          setResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 280);
    return () => clearTimeout(timer);
  }, [query, open]);

  const loadVenueForEvent = useCallback(
    async (ev: PublicSearchEvent) => {
      setVenueFieldError("");
      setVenueStructure(null);
      setSelectedCategoryId("");
      setSelectedBlockValue("");
      setBlocks([]);
      const venueTag = ev.tags?.find((tag) => tag.tag === "EtkinlikAlanı");
      if (!venueTag?._id) {
        setVenueFieldError(t("profile.listingsVenueLoadError"));
        return;
      }
      try {
        const vs = await fetchPublicVenueStructure(venueTag._id);
        if (vs) setVenueStructure(vs);
        else setVenueFieldError(t("profile.listingsVenueLoadError"));
      } catch {
        setVenueFieldError(t("profile.listingsVenueLoadError"));
      }
    },
    [t]
  );

  function selectEvent(ev: PublicSearchEvent) {
    setSelectedEvent(ev);
    setQuery("");
    setResults([]);
    void loadVenueForEvent(ev);
  }

  function handleCategoryChange(catId: string) {
    setSelectedCategoryId(catId);
    setSelectedBlockValue("");
    if (!catId || !venueStructure?.categories) {
      setBlocks([]);
      return;
    }
    const category = venueStructure.categories.find((c) => c._id === catId);
    if (category?.blocks?.length) {
      setBlocks(
        category.blocks.map((block, i) => ({
          value: block._id ?? `b-${i}-${block.name ?? ""}`,
          label: block.name ?? "",
        }))
      );
    } else {
      setBlocks([]);
    }
  }

  function handleNextStep() {
    setValidationMessage("");
    if (step === 1) {
      if (!selectedEvent) {
        setValidationMessage(t("profile.listingsValPickEvent"));
        return;
      }
      if (!selectedCategoryId) {
        setValidationMessage(t("profile.listingsValPickCategory"));
        return;
      }
      if (ticketQuantity < 1 || ticketQuantity > 10) {
        setValidationMessage(t("profile.listingsQtyInvalid"));
        return;
      }
    }
    if (step === 2) {
      if (addresses.length === 0) {
        setValidationMessage(t("profile.listingsValNeedAddress"));
        return;
      }
      if (banks.length === 0) {
        setValidationMessage(t("profile.listingsValNeedBank"));
        return;
      }
    }
    if (step < 4) setStep((s) => s + 1);
  }

  async function handleAddressSave(payload: AddressPayload) {
    try {
      const res = await apiAddAddress(payload);
      if (!res.success) return;
      if (res.addresses?.length) {
        const mapped = (res.addresses as AddressRecord[]).map((a) => ({
          id: a._id,
          title: a.title,
          desc: `${a.address}, ${a.district}/${a.city}`,
          city: a.city,
          district: a.district,
          neighborhood: a.neighborhood,
          address: a.address,
          postalCode: a.postalCode,
        }));
        setAddresses(mapped);
        setSelectedAddress(Math.max(0, mapped.length - 1));
      } else {
        const r = await apiGetProfile();
        if (r.success && r.member) {
          const { addresses: a } = mapProfileToUi(r.member);
          setAddresses(a);
          setSelectedAddress(Math.max(0, a.length - 1));
        }
      }
    } catch {
      /* ignore */
    }
  }

  async function handleBankSave(payload: BankAccountPayload) {
    try {
      const res = await apiAddBankAccount(payload);
      if (!res.success) return;
      if (res.bankAccounts?.length) {
        const mapped = (res.bankAccounts as BankAccountRecord[]).map((b) => ({
          id: b._id,
          title: b.bankName,
          iban: b.iban,
        }));
        setBanks(mapped);
        setSelectedBank(Math.max(0, mapped.length - 1));
      } else {
        const r = await apiGetProfile();
        if (r.success && r.member) {
          const { banks: b } = mapProfileToUi(r.member);
          setBanks(b);
          setSelectedBank(Math.max(0, b.length - 1));
        }
      }
    } catch {
      /* ignore */
    }
  }

  async function finish() {
    const p = parseFloat(price);
    if (!Number.isFinite(p) || p < 0) {
      setValidationMessage(t("profile.listingsPriceInvalid"));
      return;
    }
    if (!selectedEvent?._id) return;

    const categoryName =
      venueStructure?.categories?.find((c) => c._id === selectedCategoryId)?.name ?? "";
    const blockLabel = blocks.find((b) => b.value === selectedBlockValue)?.label ?? "";

    setSaving(true);
    setValidationMessage("");
    try {
      const res = await apiCreateListing({
        eventId: selectedEvent._id,
        price: p,
        ticketType: ticketFormat,
        quantity: ticketQuantity,
        category: categoryName,
        block: blockLabel || undefined,
        row: row.trim() || undefined,
        seat: seatNumber.trim() || undefined,
      });
      setStep(4);
      if (res.success && res.listing) {
        const ref =
          (typeof res.listing.referenceCode === "string" && res.listing.referenceCode.trim()) ||
          res.listing._id ||
          "";
        if (ref) {
          setFinishSuccess(true);
          setFinishError("");
          setCreatedListingRef(ref);
        } else {
          setFinishSuccess(false);
          setFinishError(t("profile.errorGeneric"));
        }
      } else {
        setFinishSuccess(false);
        const err = res.error;
        setFinishError(Array.isArray(err) ? String(err[0]) : (err ?? t("profile.errorGeneric")));
      }
    } catch {
      setStep(4);
      setFinishSuccess(false);
      setFinishError(t("profile.errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    if (step === 4 && finishSuccess) {
      onCreated();
    }
    onClose();
    resetAll();
  }

  if (!open) return null;

  const categories = venueStructure?.categories ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-4">
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-semibold">{t("profile.editListingTitle")}</div>
          <button
            type="button"
            className="text-2xl text-gray-400 hover:text-gray-600"
            onClick={closeModal}
            aria-label={t("header.close")}
          >
            ×
          </button>
        </div>

        {step < 4 ? (
          <div className="mb-8 flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <div
                className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                  step >= 1 ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                1
              </div>
              <span className={`text-xs ${step >= 1 ? "text-indigo-500" : "text-gray-400"}`}>
                {t("profile.listingsStep1")}
              </span>
            </div>
            <div className={`h-0.5 w-12 ${step > 1 ? "bg-indigo-500" : "bg-gray-200"}`} />
            <div className="flex flex-col items-center">
              <div
                className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                  step >= 2 ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                2
              </div>
              <span className={`text-xs ${step >= 2 ? "text-indigo-500" : "text-gray-400"}`}>
                {t("profile.listingsStep2")}
              </span>
            </div>
            <div className={`h-0.5 w-12 ${step > 2 ? "bg-indigo-500" : "bg-gray-200"}`} />
            <div className="flex flex-col items-center">
              <div
                className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                  step === 3 ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                3
              </div>
              <span className={`text-xs ${step === 3 ? "text-indigo-500" : "text-gray-400"}`}>
                {t("profile.listingsStep3")}
              </span>
            </div>
          </div>
        ) : null}

        <div>
          {step === 1 ? (
            <>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-600">{t("profile.listingsSearchEvent")}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 pr-10 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    placeholder={t("profile.listingsSearchPlaceholder")}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {searching ? (
                      <svg
                        className="h-5 w-5 animate-spin text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                {query && results.length > 0 ? (
                  <div
                    className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {results.map((event) => (
                      <button
                        key={event._id}
                        type="button"
                        className="w-full cursor-pointer border-b border-gray-100 p-3 text-left last:border-b-0 hover:bg-gray-50/80 focus-visible:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-200"
                        onClick={() => selectEvent(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{event.name}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {event.date ? `${formatDateTR(event.date)} - ${formatTimeTR(event.date)}` : ""}
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {event.tags?.find((tag) => tag.tag === "EtkinlikAlanı")?.name || event.location}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
                {selectedEvent ? (
                  <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50/90 p-3 ring-1 ring-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedEvent.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedEvent.date
                          ? `${formatDateTR(selectedEvent.date)} - ${formatTimeTR(selectedEvent.date)}`
                          : ""}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {selectedEvent.tags?.find((tag) => tag.tag === "EtkinlikAlanı")?.name || selectedEvent.location}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("profile.editTicketFormat")}</label>
                <select
                  value={ticketFormat}
                  onChange={(e) => setTicketFormat(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  <option value="paper">{t("profile.ticketTypePaper")}</option>
                  <option value="pdf">{t("profile.ticketTypePdf")}</option>
                  <option value="e-ticket">{t("profile.ticketTypeE")}</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("profile.editTicketCategory")}</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  <option value="">{t("profile.listingsPickCategory")}</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {venueFieldError ? <div className="mt-1 text-sm text-red-500">{venueFieldError}</div> : null}
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("profile.block")}</label>
                <select
                  value={selectedBlockValue}
                  onChange={(e) => setSelectedBlockValue(e.target.value)}
                  disabled={!selectedCategoryId || blocks.length === 0}
                  className="w-full rounded-lg border border-gray-200 bg-white p-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-60"
                >
                  <option value="">{t("profile.listingsPickBlock")}</option>
                  {blocks.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                {!selectedCategoryId ? null : blocks.length === 0 ? (
                  <div className="mt-1 text-sm text-gray-500">{t("profile.listingsBlockNoneInCategory")}</div>
                ) : null}
              </div>
              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("profile.row")}</label>
                  <input
                    type="text"
                    value={row}
                    onChange={(e) => setRow(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t("profile.editSeatNo")}</label>
                  <input
                    type="text"
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("profile.editQty")}</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={ticketQuantity}
                  onChange={(e) => setTicketQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="mb-8 rounded-xl bg-gray-50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-base font-semibold">{t("profile.listingsPickAddressSection")}</div>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="flex items-center gap-1 text-sm font-medium text-indigo-500 hover:text-indigo-600"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden>
                      <path
                        d="M8 3.333v9.334M3.333 8h9.334"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t("profile.listingsAddNewAddress")}
                  </button>
                </div>
                {addresses.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mb-4 text-gray-500">{t("profile.listingsNoAddressesYet")}</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address, idx) => (
                      <label
                        key={address.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${
                          selectedAddress === idx
                            ? "border-gray-500 bg-gray-100 ring-2 ring-gray-200"
                            : "border border-gray-200 bg-white"
                        }`}
                        onClick={() => setSelectedAddress(idx)}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 items-center justify-center ${
                              selectedAddress === idx ? "text-gray-600" : "text-gray-400"
                            }`}
                          >
                            <svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden>
                              <path
                                d="M10 17s6-5.686 6-9.5A6 6 0 1 0 4 7.5C4 11.314 10 17 10 17Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <circle cx="10" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          </span>
                          <div>
                            <div className="font-medium">{address.title}</div>
                            <div className="text-xs text-gray-500">{address.desc}</div>
                          </div>
                        </div>
                        {selectedAddress === idx ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">{t("profile.listingsSelected")}</span>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-600">
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                                <path
                                  d="M5 10.5L9 14.5L15 7.5"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-8 rounded-xl bg-gray-50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-base font-semibold">{t("profile.listingsPickBankSection")}</div>
                  <button
                    type="button"
                    onClick={() => setShowBankModal(true)}
                    className="flex items-center gap-1 text-sm font-medium text-indigo-500 hover:text-indigo-600"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden>
                      <path
                        d="M8 3.333v9.334M3.333 8h9.334"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t("profile.listingsAddNewBank")}
                  </button>
                </div>
                {banks.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mb-4 text-gray-500">{t("profile.listingsNoBanksYet")}</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {banks.map((bank, idx) => (
                      <label
                        key={bank.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${
                          selectedBank === idx
                            ? "border-gray-500 bg-gray-100 ring-2 ring-gray-200"
                            : "border border-gray-200 bg-white"
                        }`}
                        onClick={() => setSelectedBank(idx)}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 items-center justify-center ${
                              selectedBank === idx ? "text-gray-600" : "text-gray-400"
                            }`}
                          >
                            <svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden>
                              <rect x="3" y="7" width="14" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M10 4v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </span>
                          <div>
                            <div className="font-medium">{bank.title}</div>
                            <div className="text-xs text-gray-500">{bank.iban}</div>
                          </div>
                        </div>
                        {selectedBank === idx ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">{t("profile.listingsSelected")}</span>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-600">
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                                <path
                                  d="M5 10.5L9 14.5L15 7.5"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <div className="w-full rounded-2xl bg-gray-50 p-8">
              <div className="mb-8 text-lg font-semibold">{t("profile.listingsPricingTitle")}</div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">{t("profile.editListPrice")}</label>
                <div className="flex w-full items-center rounded-xl border border-gray-200 bg-white px-4 py-2 transition-colors focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-200">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="flex-1 bg-transparent font-bold outline-none ring-0 placeholder:font-bold placeholder:text-gray-400 focus:outline-none focus:ring-0"
                    placeholder="5.000,00"
                  />
                  <span className="ml-2 text-lg font-semibold text-gray-500">TL</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">{t("profile.editSellerNet")}</label>
                <div className="flex w-full items-center rounded-xl border border-gray-200 bg-white px-4 py-2 transition-colors focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-200">
                  <input
                    type="text"
                    readOnly
                    value={sellerAmount}
                    className="flex-1 bg-transparent font-bold outline-none ring-0 placeholder:font-bold placeholder:text-gray-400 focus:outline-none focus:ring-0"
                    placeholder="4.000,00"
                  />
                  <span className="ml-2 text-lg font-semibold text-gray-500">TL</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">{t("profile.listingsPricingNote")}</div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="flex flex-col items-center justify-center py-16">
              {finishSuccess ? (
                <div className="mb-4 flex flex-col items-center">
                  <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                    <svg width="40" height="40" fill="none" aria-hidden>
                      <circle cx="20" cy="20" r="18" stroke="#22C55E" strokeWidth="2" fill="#F0FDF4" />
                      <path
                        d="M13 21l5 5 9-9"
                        stroke="#22C55E"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="text-lg font-bold text-green-600">{t("profile.listingsCreatedSuccessShort")}</div>
                </div>
              ) : (
                <div className="mb-4 flex flex-col items-center">
                  <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                    <svg width="40" height="40" fill="none" aria-hidden>
                      <circle cx="20" cy="20" r="18" stroke="#EF4444" strokeWidth="2" fill="#FEF2F2" />
                      <path d="M14 14l12 12M26 14L14 26" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div className="text-lg font-bold text-red-600">{t("profile.listingsCreatedFailShort")}</div>
                </div>
              )}
              <div className="mb-2 text-center text-xl font-semibold text-gray-900">
                {finishSuccess ? t("profile.listingsCreatedSuccessLine") : t("profile.listingsCreatedFailLine")}
              </div>
              {finishSuccess ? (
                <div className="mb-8 max-w-md text-center text-sm text-gray-500">
                  {t("profile.listingsCreatedSuccessDetail").replace(/\{\{code\}\}/g, createdListingRef)}
                </div>
              ) : (
                <div className="mb-8 max-w-md text-center text-sm text-red-500">{finishError}</div>
              )}
              <button
                type="button"
                className="rounded-full bg-indigo-500 px-10 py-3 text-base font-semibold text-white transition hover:bg-indigo-600"
                onClick={closeModal}
              >
                {t("profile.listingsDone")}
              </button>
            </div>
          ) : null}
        </div>

        {step < 4 ? (
          <div className="mt-8 flex flex-col items-end">
            {validationMessage ? (
              <div className="mb-2 w-full text-right text-sm text-red-500">{validationMessage}</div>
            ) : null}
            <div>
              {step < 3 ? (
                <button
                  type="button"
                  className="rounded-full bg-indigo-500 px-8 py-3 font-semibold text-white"
                  onClick={handleNextStep}
                >
                  {t("profile.listingsContinue")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  className="rounded-full bg-indigo-500 px-8 py-3 font-semibold text-white disabled:opacity-50"
                  onClick={() => void finish()}
                >
                  {saving ? "…" : t("profile.listingsCreateButton")}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <ListingCreateAddressModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={(p) => void handleAddressSave(p)}
        t={t}
      />
      <ListingCreateBankModal
        open={showBankModal}
        onClose={() => setShowBankModal(false)}
        onSave={(p) => void handleBankSave(p)}
        t={t}
      />
    </div>
  );
}
