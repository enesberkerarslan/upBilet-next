"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/contexts/locale-context";
import { getPublicApiBaseBrowser } from "@/lib/env";
import { computeCheckoutPricing } from "@/lib/payment-pricing";
import { formatDateTR, formatTimeTR } from "@/lib/date";
import { useAuthStore } from "@/stores/auth-store";
import { apiGetProfile, type MemberProfile } from "@/lib/api/member-api";
import { GuestRegisterForm } from "@/components/payment/GuestRegisterForm";
import { TicketHoldersForm, type TicketHolderDraft } from "@/components/payment/TicketHoldersForm";
import { PaymentCardStep, type CheckoutSaleInfo } from "@/components/payment/PaymentCardStep";
import { PaymentResultPanel } from "@/components/payment/PaymentResultPanel";

const steps = ["Kullanıcı Bilgileri", "Fatura Bilgileri", "Ödeme", "Bitiş"];
const mobileSteps = ["Kullanıcı", "Fatura", "Ödeme", "Bitiş"];

type SaleInfoBase = Omit<CheckoutSaleInfo, "ticketHolders" | "userEmail">;

type EventRecord = {
  _id: string;
  name?: string;
  date?: string;
  image?: string;
  tags?: { name?: string; tag?: string }[];
};

type ListingRecord = {
  _id: string;
  eventId: string;
  price: number;
  sellerAmount?: number;
  quantity: number;
  category: string;
  block?: string;
  row?: string;
  seat?: string;
};

type Props = {
  listingId: string | null;
  quantityRaw: string | null;
};

function emptyHolder(): TicketHolderDraft {
  return {
    enterNow: true,
    name: "",
    surname: "",
    nationality: "",
    identityNumber: "",
    passoligEmail: "",
    passoligPassword: "",
  };
}

export function OdemeFlow({ listingId, quantityRaw }: Props) {
  const router = useRouter();
  const { href } = useLocale();
  const token = useAuthStore((s) => s.token);

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [saleInfo, setSaleInfo] = useState<SaleInfoBase | null>(null);
  const [eventData, setEventData] = useState<EventRecord | null>(null);
  const [ticketHolders, setTicketHolders] = useState<TicketHolderDraft[]>([]);
  const [profile, setProfile] = useState<MemberProfile | null>(null);

  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [billingWarning, setBillingWarning] = useState(false);

  const [paymentResult, setPaymentResult] = useState<Record<string, unknown> | null>(null);

  const handleHoldersChange = useCallback((holders: TicketHolderDraft[]) => {
    setTicketHolders(holders);
  }, []);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }
    void apiGetProfile().then((r) => {
      if (r.member) setProfile(r.member);
    });
  }, [token]);

  useEffect(() => {
    if (!listingId || !quantityRaw) {
      router.replace(href("/"));
      return;
    }

    const quantity = Math.max(1, parseInt(quantityRaw, 10) || 1);
    const base = getPublicApiBaseBrowser();

    (async () => {
      setLoading(true);
      try {
        const listRes = await fetch(`${base}events/getListingById/${listingId}`);
        const listJson = (await listRes.json()) as { success?: boolean; listing?: ListingRecord };
        if (!listJson.success || !listJson.listing) {
          router.replace(href("/"));
          return;
        }
        const listing = listJson.listing;

        const evRes = await fetch(`${base}events/${listing.eventId}`);
        const evJson = (await evRes.json()) as { success?: boolean; event?: EventRecord };
        if (!evJson.success || !evJson.event) {
          router.replace(href("/"));
          return;
        }
        const event = evJson.event;

        const unit = listing.price;
        const { serviceFee, serviceFeeKdv, totalWithKdv } = computeCheckoutPricing(unit, quantity);
        const sellerAmt = listing.sellerAmount ?? unit * 0.8;

        const eventDate = event.date
          ? `${formatDateTR(event.date)} ${formatTimeTR(event.date)}`.trim()
          : "";

        setEventData(event);
        setSaleInfo({
          listingId: String(listing._id),
          eventId: String(listing.eventId),
          eventName: event.name || "Etkinlik",
          eventDate,
          quantity,
          image: event.image,
          category: listing.category,
          block: listing.block,
          row: listing.row,
          seat: listing.seat,
          listingPrice: unit,
          sellerAmount: sellerAmt,
          serviceFee: serviceFee.toFixed(2),
          serviceFeeKdv: serviceFeeKdv.toFixed(2),
          totalPrice: totalWithKdv.toFixed(2),
          billingCity: "",
          billingDistrict: "",
          billingAddress: "",
        });
        setTicketHolders(Array.from({ length: quantity }, () => emptyHolder()));

        if (typeof window !== "undefined" && (window as unknown as { dataLayer?: unknown[] }).dataLayer) {
          try {
            (window as unknown as { dataLayer: unknown[] }).dataLayer.push({
              event: "begin_checkout",
              ecommerce: {
                currency: "TRY",
                value: totalWithKdv,
                items: [
                  {
                    item_id: String(listing._id),
                    item_name: event.name,
                    category: listing.category,
                    quantity,
                    price: unit,
                  },
                ],
              },
            });
          } catch {
            /* ignore */
          }
        }
      } catch {
        router.replace(href("/"));
      } finally {
        setLoading(false);
      }
    })();
  }, [listingId, quantityRaw, router, href]);

  const showContinueButton = useMemo(() => {
    if (currentStep === 2) return false;
    if (currentStep === 0 && !token) return false;
    return true;
  }, [currentStep, token]);

  function handleContinue() {
    if (currentStep === 1) {
      if (!city.trim() || !district.trim() || !address.trim()) {
        setBillingWarning(true);
        return;
      }
      setBillingWarning(false);
    }
    setCurrentStep((s) => s + 1);
  }

  const fullSaleInfo: CheckoutSaleInfo | null = saleInfo
    ? {
        ...saleInfo,
        billingCity: currentStep >= 2 ? city : saleInfo.billingCity,
        billingDistrict: currentStep >= 2 ? district : saleInfo.billingDistrict,
        billingAddress: currentStep >= 2 ? address : saleInfo.billingAddress,
        ticketHolders,
        userEmail: profile?.email,
      }
    : null;

  function onPaymentSuccess(saleData: Record<string, unknown> & { _id?: string }) {
    setPaymentResult(saleData);
    setCurrentStep(3);
    if (typeof window !== "undefined" && (window as unknown as { dataLayer?: unknown[] }).dataLayer) {
      try {
        (window as unknown as { dataLayer: unknown[] }).dataLayer.push({
          event: "purchase",
          ecommerce: {
            transaction_id: saleData.id || saleData._id || `ORDER_${Date.now()}`,
            value: parseFloat(String(saleData.totalPrice ?? saleInfo?.totalPrice ?? 0)),
            currency: "TRY",
            items: [
              {
                item_id: saleData.listingId || saleInfo?.listingId,
                item_name: saleData.eventName || saleInfo?.eventName,
                category: saleData.category || saleInfo?.category,
                quantity: saleData.quantity || saleInfo?.quantity,
                price: parseFloat(String(saleData.listingPrice ?? saleInfo?.listingPrice ?? 0)),
              },
            ],
          },
        });
      } catch {
        /* ignore */
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center bg-white transition-opacity duration-300">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-center py-4 md:py-8">
      <div className="mb-8 flex w-full max-w-[700px] items-center justify-between px-4 pb-10 md:mb-12 md:pb-12">
        {steps.map((label, index) => (
          <div
            key={label}
            className={`relative flex items-center ${index !== steps.length - 1 ? "flex-1" : ""}`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border md:h-6 md:w-6 ${
                  currentStep >= index ? "border-indigo-600 bg-indigo-600" : "border-gray-300 bg-white"
                }`}
              >
                {currentStep >= index ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-white md:h-4 md:w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </div>
              <span
                className={`absolute -bottom-5 mt-1 w-full whitespace-nowrap text-center text-xs md:-bottom-6 md:mt-2 ${
                  currentStep >= index ? "font-medium text-gray-900" : "text-gray-500"
                }`}
              >
                <span className="hidden md:inline">{label}</span>
                <span className="md:hidden">{mobileSteps[index]}</span>
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={`mx-1 h-px flex-1 md:mx-2 ${currentStep > index ? "bg-indigo-600" : "bg-gray-300"}`}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div
        className={`grid w-full gap-4 md:gap-8 ${currentStep === 3 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}
      >
        <div className={currentStep === 3 ? "col-span-1" : "col-span-1 lg:col-span-2"}>
          {currentStep === 0 ? (
            <div className="rounded-2xl text-center">
              {!token ? (
                <GuestRegisterForm />
              ) : (
                <TicketHoldersForm
                  quantity={saleInfo?.quantity ?? 1}
                  eventTags={eventData?.tags}
                  onChange={handleHoldersChange}
                />
              )}
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-6 text-lg font-medium">Fatura Adresi</h2>
              <div className="space-y-6">
                <div>
                  <label className="mb-1 block text-sm">İl</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="İl"
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">İlçe</label>
                  <input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="İlçe"
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Açık Adres</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Açık adres"
                    rows={4}
                    className="min-h-[64px] w-full resize-y rounded-lg border border-gray-300 bg-white p-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 2 && fullSaleInfo ? (
            <PaymentCardStep saleInfo={fullSaleInfo} onSuccess={onPaymentSuccess} />
          ) : null}

          {currentStep === 3 ? (
            <PaymentResultPanel success paymentResult={paymentResult as never} />
          ) : null}
        </div>

        {currentStep !== 3 ? (
          <div className="order-last col-span-1 lg:order-none">
            {!saleInfo ? (
              <div className="flex h-[300px] items-center justify-center rounded-2xl bg-white p-4 shadow md:h-[400px] md:p-6">
                <div className="flex flex-col items-center">
                  <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600 md:h-12 md:w-12" />
                  <div className="text-sm text-gray-600">Bilet bilgileri yükleniyor...</div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-4 md:p-6">
                <div className="mb-4 border-b border-gray-200 pb-2 text-center text-lg font-bold text-gray-800 md:text-base">
                  Ödeme Detayları
                </div>
                {saleInfo.eventName ? (
                  <div className="mb-4 border-b border-gray-200 pb-2 text-center text-base text-gray-800 md:text-md">
                    {saleInfo.eventName}
                  </div>
                ) : null}

                <div className="mb-4 space-y-1 border-b border-gray-200 pb-2 text-sm text-gray-600 md:mb-5">
                  <div className="flex justify-between">
                    <span>Etkinlik Tarihi:</span>
                    <span>{saleInfo.eventDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kategori:</span>
                    <span>{saleInfo.category}</span>
                  </div>
                  {saleInfo.block ? (
                    <div className="flex justify-between">
                      <span>Blok:</span>
                      <span>{saleInfo.block}</span>
                    </div>
                  ) : null}
                  {saleInfo.row ? (
                    <div className="flex justify-between">
                      <span>Sıra:</span>
                      <span>{saleInfo.row}</span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3 text-sm md:space-y-4">
                  <div className="flex justify-between">
                    <span>Bilet Adedi</span>
                    <span>{saleInfo.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teklif Bilet Fiyatı</span>
                    <span>{saleInfo.listingPrice} TL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Toplam Fiyat</span>
                    <span>{saleInfo.listingPrice * saleInfo.quantity} TL</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Hizmet Bedeli:</span>
                    <span>{saleInfo.serviceFee} TL</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>KDV:</span>
                    <span>{saleInfo.serviceFeeKdv} TL</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 font-medium md:pt-4">
                    <span>Ödenecek Tutar</span>
                    <span>{saleInfo.totalPrice} TL</span>
                  </div>
                </div>

                {currentStep === 1 && billingWarning ? (
                  <div className="mb-2 mt-3 text-sm font-medium text-red-500">Lütfen tüm fatura alanlarını doldurunuz.</div>
                ) : null}

                {showContinueButton ? (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="mt-4 w-full rounded-lg bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-700 md:mt-6 md:py-3"
                  >
                    Devam Et
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
