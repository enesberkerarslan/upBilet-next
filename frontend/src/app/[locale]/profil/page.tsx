import type { Locale } from "@/i18n";
import { getMessages, translate } from "@/i18n";
import { profileDefaultHref } from "@/lib/profile-path";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

type MetaProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: MetaProps): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const messages = getMessages(locale);
  return {
    title: `${translate(messages, "profile.title")} | UpBilet`,
    description: translate(messages, "profile.metaDescription"),
  };
}

type Props = { params: Promise<{ locale: string }> };

export default async function ProfilIndexPage({ params }: Props) {
  const { locale } = await params;
  redirect(profileDefaultHref(locale as Locale));
}
