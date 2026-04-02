import type { Metadata } from "next";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "Kullanım Sözleşmesi - UpBilet",
  description: "UpBilet kullanım sözleşmesi ve kullanıcı yükümlülükleri hakkında detaylı bilgiler.",
};

export default function Page() {
  const file = path.join(process.cwd(), "src/content/kullanim-sozlesmesi-inner.html");
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(
    "<div >",
    '<div class="mb-8 rounded-lg border-l-4 border-blue-500 bg-gray-50 p-6">',
  );
  html = html.replace(/<h1 >/g, '<h1 class="mb-4 text-2xl font-bold text-gray-900">');
  html = html.replace(
    /<div >\s*<p><strong>Web Sitesi:/,
    '<div class="space-y-2 text-gray-600"><p><strong>Web Sitesi:',
  );
  html = html.replace(
    '<span id="contact-info-email"></span>',
    '<a href="mailto:" class="text-blue-600 underline hover:opacity-80">info@upbilet.com</a>',
  );

  return (
    <div className="flex w-full flex-col">
      <div className="mx-auto w-full max-w-7xl pt-5 pb-5">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Kullanım Sözleşmesi</h1>
          <div className="legal-html max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
