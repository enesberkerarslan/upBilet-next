import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez Politikası - UpBilet",
  description: "UpBilet çerez kullanımı ve gizlilik politikası hakkında detaylı bilgiler.",
};

export default function Page() {
  return (
    <div className="flex w-full flex-col">
      <div className="mx-auto w-full max-w-7xl pt-5">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Çerez Politikası</h1>

          <div className="prose prose-lg max-w-none">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">Çerezler Nedir?</h2>
            <p className="mb-6 text-gray-600">
              Çerezler, web sitelerini ziyaret ettiğinizde cihazınıza (bilgisayar, tablet, telefon) kaydedilen küçük
              metin dosyalarıdır. Çerezler, web sitesinin düzgün çalışmasını sağlar ve kullanıcı deneyimini geliştirir.
            </p>

            <h2 className="mb-4 text-2xl font-semibold text-gray-800">Hangi Çerezleri Kullanıyoruz?</h2>
            <div className="mb-6">
              <h3 className="mb-3 text-xl font-medium text-gray-700">Zorunlu Çerezler</h3>
              <p className="mb-4 text-gray-600">
                Bu çerezler web sitesinin temel işlevlerini yerine getirmesi için gereklidir. Bu çerezler olmadan site
                düzgün çalışmaz.
              </p>
              <ul className="mb-6 list-inside list-disc space-y-2 text-gray-600">
                <li>Oturum yönetimi çerezleri</li>
                <li>Güvenlik çerezleri</li>
                <li>Kullanıcı tercihleri çerezleri</li>
              </ul>

              <h3 className="mb-3 text-xl font-medium text-gray-700">Analitik Çerezler</h3>
              <p className="mb-4 text-gray-600">
                Bu çerezler web sitemizin nasıl kullanıldığını anlamamıza yardımcı olur. Ziyaretçi sayıları, popüler
                sayfalar ve kullanıcı davranışları hakkında bilgi toplar.
              </p>

              <h3 className="mb-3 text-xl font-medium text-gray-700">İşlevsel Çerezler</h3>
              <p className="mb-4 text-gray-600">
                Bu çerezler tercihlerinizi hatırlar ve size daha kişiselleştirilmiş bir deneyim sunar.
              </p>
            </div>

            <h2 className="mb-4 text-2xl font-semibold text-gray-800">Çerez Süresi</h2>
            <div className="mb-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-2 font-semibold text-gray-800">Oturum Çerezleri</h4>
                  <p className="text-sm text-gray-600">Tarayıcı kapatıldığında otomatik olarak silinir</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-2 font-semibold text-gray-800">Kalıcı Çerezler</h4>
                  <p className="text-sm text-gray-600">Belirli bir süre (genellikle 1 yıl) cihazınızda kalır</p>
                </div>
              </div>
            </div>

            <h2 className="mb-4 text-2xl font-semibold text-gray-800">Çerezleri Nasıl Kontrol Edebilirsiniz?</h2>
            <div className="mb-6">
              <p className="mb-4 text-gray-600">Çerezleri kontrol etmek için aşağıdaki yöntemleri kullanabilirsiniz:</p>
              <ul className="list-inside list-disc space-y-2 text-gray-600">
                <li>
                  <strong>Tarayıcı Ayarları:</strong> Çoğu tarayıcı çerezleri yönetme imkanı sunar
                </li>
                <li>
                  <strong>Site Tercihleri:</strong> Sitemizde çıkan çerez bildirimini kullanarak
                </li>
                <li>
                  <strong>Üçüncü Taraf Servisleri:</strong> Google Analytics gibi servislerin kendi opt-out
                  sayfalarını kullanarak
                </li>
              </ul>
            </div>

            <h2 className="mb-4 text-2xl font-semibold text-gray-800">Popüler Tarayıcılarda Çerez Ayarları</h2>
            <div className="mb-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border-l-4 border-blue-500 bg-gray-50 p-4 pl-4">
                  <h4 className="mb-2 font-semibold text-gray-800">Chrome</h4>
                  <p className="text-sm text-gray-600">Ayarlar → Gizlilik ve güvenlik → Çerezler ve diğer site verileri</p>
                </div>
                <div className="rounded-lg border-l-4 border-orange-500 bg-gray-50 p-4 pl-4">
                  <h4 className="mb-2 font-semibold text-gray-800">Firefox</h4>
                  <p className="text-sm text-gray-600">Seçenekler → Gizlilik ve Güvenlik → Çerezler ve Site Verileri</p>
                </div>
                <div className="rounded-lg border-l-4 border-green-500 bg-gray-50 p-4 pl-4">
                  <h4 className="mb-2 font-semibold text-gray-800">Safari</h4>
                  <p className="text-sm text-gray-600">Tercihler → Gizlilik → Çerezleri ve web sitesi verileri yönet</p>
                </div>
                <div className="rounded-lg border-l-4 border-purple-500 bg-gray-50 p-4 pl-4">
                  <h4 className="mb-2 font-semibold text-gray-800">Edge</h4>
                  <p className="text-sm text-gray-600">Ayarlar → Çerezler ve site izinleri → Çerezleri yönet ve sil</p>
                </div>
              </div>
            </div>

            <h2 className="mb-4 text-2xl font-semibold text-gray-800">Üçüncü Taraf Çerezleri</h2>
            <p className="mb-6 text-gray-600">
              Sitemizde bazı üçüncü taraf servisleri kullanmaktayız. Bu servisler kendi çerezlerini kullanabilirler. Bu
              servislerin gizlilik politikalarını incelemenizi öneririz:
            </p>
            <ul className="mb-6 list-inside list-disc space-y-2 text-gray-600">
              <li>Google Analytics - Web sitesi analizi</li>
              <li>İlgili ödeme sağlayıcıları</li>
              <li>Sosyal medya entegrasyonları</li>
            </ul>

            <h2 className="mb-4 text-2xl font-semibold text-gray-800">İletişim</h2>
            <p className="mb-4 text-gray-600">Çerez politikamız hakkında sorularınız varsa bizimle iletişime geçebilirsiniz:</p>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-gray-700">
                <strong>Email:</strong>{" "}
                <a href="mailto:destek@upbilet.com" className="text-blue-600 hover:underline">
                  destek@upbilet.com
                </a>
              </p>
            </div>

            <div className="mt-8 rounded-lg bg-gray-100 p-4">
              <p className="text-sm text-gray-600">
                <strong>Son Güncelleme:</strong> 15 Ocak 2025
                <br />
                Bu çerez politikası değişiklik gösterebilir. Güncel bilgiler için düzenli olarak kontrol ediniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
