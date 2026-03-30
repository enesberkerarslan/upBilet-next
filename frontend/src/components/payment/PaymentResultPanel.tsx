"use client";

import { formatDateTR } from "@/lib/date";

type PaymentResult = {
  _id?: string;
  eventName?: string;
  category?: string;
  block?: string;
  row?: string;
  seat?: string;
  quantity?: number;
  listingPrice?: number;
  serviceFee?: string;
  serviceFeeKdv?: string;
  totalPrice?: string;
  paymentStatus?: string;
  paymentMethod?: string;
};

type Props = {
  success: boolean;
  paymentResult: PaymentResult | null;
};

function formatPrice(price: string | number | undefined) {
  if (price === undefined || price === null) return "0";
  const num = typeof price === "string" ? parseFloat(price) : price;
  return num.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PaymentResultPanel({ success, paymentResult }: Props) {
  if (!success || !paymentResult) return null;

  const paymentStatusText =
    paymentResult.paymentStatus === "completed"
      ? "Tamamlandı"
      : paymentResult.paymentStatus === "pending"
        ? "Beklemede"
        : paymentResult.paymentStatus === "failed"
          ? "Başarısız"
          : paymentResult.paymentStatus || "";

  const paymentMethodText =
    paymentResult.paymentMethod === "card"
      ? "Kredi Kartı"
      : paymentResult.paymentMethod === "bank_transfer"
        ? "Banka Havalesi"
        : paymentResult.paymentMethod === "cash"
          ? "Nakit"
          : paymentResult.paymentMethod || "";

  const formattedDate = formatDateTR(new Date().toISOString());

  return (
    <div className="mx-auto mt-10 w-full max-w-4xl rounded-lg bg-white p-6 text-left">
      <div className="rounded-lg p-8 text-center">
        <div className="mb-4 text-green-500">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 48 48" stroke="currentColor">
            <circle cx="24" cy="24" r="22" stroke="#22C55E" strokeWidth="2" />
            <path
              d="M16 24l6 6 10-10"
              stroke="#22C55E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold">Bilet Başarıyla Satın Alındı</h2>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
        <span>{formattedDate}</span>
        <span>{paymentResult._id}</span>
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 17v-6h6v6m2 4H7a2 2 0 01-2-2V7a2 2 0 012-2h3.28a2 2 0 011.42.59l1.71 1.7A2 2 0 0014.72 8H19a2 2 0 012 2v10a2 2 0 01-2 2z"
            />
          </svg>
          Etkinlik
        </span>
      </div>

      <div className="mb-2 flex items-center justify-center gap-2 text-lg">
        <b>{paymentResult.eventName}</b>
      </div>
      <div className="mb-2 flex justify-between text-gray-700">
        <span>
          Koltuk:{" "}
          <b>
            {paymentResult.category}
            {paymentResult.block ? `, ${paymentResult.block}` : ""}
          </b>
        </span>
        <span>
          Miktar: <b>{paymentResult.quantity}</b>
        </span>
      </div>
      {paymentResult.row ? (
        <div className="mb-2 flex justify-between text-gray-700">
          <span>
            Sıra: <b>{paymentResult.row}</b>
          </span>
        </div>
      ) : null}
      {paymentResult.seat ? (
        <div className="mb-2 flex justify-between text-gray-700">
          <span>
            Koltuk No: <b>{paymentResult.seat}</b>
          </span>
        </div>
      ) : null}

      <div className="mt-4 border-t pt-4">
        <div className="mb-2 flex justify-between text-gray-700">
          <span>Bilet Fiyatı:</span>
          <span>
            <b>{formatPrice(paymentResult.listingPrice)} TL</b>
          </span>
        </div>
        <div className="mb-2 flex justify-between text-gray-700">
          <span>Hizmet Bedeli:</span>
          <span>
            <b>{formatPrice(paymentResult.serviceFee)} TL</b>
          </span>
        </div>
        <div className="mb-2 flex justify-between text-gray-700">
          <span>KDV:</span>
          <span>
            <b>{formatPrice(paymentResult.serviceFeeKdv)} TL</b>
          </span>
        </div>
        <div className="flex justify-between border-t pt-2 text-lg font-semibold text-gray-900">
          <span>Toplam:</span>
          <span>
            <b>{formatPrice(paymentResult.totalPrice)} TL</b>
          </span>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="mb-2 flex justify-between text-gray-700">
          <span>Ödeme Durumu:</span>
          <span className="text-green-600">
            <b>{paymentStatusText}</b>
          </span>
        </div>
        <div className="mb-2 flex justify-between text-gray-700">
          <span>Ödeme Yöntemi:</span>
          <span>
            <b>{paymentMethodText}</b>
          </span>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <div className="mb-1 flex items-start gap-2">
          <span className="mt-1">ℹ</span>
          Biletiniz satın alma işlemi tamamlandı. Bilet bilgileriniz e-posta adresinize gönderilecektir.
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1">ℹ</span>
          Etkinlik günü biletinizi giriş kapısında göstermeniz yeterli olacaktır.
        </div>
      </div>
    </div>
  );
}
