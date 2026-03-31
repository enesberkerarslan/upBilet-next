"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthPasswordToggleButton, LockGlyph } from "@/components/auth/auth-form-primitives";
import { ProfilePanelHeader } from "@/components/profile/ProfilePanelHeader";
import { useLocale } from "@/contexts/locale-context";
import { apiChangePassword, apiGetProfile, apiUpdateProfile, type MemberProfile } from "@/lib/api/member-api";

function formatDateForInput(dateString: string | undefined) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

const emptyPersonalForm = {
  name: "",
  surname: "",
  birthDate: "",
  nationality: "Türkiye Cumhuriyeti",
  identityNumber: "",
  gender: "" as string,
  passoligEmail: "",
  passoligPassword: "",
  phone: "",
  email: "",
};

function formFromMember(profileData: MemberProfile) {
  return {
    name: profileData.name || "",
    surname: profileData.surname || "",
    birthDate: formatDateForInput(profileData.birthDate),
    nationality: profileData.nationality || "Türkiye Cumhuriyeti",
    identityNumber: profileData.identityNumber || "",
    gender: profileData.gender || "",
    passoligEmail: profileData.passoligEmail || "",
    passoligPassword: profileData.passoligPassword || "",
    phone: profileData.phone || "",
    email: profileData.email || "",
  };
}

type Note = { type: "success" | "error"; message: string } | null;

function ModalShell({
  open,
  onClose,
  title,
  titleBorder,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleBorder?: boolean;
  closeLabel: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-4">
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-zinc-100 p-8 shadow-xl"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <button
          type="button"
          className="absolute right-6 top-6 text-xl text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label={closeLabel}
        >
          &times;
        </button>
        <div
          className={`text-base font-semibold ${titleBorder ? "mb-6 border-b border-gray-200 pb-4" : "mb-6"}`}
        >
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

type PersonalProps = { initialMember?: MemberProfile };

export function ProfilePersonalPanel({ initialMember }: PersonalProps = {}) {
  const { t } = useLocale();
  const fromServer = initialMember !== undefined;
  const [isLoading, setIsLoading] = useState(!fromServer);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Note>(null);

  const [form, setForm] = useState(() => (initialMember ? formFromMember(initialMember) : emptyPersonalForm));

  const [showPassoPassword, setShowPassoPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [modalOldPw, setModalOldPw] = useState("");
  const [modalNewPw, setModalNewPw] = useState("");
  const [modalRepeatPw, setModalRepeatPw] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  const flash = useCallback((note: Note) => {
    setNotification(note);
    if (note) {
      setTimeout(() => setNotification(null), 3000);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiGetProfile();
      if (response.success && response.member) {
        setForm(formFromMember(response.member));
      } else {
        setError(response.error ?? t("profile.errorGeneric"));
      }
    } catch {
      setError(t("profile.errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (fromServer) return;
    void fetchProfile();
  }, [fromServer, fetchProfile]);

  async function updateProfile() {
    try {
      const birthDate = form.birthDate ? new Date(form.birthDate).toISOString() : undefined;
      const payload: Partial<MemberProfile> = {
        name: form.name,
        surname: form.surname,
        birthDate,
        nationality: form.nationality,
        identityNumber: form.identityNumber,
        passoligEmail: form.passoligEmail,
        passoligPassword: form.passoligPassword,
      };
      if (form.gender === "male" || form.gender === "female") payload.gender = form.gender;
      else payload.gender = undefined;
      const res = await apiUpdateProfile(payload);
      if (res.success) {
        flash({ type: "success", message: t("profile.savedOk") });
      } else {
        flash({ type: "error", message: res.error ?? t("profile.errorGeneric") });
      }
    } catch {
      flash({ type: "error", message: t("profile.errorGeneric") });
    }
  }

  async function handlePasswordSave() {
    if (modalNewPw !== modalRepeatPw) return;
    try {
      const res = await apiChangePassword(modalOldPw, modalNewPw);
      if (res.success) {
        setShowPasswordModal(false);
        setModalOldPw("");
        setModalNewPw("");
        setModalRepeatPw("");
        flash({ type: "success", message: t("profile.passwordUpdatedOk") });
      } else {
        flash({ type: "error", message: res.error ?? t("profile.errorGeneric") });
      }
    } catch {
      flash({ type: "error", message: t("profile.errorGeneric") });
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-[#D1D5DB] bg-white px-4 py-3 text-[15px] text-[#18181B] outline-none transition-shadow focus:border-[#615FFF]/50 focus:ring-2 focus:ring-[#615FFF]/20";
  const passwordRowInputClass =
    "h-14 w-full rounded-2xl border border-[#D1D5DB] bg-white pl-11 pr-[3.25rem] text-[15px] text-[#18181B] outline-none transition-shadow placeholder:text-[#9CA3AF] focus:border-[#615FFF]/50 focus:ring-2 focus:ring-[#615FFF]/20";
  const labelClass = "mb-1 block text-xs text-gray-500";

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-2xl bg-white">
        <ProfilePanelHeader title={t("profile.personalTitle")} />
        <div className="px-2 pb-6 pt-2 md:px-8 md:pb-8">
        {isLoading ? (
          <div className="flex min-h-[min(50dvh,420px)] flex-col items-center justify-center py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500" aria-hidden />
            <p className="mt-3 text-sm text-gray-600">{t("profile.loadingProfile")}</p>
          </div>
        ) : error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{error}</p>
            <button type="button" onClick={fetchProfile} className="mt-2 text-sm text-red-600 hover:text-red-700">
              {t("profile.retry")}
            </button>
          </div>
        ) : (
          <>
            <div>
              <div className="mb-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>{t("profile.name")}</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("profile.surname")}</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={form.surname}
                    onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("profile.birthDate")}</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.birthDate}
                    onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>{t("profile.nationality")}</label>
                  <div className="relative">
                    <select
                      className={`${inputClass} appearance-none`}
                      value={form.nationality}
                      onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
                    >
                      <option value="Türkiye Cumhuriyeti">🇹🇷 Türkiye Cumhuriyeti</option>
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      ▼
                    </span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("profile.tckn")}</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={form.identityNumber}
                    onChange={(e) => setForm((f) => ({ ...f, identityNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("profile.genderLabel")}</label>
                  <select
                    className={inputClass}
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="">{t("profile.genderSelect")}</option>
                    <option value="male">{t("profile.genderMale")}</option>
                    <option value="female">{t("profile.genderFemale")}</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}
        </div>
      </div>

      {!isLoading && !error ? (
        <>
          <div className="mt-4 flex w-full flex-col gap-4 rounded-2xl bg-white p-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-base font-semibold">{t("profile.passoTitle")}</div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t("profile.passoEmailField")}</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.passoligEmail}
                  onChange={(e) => setForm((f) => ({ ...f, passoligEmail: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>{t("profile.passoPassword")}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden>
                    <LockGlyph />
                  </span>
                  <input
                    type={showPassoPassword ? "text" : "password"}
                    className={passwordRowInputClass}
                    value={form.passoligPassword}
                    onChange={(e) => setForm((f) => ({ ...f, passoligPassword: e.target.value }))}
                  />
                  <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
                    <AuthPasswordToggleButton
                      visible={showPassoPassword}
                      onToggle={() => setShowPassoPassword((v) => !v)}
                      ariaLabelShow={t("profile.passwordShowAria")}
                      ariaLabelHide={t("profile.passwordHideAria")}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={updateProfile}
                  className="rounded-full bg-indigo-500 px-10 py-2 font-semibold text-white transition hover:bg-indigo-600"
                >
                  {t("profile.save")}
                </button>
              </div>
              {notification ? (
                <div
                  className={`rounded-lg p-3 text-sm font-medium transition-all duration-300 ${
                    notification.type === "success"
                      ? "border border-green-200 bg-green-50 text-green-700"
                      : "border border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {notification.message}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-left">
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.63212 4.76019L7.29658 4.00521C7.07718 3.51157 6.96748 3.26473 6.80342 3.07584C6.59781 2.83912 6.3298 2.66495 6.02998 2.57321C5.79073 2.5 5.52063 2.5 4.98042 2.5C4.19017 2.5 3.79504 2.5 3.46335 2.65191C3.07263 2.83085 2.71978 3.2194 2.57918 3.6255C2.45983 3.97024 2.49403 4.32453 2.56239 5.03308C3.29017 12.5752 7.42509 16.7101 14.9671 17.4378C15.6757 17.5062 16.03 17.5404 16.3747 17.4211C16.7809 17.2805 17.1694 16.9276 17.3484 16.5369C17.5002 16.2052 17.5002 15.8101 17.5002 15.0198C17.5002 14.4796 17.5002 14.2095 17.427 13.9702C17.3353 13.6704 17.1611 13.4024 16.9244 13.1968C16.7355 13.0327 16.4887 12.9231 15.995 12.7037L15.24 12.3681C14.7055 12.1305 14.4381 12.0117 14.1665 11.9859C13.9065 11.9612 13.6445 11.9977 13.4011 12.0924C13.1469 12.1914 12.9222 12.3787 12.4727 12.7532C12.0254 13.126 11.8017 13.3124 11.5284 13.4122C11.286 13.5007 10.9657 13.5336 10.7105 13.4959C10.4226 13.4535 10.2022 13.3358 9.76129 13.1001C8.38962 12.3671 7.63318 11.6107 6.90013 10.2389C6.66453 9.79808 6.54673 9.57758 6.5043 9.28975C6.46669 9.0345 6.49948 8.71417 6.58799 8.47192C6.68784 8.19857 6.87425 7.97488 7.24707 7.5275C7.62159 7.07807 7.80886 6.85335 7.90787 6.59909C8.00262 6.35578 8.03909 6.09367 8.01437 5.83373C7.98853 5.5621 7.86972 5.2948 7.63212 4.76019Z"
                  stroke="#18181B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <div className="text-sm font-medium">{t("profile.cardPhoneTitle")}</div>
                <div className="pt-0.5 text-xs text-gray-500">{form.phone || t("profile.noPhone")}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-left">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1.66675 5L7.4276 8.26414C9.55141 9.4675 10.4487 9.4675 12.5726 8.26414L18.3334 5"
                  stroke="#18181B"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M1.67989 11.229C1.73436 13.7837 1.76161 15.0609 2.70421 16.0072C3.64681 16.9533 4.95869 16.9863 7.58244 17.0522C9.1995 17.0929 10.8007 17.0929 12.4177 17.0522C15.0415 16.9863 16.3533 16.9533 17.296 16.0072C18.2386 15.0609 18.2658 13.7837 18.3202 11.229C18.3378 10.4076 18.3378 9.5911 18.3202 8.76968C18.2658 6.21507 18.2386 4.93776 17.296 3.99157C16.3533 3.04537 15.0415 3.01242 12.4177 2.94649C10.8007 2.90586 9.1995 2.90586 7.58243 2.94648C4.95869 3.0124 3.64681 3.04536 2.70421 3.99156C1.7616 4.93775 1.73436 6.21506 1.67988 8.76968C1.66236 9.5911 1.66237 10.4076 1.67989 11.229Z"
                  stroke="#18181B"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <div className="text-sm font-medium">{t("profile.cardEmailTitle")}</div>
                <div className="pt-0.5 text-xs text-gray-500">{form.email}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 text-left transition hover:bg-gray-50"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12.9168 12.083C15.6782 12.083 17.9168 9.84442 17.9168 7.08301C17.9168 4.32158 15.6782 2.08301 12.9168 2.08301C10.1554 2.08301 7.91683 4.32158 7.91683 7.08301C7.91683 7.81668 8.07485 8.51342 8.35875 9.14109L2.0835 15.4163V17.9163H4.5835V16.2497H6.25016V14.583H7.91683L10.8587 11.6411C11.4864 11.925 12.1832 12.083 12.9168 12.083Z"
                  stroke="#18181B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5833 5.41699L13.75 6.25033"
                  stroke="#18181B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <div className="text-sm font-medium">{t("profile.cardPasswordTitle")}</div>
                <div className="pt-0.5 text-xs text-gray-500">{t("profile.passwordHintStatic")}</div>
              </div>
            </button>
          </div>
        </>
      ) : null}

      <ModalShell
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={t("profile.modalPasswordTitle")}
        titleBorder
        closeLabel={t("header.close")}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (modalNewPw !== modalRepeatPw) return;
            void handlePasswordSave();
          }}
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden>
              <LockGlyph />
            </span>
            <input
              type={showOld ? "text" : "password"}
              placeholder={t("profile.placeholderOldPw")}
              className={passwordRowInputClass}
              value={modalOldPw}
              onChange={(e) => setModalOldPw(e.target.value)}
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
              <AuthPasswordToggleButton
                visible={showOld}
                onToggle={() => setShowOld((v) => !v)}
                ariaLabelShow={t("profile.passwordShowAria")}
                ariaLabelHide={t("profile.passwordHideAria")}
              />
            </div>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden>
              <LockGlyph />
            </span>
            <input
              type={showNew ? "text" : "password"}
              placeholder={t("profile.placeholderNewPw")}
              className={passwordRowInputClass}
              value={modalNewPw}
              onChange={(e) => setModalNewPw(e.target.value)}
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
              <AuthPasswordToggleButton
                visible={showNew}
                onToggle={() => setShowNew((v) => !v)}
                ariaLabelShow={t("profile.passwordShowAria")}
                ariaLabelHide={t("profile.passwordHideAria")}
              />
            </div>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden>
              <LockGlyph />
            </span>
            <input
              type={showRepeat ? "text" : "password"}
              placeholder={t("profile.placeholderRepeatPw")}
              className={passwordRowInputClass}
              value={modalRepeatPw}
              onChange={(e) => setModalRepeatPw(e.target.value)}
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
              <AuthPasswordToggleButton
                visible={showRepeat}
                onToggle={() => setShowRepeat((v) => !v)}
                ariaLabelShow={t("profile.passwordShowAria")}
                ariaLabelHide={t("profile.passwordHideAria")}
              />
            </div>
          </div>
          {modalNewPw && modalRepeatPw && modalNewPw !== modalRepeatPw ? (
            <p className="mb-2 text-xs text-red-500">{t("profile.pwMismatch")}</p>
          ) : null}
          <button
            type="submit"
            disabled={modalNewPw !== modalRepeatPw}
            className="mt-2 h-14 w-full rounded-2xl bg-[#615FFF] text-base font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {t("profile.save")}
          </button>
        </form>
      </ModalShell>
    </div>
  );
}
