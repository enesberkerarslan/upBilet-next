"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { currentLocaleFromPathname, localizedPath } from "@/lib/locale-path";
import { useAuthStore } from "@/stores/auth-store";

export function GoogleOAuthHandler() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const setUserType = useAuthStore((s) => s.setUserType);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    (async () => {
      try {
        const res = await fetch("/api/auth/google-callback", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        const token = data?.member?.token;
        const role = data?.member?.member?.role || "Member";
        const loc = currentLocaleFromPathname(window.location.pathname);
        const home = localizedPath(loc, "/");
        if (data?.success && token) {
          setToken(token);
          setUserType(role);
          router.replace(home);
          window.location.reload();
        } else {
          router.replace(home);
        }
      } catch {
        const loc = currentLocaleFromPathname(window.location.pathname);
        router.replace(localizedPath(loc, "/"));
      }
    })();
  }, [router, setToken, setUserType]);

  return null;
}
