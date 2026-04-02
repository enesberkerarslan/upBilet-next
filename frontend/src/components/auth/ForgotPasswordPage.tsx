"use client";

import { useState } from "react";
import { authApi } from "@/lib/api/axios-client";
import { useLocale } from "@/contexts/locale-context";
import { AuthInputField, MailGlyph } from "./auth-form-primitives";
import { AuthSplitLayout } from "./AuthSplitLayout";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ForgotPasswordPage() {
  const { messages } = useLocale();
  const t = messages.auth.forgotPassword;

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError(t.errEmail);
      return;
    }
    if (!isValidEmail(email)) {
      setError(t.errInvalid);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      const d = res.data;
      if (d.success) {
        setDone(true);
      } else {
        setError(d.error || t.errGeneric);
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      const msg = ax.response?.data?.error;
      setError(msg || t.errGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout title={t.title}>
      {done ? (
        <div className="space-y-4">
          <p className="text-center text-sm leading-relaxed text-[#52525C]">{t.success}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <p className="text-center text-sm leading-relaxed text-[#71717A]">{t.blurb}</p>
          <AuthInputField
            id="forgot-email"
            label={t.email}
            type="email"
            autoComplete="email"
            placeholder={t.placeholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            icon={<MailGlyph />}
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
      )}
    </AuthSplitLayout>
  );
}
