import { redirect } from "next/navigation";
import { ProfileLayoutClient } from "@/components/profile/ProfileLayoutClient";
import type { Locale } from "@/i18n";
import { localizedPath } from "@/lib/locale-path";
import { memberFetchServer } from "@/lib/member-fetch-server";
import type { MemberProfile } from "@/lib/api/member-api";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export default async function ProfilShellLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;

  const res = await memberFetchServer<{ success: boolean; member?: MemberProfile; error?: string }>("/profile");
  if (!res.ok || !res.data?.success || !res.data.member) {
    redirect(localizedPath(locale, "/giris"));
  }

  const m = res.data.member;
  const initialProfile = {
    name: m.name ?? "",
    surname: m.surname ?? "",
    phone: m.phone ?? "",
    email: m.email ?? "",
    isLoading: false,
  };

  return <ProfileLayoutClient initialProfile={initialProfile}>{children}</ProfileLayoutClient>;
}
