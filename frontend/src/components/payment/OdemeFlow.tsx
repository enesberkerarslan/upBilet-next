"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/contexts/locale-context";
import { useAuthStore } from "@/stores/auth-store";
import { apiGetProfile, type MemberProfile } from "@/lib/api/member-api";
import type { OdemeEventRecord, OdemeSaleInfoBase } from "@/lib/odeme-server-data";
import { GuestRegisterForm } from "@/components/payment/GuestRegisterForm";
import { TicketHoldersForm, type TicketHolderDraft } from "@/components/payment/TicketHoldersForm";
import { PaymentCardStep, type CheckoutSaleInfo } from "@/components/payment/PaymentCardStep";
import { PaymentResultPanel } from "@/components/payment/PaymentResultPanel";

const steps = ["Kullanıcı Bilgileri", "Fatura Bilgileri", "Ödeme", "Bitiş"];
const mobileSteps = ["Kullanıcı", "Fatura", "Ödeme", "Bitiş"];

const CHECKOUT_RESERVE_SECONDS = 10 * 60;

function checkoutDeadlineStorageKey(listingId: string, quantity: number) {
  return `upbilet-checkout-deadline:v1:${listingId}:${quantity}`;
}

/** Var olan son geçerlilik (geçmiş olsa bile); yoksa yeni bitiş yazar. */
function readOrInitDeadlineMs(storageKey: string): number {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(storageKey);
    const d = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(d)) {
      return d;
    }
  } catch {
    /* ignore */
  }
  const fresh = now + CHECKOUT_RESERVE_SECONDS * 1000;
  try {
    localStorage.setItem(storageKey, String(fresh));
  } catch {
    /* ignore */
  }
  return fresh;
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type SaleInfoBase = OdemeSaleInfoBase;

type Props = {
  initialSaleInfo: SaleInfoBase;
  initialEventData: OdemeEventRecord;
  initialAuthenticated: boolean;
  initialProfile: MemberProfile | null;
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

export function OdemeFlow({ initialSaleInfo, initialEventData, initialAuthenticated, initialProfile }: Props) {
  const router = useRouter();
  const { href } = useLocale();
  const token = useAuthStore((s) => s.token);
  const saleInfo = initialSaleInfo;
  const eventData = initialEventData;

  const checkoutStorageKey = useMemo(
    () => checkoutDeadlineStorageKey(saleInfo.listingId, saleInfo.quantity),
    [saleInfo.listingId, saleInfo.quantity]
  );

  /** Must start false so SSR + first client paint match (hasHydrated() differs server vs client). */
  const [persistReady, setPersistReady] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setPersistReady(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setPersistReady(true));
    return unsub;
  }, []);

  const isLoggedIn = persistReady ? Boolean(token) : initialAuthenticated;

  const [currentStep, setCurrentStep] = useState(0);
  const [ticketHolders, setTicketHolders] = useState<TicketHolderDraft[]>(() =>
    Array.from({ length: initialSaleInfo.quantity }, () => emptyHolder())
  );
  const [profile, setProfile] = useState<MemberProfile | null>(initialProfile);

  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [billingWarning, setBillingWarning] = useState(false);

  const [paymentResult, setPaymentResult] = useState<Record<string, unknown> | null>(null);
  const [reserveSecondsLeft, setReserveSecondsLeft] = useState(CHECKOUT_RESERVE_SECONDS);
  const checkoutRedirectedRef = useRef(false);
  const currentStepRef = useRef(0);
  currentStepRef.current = currentStep;

  useLayoutEffect(() => {
    checkoutRedirectedRef.current = false;
  }, [checkoutStorageKey]);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || currentStepRef.current === 3) return;
    const deadline = readOrInitDeadlineMs(checkoutStorageKey);
    const sec = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    setReserveSecondsLeft(sec);
  }, [checkoutStorageKey]);

  useEffect(() => {
    if (currentStep === 3) return;

    const tick = () => {
      if (checkoutRedirectedRef.current || currentStepRef.current === 3) return;
      const deadline = readOrInitDeadlineMs(checkoutStorageKey);
      const sec = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setReserveSecondsLeft(sec);
      if (sec <= 0) {
        checkoutRedirectedRef.current = true;
        try {
          localStorage.removeItem(checkoutStorageKey);
        } catch {
          /* ignore */
        }
        router.replace(href("/"));
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [checkoutStorageKey, currentStep, router, href]);

  const checkoutExpired = reserveSecondsLeft <= 0;

  const handleHoldersChange = useCallback((holders: TicketHolderDraft[]) => {
    setTicketHolders(holders);
  }, []);

  useEffect(() => {
    if (!persistReady) return;
    if (!token) {
      setProfile(null);
      return;
    }
    void apiGetProfile().then((r) => {
      if (r.member) setProfile(r.member);
    });
  }, [token, persistReady]);

  useEffect(() => {
    const w = typeof window !== "undefined" ? (window as unknown as { dataLayer?: unknown[] }) : null;
    if (!w?.dataLayer) return;
    const totalWithKdv = parseFloat(saleInfo.totalPrice);
    const unit = saleInfo.listingPrice;
    try {
      w.dataLayer.push({
        event: "begin_checkout",
        ecommerce: {
          currency: "TRY",
          value: totalWithKdv,
          items: [
            {
              item_id: saleInfo.listingId,
              item_name: saleInfo.eventName,
              category: saleInfo.category,
              quantity: saleInfo.quantity,
              price: unit,
            },
          ],
        },
      });
    } catch {
      /* ignore */
    }
  }, [
    saleInfo.listingId,
    saleInfo.eventName,
    saleInfo.category,
    saleInfo.quantity,
    saleInfo.listingPrice,
    saleInfo.totalPrice,
  ]);

  const showContinueButton = useMemo(() => {
    if (checkoutExpired) return false;
    if (currentStep === 2) return false;
    if (currentStep === 0 && !isLoggedIn) return false;
    return true;
  }, [currentStep, isLoggedIn, checkoutExpired]);

  function handleContinue() {
    if (checkoutExpired) return;
    if (currentStep === 1) {
      if (!city.trim() || !district.trim() || !address.trim()) {
        setBillingWarning(true);
        return;
      }
      setBillingWarning(false);
    }
    setCurrentStep((s) => s + 1);
  }

  const fullSaleInfo: CheckoutSaleInfo = {
    ...saleInfo,
    billingCity: currentStep >= 2 ? city : saleInfo.billingCity,
    billingDistrict: currentStep >= 2 ? district : saleInfo.billingDistrict,
    billingAddress: currentStep >= 2 ? address : saleInfo.billingAddress,
    ticketHolders,
    userEmail: profile?.email,
  };

  function onPaymentSuccess(saleData: Record<string, unknown> & { _id?: string }) {
    try {
      localStorage.removeItem(checkoutDeadlineStorageKey(saleInfo.listingId, saleInfo.quantity));
    } catch {
      /* ignore */
    }
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
            !isLoggedIn ? (
              <div className="rounded-2xl text-center">
                <GuestRegisterForm />
              </div>
            ) : (
              <TicketHoldersForm
                quantity={saleInfo.quantity}
                eventTags={eventData.tags}
                onChange={handleHoldersChange}
              />
            )
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

          {currentStep === 2 ? (
            <PaymentCardStep saleInfo={fullSaleInfo} checkoutExpired={checkoutExpired} onSuccess={onPaymentSuccess} />
          ) : null}

          {currentStep === 3 ? (
            <PaymentResultPanel success paymentResult={paymentResult as never} />
          ) : null}
        </div>

        {currentStep !== 3 ? (
          <div className="order-last col-span-1 flex flex-col gap-4 md:gap-5 lg:order-none">
            <div className="rounded-2xl bg-white p-4 shadow md:p-5">
              <div
                className={`rounded-xl border px-3 py-3 text-center md:px-4 md:py-4 ${
                  checkoutExpired
                    ? "border-red-200 bg-red-50"
                    : reserveSecondsLeft <= 120
                      ? "border-amber-200 bg-amber-50"
                      : "border-gray-200/80 bg-stone-50/60"
                }`}
              >
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Rezervasyon süresi</div>
                <div
                  className={`mt-1 font-mono text-2xl font-semibold tabular-nums md:text-3xl ${
                    checkoutExpired ? "text-red-600" : reserveSecondsLeft <= 120 ? "text-amber-800" : "text-gray-900"
                  }`}
                >
                  {formatCountdown(reserveSecondsLeft)}
                </div>
                {checkoutExpired ? (
                  <p className="mt-2 text-xs text-red-700">Süre doldu. Sayfayı yenileyerek tekrar deneyin.</p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">Ödeme adımını bu süre içinde tamamlayın</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow md:p-6">
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

              {checkoutExpired ? (
                <div className="mb-2 mt-3 text-sm font-medium text-red-600">Süre dolduğu için devam edemezsiniz.</div>
              ) : null}
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
