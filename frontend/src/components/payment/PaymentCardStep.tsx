"use client";

import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { useEffect, useRef, useState } from "react";
import { getPaymentApiBaseBrowser } from "@/lib/env";
import { apiCreateSale } from "@/lib/api/member-api";
import type { TicketHolderDraft } from "@/components/payment/TicketHoldersForm";

export type CheckoutSaleInfo = {
  listingId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  quantity: number;
  image?: string;
  category: string;
  block?: string;
  row?: string;
  seat?: string;
  listingPrice: number;
  sellerAmount: number;
  serviceFee: string;
  serviceFeeKdv: string;
  totalPrice: string;
  billingCity: string;
  billingDistrict: string;
  billingAddress: string;
  userEmail?: string;
  ticketHolders: TicketHolderDraft[];
};

type Props = {
  saleInfo: CheckoutSaleInfo;
  onSuccess: (saleData: Record<string, unknown> & { _id?: string }) => void;
};

function mapHolders(drafts: TicketHolderDraft[]) {
  return drafts.map((d) => ({
    name: d.name || "",
    surname: d.surname || "",
    nationality: d.nationality || "",
    identityNumber: d.identityNumber || "",
    passoligEmail: d.passoligEmail || "",
    passoligPassword: d.passoligPassword || "",
  }));
}

export function PaymentCardStep({ saleInfo, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [mounting, setMounting] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElRef = useRef<{ unmount: () => void } | null>(null);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  useEffect(() => {
    if (!publishableKey) {
      setMounting(false);
      setErrorMessage("Stripe yapılandırması eksik (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).");
      return;
    }

    let cancelled = false;

    async function setup() {
      setMounting(true);
      setErrorMessage("");
      try {
        const stripe = await loadStripe(publishableKey);
        if (cancelled || !stripe) return;

        const amount = Math.round(parseFloat(saleInfo.totalPrice) * 100);
        const base = getPaymentApiBaseBrowser();
        const res = await fetch(`${base}payment/create-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            currency: "try",
            description: `${saleInfo.eventName} -${saleInfo.category} -  ${saleInfo.quantity} Bilet`,
            metadata: {
              eventId: saleInfo.eventId,
              listingId: saleInfo.listingId,
              quantity: String(saleInfo.quantity),
            },
            receipt_email: saleInfo.userEmail || undefined,
          }),
        });
        const json = (await res.json()) as { clientSecret?: string; error?: string; success?: boolean };
        if (!res.ok || !json.clientSecret) {
          throw new Error(json.error || "Ödeme oturumu oluşturulamadı");
        }

        const elements = stripe.elements({
          clientSecret: json.clientSecret,
          appearance: { theme: "stripe" },
        });
        const paymentElement = elements.create("payment");
        paymentElement.mount("#payment-element");

        stripeRef.current = stripe;
        elementsRef.current = elements;
        paymentElRef.current = paymentElement;
      } catch (e) {
        if (!cancelled) setErrorMessage(e instanceof Error ? e.message : "Ödeme yüklenemedi");
      } finally {
        if (!cancelled) setMounting(false);
      }
    }

    setup();

    return () => {
      cancelled = true;
      try {
        paymentElRef.current?.unmount();
      } catch {
        /* ignore */
      }
      paymentElRef.current = null;
      elementsRef.current = null;
      stripeRef.current = null;
    };
  }, [
    publishableKey,
    saleInfo.eventId,
    saleInfo.listingId,
    saleInfo.quantity,
    saleInfo.totalPrice,
    saleInfo.eventName,
    saleInfo.category,
    saleInfo.userEmail,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) return;

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Ödeme başarısız");
        return;
      }

      const pmTypes = paymentIntent?.payment_method_types;
      const paymentMethod = Array.isArray(pmTypes) && pmTypes.length ? pmTypes[0] : "card";

      const salePayload: Record<string, unknown> = {
        listingId: saleInfo.listingId,
        eventId: saleInfo.eventId,
        quantity: saleInfo.quantity,
        price: saleInfo.listingPrice,
        category: saleInfo.category,
        block: saleInfo.block,
        row: saleInfo.row,
        seat: saleInfo.seat,
        sellerAmount: saleInfo.sellerAmount,
        listingPrice: saleInfo.listingPrice,
        serviceFee: parseFloat(saleInfo.serviceFee),
        serviceFeeKdv: parseFloat(saleInfo.serviceFeeKdv),
        totalPrice: parseFloat(saleInfo.totalPrice),
        paymentStatus: "completed",
        paymentMethod,
        stripePayment: {
          paymentIntentId: paymentIntent?.id,
          clientSecret: paymentIntent?.client_secret,
          paymentMethodId: paymentIntent?.payment_method,
          paymentStatus: paymentIntent?.status,
          paymentCurrency: (paymentIntent?.currency || "try").toUpperCase(),
        },
        transactionId: paymentIntent?.id,
        billingInfo: {
          city: saleInfo.billingCity,
          district: saleInfo.billingDistrict,
          address: saleInfo.billingAddress,
        },
        ticketHolders: mapHolders(saleInfo.ticketHolders),
        eventName: saleInfo.eventName,
      };

      const saleRes = await apiCreateSale(salePayload);
      const saleData: Record<string, unknown> & { _id?: string } = {
        ...saleInfo,
        paymentStatus: "completed",
        paymentMethod,
        listingPrice: saleInfo.listingPrice,
        serviceFee: saleInfo.serviceFee,
        serviceFeeKdv: saleInfo.serviceFeeKdv,
        totalPrice: saleInfo.totalPrice,
        category: saleInfo.category,
        block: saleInfo.block,
        row: saleInfo.row,
        seat: saleInfo.seat,
        quantity: saleInfo.quantity,
        eventName: saleInfo.eventName,
      };

      if (saleRes.success && saleRes.data?._id) {
        saleData._id = saleRes.data._id;
      }

      setSuccessMessage("Ödeme başarılı!");
      onSuccess(saleData);
    } catch {
      setErrorMessage("Ödeme işlemi sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  const subtotal = saleInfo.listingPrice * saleInfo.quantity;

  return (
    <div className="flex justify-center md:justify-end">
      <div className="w-full max-w-xl rounded-lg bg-white p-4 md:p-8">
        <div className="mb-4 flex flex-col items-start text-left md:mb-6">
          <div className="mb-1 text-sm text-gray-700">UpBilet satıcısına ödeme yapın</div>
          <button
            type="button"
            className="mb-2 mt-2 rounded bg-indigo-600 px-3 py-2 text-sm text-white md:px-4"
            onClick={() => setShowDetails((v) => !v)}
          >
            Detayları İncele <span>▼</span>
          </button>
        </div>

        {showDetails ? (
          <div className="mb-4 md:mb-5">
            <div className="mb-3 flex items-center justify-between md:mb-4">
              <span className="text-sm text-gray-600 md:text-base">Toplam Bilet Fiyatı</span>
              <span className="text-sm text-gray-900 md:text-base">₺{subtotal}</span>
            </div>
            <div className="mb-3 flex items-center justify-between text-xs md:mb-4">
              <span className="text-gray-600">Hizmet Bedeli :</span>
              <span className="text-gray-900">₺{saleInfo.serviceFee}</span>
            </div>
            <div className="mb-3 flex items-center justify-between text-xs md:mb-4">
              <span className="text-gray-600">Hizmet Bedeli KDV :</span>
              <span className="text-gray-900">₺{saleInfo.serviceFeeKdv}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900 md:text-lg">Toplam</span>
              <span className="text-lg font-bold text-gray-900 md:text-xl">₺{saleInfo.totalPrice}</span>
            </div>
          </div>
        ) : null}

        {mounting ? (
          <div className="flex justify-center py-8 text-sm text-gray-500">Ödeme formu yükleniyor…</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div id="payment-element" className="mb-4" />
            <button
              type="submit"
              disabled={loading || !publishableKey}
              className="mt-4 w-full rounded-lg bg-black py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 md:mt-6"
            >
              {loading ? "Ödeme İşleniyor..." : "Öde"}
            </button>
            {successMessage ? <div className="mt-2 text-sm text-green-600">{successMessage}</div> : null}
            {errorMessage ? <div className="mt-2 text-sm text-red-600">{errorMessage}</div> : null}
          </form>
        )}
        <div className="mt-3 text-center text-xs text-gray-400 md:mt-4">
          <span className="font-semibold">stripe</span> tarafından desteklenmektedir
          <br />
        </div>
      </div>
    </div>
  );
}
