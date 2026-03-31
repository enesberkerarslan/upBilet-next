"use client";

import { useRouter } from "next/navigation";
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
  UserGlyph,
} from "./auth-form-primitives";
import { AuthPhoneField } from "./AuthPhoneField";
import { AuthSplitLayout } from "./AuthSplitLayout";
import { combineInternationalPhone, countNationalDigits, getPhoneCountry } from "@/lib/phone-countries";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function RegisterPage() {
  const { href, locale } = useLocale();
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const setUserType = useAuthStore((s) => s.setUserType);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNational, setPhoneNational] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const next: string[] = [];
    if (!name.trim()) next.push("Adınızı giriniz.");
    if (!surname.trim()) next.push("Soyadınızı giriniz.");
    if (!email.trim()) next.push("E-posta adresinizi giriniz.");
    else if (!isValidEmail(email)) next.push("Lütfen geçerli bir e-posta adresi giriniz.");
    const nationalDigits = countNationalDigits(phoneNational);
    if (!nationalDigits) next.push("Telefon numaranızı giriniz.");
    else if (nationalDigits < 8)
      next.push("Lütfen telefon numaranızı eksiksiz girin.");
    if (!password) next.push("Lütfen şifrenizi giriniz.");
    else if (password.length < 6) next.push("Şifreniz en az 6 karakter olmalıdır.");
    else {
      if (!passwordConfirm.trim()) next.push("Şifre tekrarını giriniz.");
      else if (password !== passwordConfirm) next.push("Şifreler birbiriyle eşleşmiyor.");
    }
    if (!acceptTerms) next.push("Kullanım koşullarını kabul etmelisiniz.");

    if (next.length) {
      setErrors(next);
      return;
    }

    const dial = getPhoneCountry("TR")?.dial ?? "+90";
    const fullPhone = combineInternationalPhone(dial, phoneNational);

    setLoading(true);
    try {
      const registerRes = await authApi.register({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        phone: fullPhone,
        password,
      });
      const d = registerRes.data;
      if (d.success && d.token) {
        setToken(d.token);
        setUserType(d.member?.role || "Member");
        router.push(href("/"));
        router.refresh();
      } else {
        setErrors([d.error || "Kayıt işlemi başarısız"]);
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setErrors([ax.response?.data?.error || "Kayıt işlemi sırasında bir hata oluştu"]);
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
      title="Kayıt Ol"
      footerLink={{ href: href("/giris"), label: "Giriş Yap", prefix: "Zaten hesabınız var mı?" }}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <AuthInputField
          id="reg-name"
          label="Ad"
          autoComplete="given-name"
          placeholder="Adınız"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors([]);
          }}
          icon={<UserGlyph />}
        />
        <AuthInputField
          id="reg-surname"
          label="Soyad"
          autoComplete="family-name"
          placeholder="Soyadınız"
          value={surname}
          onChange={(e) => {
            setSurname(e.target.value);
            setErrors([]);
          }}
          icon={<UserGlyph />}
        />
        <AuthInputField
          id="reg-email"
          label="E-posta"
          type="email"
          autoComplete="email"
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors([]);
          }}
          icon={<MailGlyph />}
        />
        <AuthPhoneField
          id="reg-phone"
          label="Telefon"
          value={phoneNational}
          onChange={(v) => {
            setPhoneNational(v);
            setErrors([]);
          }}
          placeholder={locale === "en" ? "Mobile number" : "5XX XXX XX XX"}
        />
        <AuthInputField
          id="reg-password"
          label="Şifre"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors([]);
          }}
          icon={<LockGlyph />}
          endAdornment={
            <AuthPasswordToggleButton visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          }
        />
        <AuthInputField
          id="reg-password-confirm"
          label="Şifre tekrar"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Şifrenizi tekrar girin"
          value={passwordConfirm}
          onChange={(e) => {
            setPasswordConfirm(e.target.value);
            setErrors([]);
          }}
          icon={<LockGlyph />}
          endAdornment={
            <AuthPasswordToggleButton visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          }
        />
        <label className="flex cursor-pointer items-start gap-2 text-sm text-[#52525C]">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => {
              setAcceptTerms(e.target.checked);
              setErrors([]);
            }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#615FFF]"
          />
          <span>
            Kullanım koşulları ve KVKK metnini okudum, kabul ediyorum.
            <span className="text-red-600">*</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-[#71717A]">
          <input
            type="checkbox"
            checked={acceptMarketing}
            onChange={(e) => setAcceptMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#615FFF]"
          />
          <span>Kampanya ve duyurular için iletişime geçilmesine izin veriyorum.</span>
        </label>
        {errors.length > 0 ? (
          errors.length === 1 ? (
            <p className="text-center text-xs text-red-600">{errors[0]}</p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-left text-xs text-red-600">
              {errors.map((msg, i) => (
                <li key={`${i}-${msg}`}>{msg}</li>
              ))}
            </ul>
          )
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="h-14 w-full rounded-xl bg-[#615FFF] text-base font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-55"
        >
          {loading ? "…" : "Kayıt Ol"}
        </button>
      </form>
      <div className="mt-6 space-y-4">
        <AuthOrDivider />
        <AuthSocialButtons onGoogle={google} mode="register" />
      </div>
    </AuthSplitLayout>
  );
}
