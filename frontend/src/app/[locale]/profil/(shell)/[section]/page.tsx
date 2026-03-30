import type { Locale } from "@/i18n";
import { getMessages, translate } from "@/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileAddressPanel } from "@/components/profile/ProfileAddressPanel";
import { ProfileBankPanel } from "@/components/profile/ProfileBankPanel";
import { ProfileListingsPanel } from "@/components/profile/ProfileListingsPanel";
import { ProfilePaymentsPanel } from "@/components/profile/ProfilePaymentsPanel";
import { ProfilePersonalPanel } from "@/components/profile/ProfilePersonalPanel";
import { ProfileSoldPanel } from "@/components/profile/ProfileSoldPanel";
import { ProfileSupportPanel } from "@/components/profile/ProfileSupportPanel";
import { ProfileTicketsPanel } from "@/components/profile/ProfileTicketsPanel";
import type {
  AddressRecord,
  BankAccountRecord,
  ListingRecord,
  ListingsPagination,
  MemberProfile,
  SaleRecord,
  SupportTopicListRow,
} from "@/lib/api/member-api";
import { memberFetchServer } from "@/lib/member-fetch-server";
import { isProfileSection, type ProfileSection } from "@/lib/profile-path";

type Props = { params: Promise<{ locale: string; section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, section } = await params;
  const locale = raw as Locale;
  if (!isProfileSection(section)) {
    return { title: "UpBilet" };
  }
  const messages = getMessages(locale);
  const titleBase = translate(messages, `profile.sectionMetaTitle.${section}`);
  return {
    title: `${titleBase} | UpBilet`,
    description: translate(messages, "profile.metaDescription"),
  };
}

export default async function ProfilSectionPage({ params }: Props) {
  const { section } = await params;
  if (!isProfileSection(section)) notFound();

  const s = section as ProfileSection;

  switch (s) {
    case "biletlerim": {
      const r = await memberFetchServer<{ success: boolean; data?: SaleRecord[] }>("/sales");
      const list = r.ok && r.data?.success && Array.isArray(r.data.data) ? r.data.data : [];
      return <ProfileTicketsPanel initialPurchases={list} />;
    }
    case "sattigim-biletler": {
      const r = await memberFetchServer<{ success: boolean; data?: SaleRecord[] }>("/sales/my-sales");
      const list = r.ok && r.data?.success && Array.isArray(r.data.data) ? r.data.data : [];
      return <ProfileSoldPanel initialSales={list} />;
    }
    case "ilanlarim": {
      const r = await memberFetchServer<{
        success: boolean;
        listings?: ListingRecord[];
        pagination?: ListingsPagination;
      }>("/listings?page=1&limit=10");
      const listingsSsrOk = Boolean(
        r.ok && r.data?.success && Array.isArray(r.data.listings)
      );
      if (listingsSsrOk && r.data?.listings) {
        return (
          <ProfileListingsPanel
            initialListings={r.data.listings}
            initialPagination={r.data.pagination ?? null}
            initialPage={1}
          />
        );
      }
      return <ProfileListingsPanel />;
    }
    case "odemelerim": {
      const r = await memberFetchServer<{ success: boolean; member?: MemberProfile }>("/profile");
      const periods =
        r.ok && r.data?.success && r.data.member?.paymentPeriods && Array.isArray(r.data.member.paymentPeriods)
          ? r.data.member.paymentPeriods
          : [];
      return <ProfilePaymentsPanel initialPeriods={periods} />;
    }
    case "banka-hesaplarim": {
      const r = await memberFetchServer<{ success: boolean; member?: MemberProfile }>("/profile");
      const accounts =
        r.ok && r.data?.success && r.data.member?.bankAccounts && Array.isArray(r.data.member.bankAccounts)
          ? (r.data.member.bankAccounts as BankAccountRecord[])
          : [];
      return <ProfileBankPanel initialAccounts={accounts} />;
    }
    case "adreslerim": {
      const r = await memberFetchServer<{ success: boolean; member?: MemberProfile }>("/profile");
      const addresses =
        r.ok && r.data?.success && r.data.member?.addresses && Array.isArray(r.data.member.addresses)
          ? (r.data.member.addresses as AddressRecord[])
          : [];
      return <ProfileAddressPanel initialAddresses={addresses} />;
    }
    case "kisisel-bilgilerim": {
      const r = await memberFetchServer<{ success: boolean; member?: MemberProfile }>("/profile");
      const member = r.ok && r.data?.success && r.data.member ? r.data.member : undefined;
      return <ProfilePersonalPanel initialMember={member} />;
    }
    case "destek": {
      const r = await memberFetchServer<{ success: boolean; data?: SupportTopicListRow[] }>("/support/topics");
      const supportSsrOk = Boolean(r.ok && r.data?.success && Array.isArray(r.data.data));
      if (supportSsrOk && r.data?.data) {
        return <ProfileSupportPanel initialTopics={r.data.data} />;
      }
      return <ProfileSupportPanel />;
    }
    default:
      notFound();
  }
}
