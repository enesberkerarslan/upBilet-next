import { redirect } from "next/navigation";
import type { MemberProfile } from "@/lib/api/member-api";
import { getMemberBearerFromCookies, memberFetchServer } from "@/lib/member-fetch-server";
import { OdemeFlow } from "@/components/payment/OdemeFlow";
import { loadOdemeCheckoutData } from "@/lib/odeme-server-data";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string; listingId?: string; quantity?: string }>;
};

export default async function OdemePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const listingId = sp.id ?? sp.listingId ?? null;
  const quantityRaw = sp.quantity ?? null;

  if (!listingId || !quantityRaw) {
    redirect(`/${locale}`);
  }

  const quantity = Math.max(1, parseInt(quantityRaw, 10) || 1);
  const data = await loadOdemeCheckoutData(listingId, quantity);
  if (!data) {
    redirect(`/${locale}`);
  }

  let initialAuthenticated = false;
  let initialProfile: MemberProfile | null = null;
  if (await getMemberBearerFromCookies()) {
    const pr = await memberFetchServer<{ success?: boolean; member?: MemberProfile }>("/profile");
    if (pr.ok && pr.data?.success && pr.data.member) {
      initialAuthenticated = true;
      initialProfile = pr.data.member;
    }
  }

  return (
    <OdemeFlow
      initialSaleInfo={data.saleInfo}
      initialEventData={data.event}
      initialAuthenticated={initialAuthenticated}
      initialProfile={initialProfile}
    />
  );
}
