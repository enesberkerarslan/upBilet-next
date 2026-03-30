"use client";

import { useState } from "react";
import { authApi } from "@/lib/api/axios-client";
import { useAuthStore } from "@/stores/auth-store";

export function GuestRegisterForm() {
  const setToken = useAuthStore((s) => s.setToken);
  const setUserType = useAuthStore((s) => s.setUserType);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    passwordConfirm: "",
    termsAccepted: false,
    marketingConsent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleRegister() {
    const next: Record<string, string> = {};
    if (!form.firstName) next.firstName = "Adınızı giriniz.";
    if (!form.lastName) next.lastName = "Soyadınızı giriniz.";
    if (!form.phone) next.phone = "Telefonunuzu giriniz.";
    if (!form.email) next.email = "E-posta adresinizi giriniz.";
    if (!form.password) next.password = "Şifre giriniz.";
    else if (form.password.length < 6) next.password = "Şifre en az 6 karakter olmalıdır.";
    if (!form.passwordConfirm) next.passwordConfirm = "Şifreyi tekrar giriniz.";
    if (form.password && form.passwordConfirm && form.password !== form.passwordConfirm) {
      next.passwordConfirm = "Şifreler eşleşmiyor.";
    }
    if (!form.termsAccepted) next.termsAccepted = "Kullanım Koşulları ve KVKK kabul edilmelidir.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await authApi.register({
        name: form.firstName,
        surname: form.lastName,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });
      const d = res.data;
      if (d.success && d.token) {
        setToken(d.token);
        setUserType(d.member?.role || "Member");
      } else {
        setErrors({ email: d.error || "Kayıt başarısız" });
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      const msg = ax.response?.data?.error;
      if (msg === "Bu e-posta ile zaten bir hesap var.") setErrors({ email: msg });
      else setErrors({ email: "Hata oluştu, lütfen tekrar deneyiniz." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 md:p-6">
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <div>
          <label className="text-sm text-gray-600">Adınız</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-200 bg-white px-4 py-2.5"
          />
          {errors.firstName ? <span className="text-xs text-red-500">{errors.firstName}</span> : null}
        </div>
        <div>
          <label className="text-sm text-gray-600">Soyadınız</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-200 bg-white px-4 py-2.5"
          />
          {errors.lastName ? <span className="text-xs text-red-500">{errors.lastName}</span> : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:mt-4 md:grid-cols-2 md:gap-4">
        <div>
          <label className="text-sm text-gray-600">Telefonunuz</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-200 bg-white px-4 py-2.5"
          />
          {errors.phone ? <span className="text-xs text-red-500">{errors.phone}</span> : null}
        </div>
        <div>
          <label className="text-sm text-gray-600">E-Posta Adresi</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1 w-full rounded-md border border-gray-200 bg-white px-4 py-2.5"
          />
          {errors.email ? <span className="text-xs text-red-500">{errors.email}</span> : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:mt-4 md:grid-cols-2 md:gap-4">
        <div>
          <label className="text-sm text-gray-600">Şifre</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-4 py-2.5"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              aria-label="Şifreyi göster"
            >
              {showPassword ? "Gizle" : "Göster"}
            </button>
          </div>
          {errors.password ? <span className="text-xs text-red-500">{errors.password}</span> : null}
        </div>
        <div>
          <label className="text-sm text-gray-600">Şifre (Tekrardan)</label>
          <div className="relative">
            <input
              type={showPasswordConfirm ? "text" : "password"}
              value={form.passwordConfirm}
              onChange={(e) => setForm((f) => ({ ...f, passwordConfirm: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-200 bg-white px-4 py-2.5"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              aria-label="Şifreyi göster"
            >
              {showPasswordConfirm ? "Gizle" : "Göster"}
            </button>
          </div>
          {errors.passwordConfirm ? <span className="text-xs text-red-500">{errors.passwordConfirm}</span> : null}
        </div>
      </div>

      <div className="mt-3 md:mt-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#7950F2]"
            checked={form.termsAccepted}
            onChange={(e) => setForm((f) => ({ ...f, termsAccepted: e.target.checked }))}
          />
          <span className="text-sm">
            Kullanım Koşulları ve KVKK&apos;yı kabul ediyorum.
            <span className="text-[#FB2C36]">*</span>
          </span>
        </div>
        {errors.termsAccepted ? <span className="text-xs text-red-500">{errors.termsAccepted}</span> : null}

        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#7950F2]"
            checked={form.marketingConsent}
            onChange={(e) => setForm((f) => ({ ...f, marketingConsent: e.target.checked }))}
          />
          <span className="text-sm">Benimle e-posta, telefon yoluyla iletişime geçmenize izin veriyorum.</span>
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleRegister}
        className="mt-4 w-full rounded-lg bg-[#7950F2] py-3.5 text-base font-medium text-white hover:bg-[#6039D1] disabled:opacity-60 md:mt-6 md:text-lg"
      >
        {loading ? "…" : "Hesabı Oluştur"}
      </button>
    </div>
  );
}
