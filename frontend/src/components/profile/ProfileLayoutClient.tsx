"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileSidebar, type ProfileHeader } from "@/components/profile/ProfileSidebar";
import { useLocale } from "@/contexts/locale-context";
import { useAuthStore } from "@/stores/auth-store";

function readTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  const row = document.cookie.split("; ").find((x) => x.startsWith("token="));
  if (!row) return null;
  const v = row.slice(6);
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

type Props = {
  children: React.ReactNode;
  /** Sunucuda /profile ile doldurulur; ilk boyutta loader gerekmez */
  initialProfile: ProfileHeader;
};

export function ProfileLayoutClient({ children, initialProfile }: Props) {
  const { href } = useLocale();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<ProfileHeader>(initialProfile);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    const done = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return done;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const c = readTokenCookie();
    if (c && !useAuthStore.getState().token) {
      useAuthStore.getState().setToken(c);
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (readTokenCookie() || useAuthStore.getState().token) return;
    router.replace(href("/giris"));
  }, [hydrated, token, router, href]);

  return (
    <div className="flex w-full flex-col gap-8 overflow-hidden py-10 lg:flex-row lg:items-start lg:justify-start">
      <ProfileSidebar profile={profile} />
      <div className="flex min-h-[500px] w-full flex-1 flex-col items-center">
        <div className="flex w-full flex-1 flex-col items-start justify-start">{children}</div>
      </div>
    </div>
  );
}
