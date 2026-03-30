import Link from "next/link";

const BRAND = "#615FFF";

export function AuthSplitLayout({
  title,
  subtitle,
  children,
  footerLink,
  footerText,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerLink?: { href: string; label: string; prefix?: string };
  footerText?: string;
}) {
  return (
    <div className="flex w-full flex-1 flex-col justify-center bg-[#F4F4F5] py-8 md:py-10">
      <div className="mx-auto w-full max-w-[min(100%,34rem)] px-4 sm:px-5">
        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-9 shadow-sm sm:p-10 md:p-12">
          <header className="mb-9 text-center md:mb-10">
            <h1 className="text-[1.65rem] font-bold tracking-tight text-[#18181B] md:text-[1.85rem]">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-sm font-medium" style={{ color: BRAND }}>
                {subtitle}
              </p>
            ) : null}
          </header>
          {children}
          {footerLink ? (
            <p className="mt-8 text-center text-sm text-[#71717A]">
              {footerLink.prefix}{" "}
              <Link
                href={footerLink.href}
                className="font-semibold text-[#615FFF] underline decoration-1 underline-offset-2 hover:opacity-90"
              >
                {footerLink.label}
              </Link>
            </p>
          ) : null}
          {footerText ? <p className="mt-4 text-center text-xs text-[#71717A]">{footerText}</p> : null}
        </div>
      </div>
    </div>
  );
}
