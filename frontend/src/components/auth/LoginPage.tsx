"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/axios-client";
import { useLocale } from "@/contexts/locale-context";
import { getUserApiBaseBrowser } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";
import {
  AuthInputField,
  AuthOrDivider,
  AuthPasswordToggleButton,
  AuthSocialButtons,
  LockGlyph,
  MailGlyph,
} from "./auth-form-primitives";
import { AuthSplitLayout } from "./AuthSplitLayout";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginPage() {
  const { href } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || href("/");

  const setToken = useAuthStore((s) => s.setToken);
  const setUserType = useAuthStore((s) => s.setUserType);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("E-posta adresinizi giriniz.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }
    if (!password) {
      setError("Şifrenizi giriniz.");
      return;
    }

    setLoading(true);
    try {
      const loginRes = await authApi.login({ email, password });
      const d = loginRes.data;
      if (d.success && d.data?.token) {
        setToken(d.data.token);
        setUserType(d.data.member?.role || "Member");
        router.push(from);
        router.refresh();
      } else {
        setError(d.error || "Giriş başarısız");
      }
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { error?: string; message?: string } } };
      const st = ax.response?.status;
      const msg = ax.response?.data?.error || ax.response?.data?.message;
      if (st === 401) setError("E-posta adresi veya şifre hatalı");
      else if (st === 403) setError("Hesabınız aktif değil");
      else if (st === 404) setError("Kullanıcı bulunamadı");
      else if (st === 500) setError("Sunucu hatası. Lütfen daha sonra tekrar deneyin.");
      else setError(msg || "Giriş işlemi sırasında bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  function google() {
    const base = getUserApiBaseBrowser().replace(/\/$/, "");
    window.location.href = `${base}/social/google`;
  }

  return (
    <AuthSplitLayout
      title="Giriş Yap"
      footerLink={{ href: href("/kayit"), label: "Hesap Oluştur", prefix: "Hesabınız yok mu?" }}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <AuthInputField
          id="login-email"
          label="E-posta"
          type="email"
          autoComplete="email"
          placeholder="E-posta adresinizi girin"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          icon={<MailGlyph />}
        />
        <AuthInputField
          id="login-password"
          label="Şifre"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Şifreniz"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          icon={<LockGlyph />}
          endAdornment={
            <AuthPasswordToggleButton visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          }
        />
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[#52525C]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[#D1D5DB] accent-[#615FFF]"
            />
            Beni hatırla
          </label>
          <Link
            href={href("/sifremi-unuttum")}
            className="text-right font-medium text-[#615FFF] underline underline-offset-2 hover:opacity-90"
          >
            Şifremi unuttum
          </Link>
        </div>
        {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="h-14 w-full rounded-xl bg-[#615FFF] text-base font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-55"
        >
          {loading ? "…" : "Giriş Yap"}
        </button>
      </form>
      <div className="mt-6 space-y-4">
        <AuthOrDivider />
        <AuthSocialButtons onGoogle={google} />
      </div>
    </AuthSplitLayout>
  );
}
