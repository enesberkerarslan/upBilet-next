"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/axios-client";
import { useLocale } from "@/contexts/locale-context";
import { useAuthStore } from "@/stores/auth-store";
import {
  AuthInputField,
  AuthPasswordToggleButton,
  LockGlyph,
} from "./auth-form-primitives";
import { AuthSplitLayout } from "./AuthSplitLayout";
import Link from "next/link";

export function ResetPasswordPage() {
  const { href, messages } = useLocale();
  const t = messages.auth.resetPassword;
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";

  const setToken = useAuthStore((s) => s.setToken);
  const setUserType = useAuthStore((s) => s.setUserType);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError(t.errToken);
      return;
    }
    if (!password) {
      setError(t.errPwRequired);
      return;
    }
    if (password.length < 6) {
      setError(t.errShort);
      return;
    }
    if (!passwordConfirm.trim()) {
      setError(t.errConfirm);
      return;
    }
    if (password !== passwordConfirm) {
      setError(t.errMatch);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(token, { password });
      const d = res.data;
      if (d.success && d.token) {
        setToken(d.token);
        setUserType("Member");
        router.push(href("/"));
        router.refresh();
      } else {
        setError(d.error || t.errGeneric);
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax.response?.data?.error || t.errGeneric);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthSplitLayout title={t.title}>
        <p className="mb-6 text-center text-sm text-[#52525C]">{t.errToken}</p>
        <p className="text-center">
          <Link
            href={href("/sifremi-unuttum")}
            className="font-semibold text-[#615FFF] underline decoration-1 underline-offset-2 hover:opacity-90"
          >
            {t.requestAgain}
          </Link>
        </p>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout title={t.title}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <p className="text-center text-sm text-[#71717A]">{t.blurb}</p>
        <AuthInputField
          id="reset-password"
          label={t.password}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder={t.phPw}
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
        <AuthInputField
          id="reset-password-confirm"
          label={t.confirm}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder={t.phCf}
          value={passwordConfirm}
          onChange={(e) => {
            setPasswordConfirm(e.target.value);
            setError("");
          }}
          icon={<LockGlyph />}
          endAdornment={
            <AuthPasswordToggleButton visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          }
        />
        {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="h-14 w-full rounded-xl bg-[#615FFF] text-base font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-55"
        >
          {loading ? t.loading : t.submit}
        </button>
      </form>
    </AuthSplitLayout>
  );
}
