import { Suspense } from "react";
import { OdemeFlow } from "@/components/payment/OdemeFlow";

type Props = {
  searchParams: Promise<{ id?: string; listingId?: string; quantity?: string }>;
};

function OdemeFallback() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center bg-white">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      <p className="text-sm text-gray-600">Yükleniyor…</p>
    </div>
  );
}

async function OdemeWithParams({ searchParams }: Props) {
  const sp = await searchParams;
  const listingId = sp.id ?? sp.listingId ?? null;
  const quantityRaw = sp.quantity ?? null;
  return <OdemeFlow listingId={listingId} quantityRaw={quantityRaw} />;
}

export default function OdemePage(props: Props) {
  return (
    <Suspense fallback={<OdemeFallback />}>
      <OdemeWithParams {...props} />
    </Suspense>
  );
}
