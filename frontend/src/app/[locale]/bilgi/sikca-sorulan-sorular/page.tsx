import type { Metadata } from "next";
import { FaqItem } from "@/components/bilgi/FaqItem";
import { SssContactPanel } from "@/components/bilgi/SssContactPanel";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular - UpBilet",
  description:
    "UpBilet hakkında merak ettiğiniz sorular ve yanıtları. Bilet alış-satış işlemleri hakkında detaylı bilgiler.",
};

export default function Page() {
  return (
    <div className="flex w-full flex-col">
      <div className="container w-full px-0 pt-5 pb-5">
        <div className="w-full rounded-lg bg-white px-4 py-6 shadow-sm sm:px-6 sm:py-8 lg:px-8">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8 sm:text-2xl lg:text-left lg:text-4xl">
            Sıkça Sorulan Sorular
          </h1>

          <div className="w-full">
            <div className="mb-8 sm:mb-10">
              <h2 className="mb-4 flex items-center justify-center text-xl font-bold text-gray-800 sm:mb-6 sm:text-2xl lg:justify-start">
                <span className="mr-2 text-xl sm:text-2xl">🎫</span>
                Bilet Alıcıları İçin
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <div className="space-y-3 sm:space-y-4">
                  <FaqItem
                    question="UpBilet üzerinden nasıl bilet satın alabilirim?"
                    answer="İlgilendiğiniz etkinliğin sayfasına giderek kategori veya koltuk seçimi yapabilir, satın alma adımlarını takip ederek işleminizi kolayca tamamlayabilirsiniz."
                  />
                  <FaqItem
                    question="Biletler nasıl teslim ediliyor?"
                    answer="Satın aldığınız bilete göre farklı teslimat yöntemleri uygulanabilir:<br><br><strong>E‑bilet:</strong> PDF formatında e‑posta adresinize gönderilir.<br><br><strong>Passolig Bileti:</strong> Kimlik ya da Passolig numaranıza tanımlanır."
                  />
                  <FaqItem
                    question="Biletim ne zaman teslim edilir?"
                    answer="E‑biletler, satıcının yüklemesinden sonra sistemimiz tarafından size otomatik olarak gönderilir.<br><br>Mobil ve Passolig biletlerde teslimat, etkinlik tarihine 24–72 saat kala gerçekleşebilir."
                  />
                  <FaqItem
                    question="Farklı kategorilerde birden fazla bilet alabilir miyim?"
                    answer="Evet. Stok durumuna göre dilediğiniz sayıda bileti farklı kategorilerde satın alabilirsiniz."
                  />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <FaqItem
                    question="Fiyatlar neden değişken?"
                    answer="UpBilet, satıcıların ilan oluşturabildiği bir pazar yeridir. Fiyatlar satıcılara göre değişebilir. Koltuk konumu, kategori, etkinlik yaklaşma süresi gibi faktörler fiyatı etkiler."
                  />
                  <FaqItem
                    question="Aldığım bileti iade edebilir miyim?"
                    answer="Etkinlik iptali haricinde iade yapılamaz."
                  />
                  <FaqItem
                    question="Etkinlik iptal olursa ne olur?"
                    answer="Etkinlik tamamen iptal edilirse, ödediğiniz ücret kesintisiz olarak iade edilir."
                  />
                  <FaqItem
                    question="Yanlış kategori seçtim, değişiklik mümkün mü?"
                    answer="Destek ekibimizle info@upbilet.com adresi üzerinden iletişime geçebilirsiniz. Satıcının onayıyla değişiklik sağlanabilir."
                  />
                </div>
              </div>
            </div>

            <div className="mb-8 sm:mb-10">
              <h2 className="mb-4 flex items-center justify-center text-xl font-bold text-gray-800 sm:mb-6 sm:text-2xl lg:justify-start">
                <span className="mr-2 text-xl sm:text-2xl">🧾</span>
                Bilet Satıcıları İçin
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <div className="space-y-3 sm:space-y-4">
                  <FaqItem
                    question="UpBilet üzerinden nasıl satış yapabilirim?"
                    answer='Hesabınıza giriş yaptıktan sonra "Bilet Sat" sekmesine tıklayarak bilet bilgilerinizi sisteme girebilir ve ilanınızı oluşturabilirsiniz.'
                  />
                  <FaqItem
                    question="Satış sonrası bilet gönderimini nasıl yapacağım?"
                    answer="Satış gerçekleştikten sonra sistem sizi yönlendirecektir. Biletin türüne göre (e-bilet, Passolig) ilgili adımları takip ederek gönderimi tamamlamanız gerekir."
                  />
                  <FaqItem
                    question="Satışlardan ne zaman ödeme alırım?"
                    answer="Ödemeniz, etkinliğin gerçekleşmesinden sonraki ilk ödeme tarihinde kayıtlı banka hesabınıza gönderilir."
                  />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <FaqItem
                    question="Satışımı iptal edebilir miyim?"
                    answer="Etkinlik gerçekleşmeden önce, ilanınız satılmadıysa iptal edebilirsiniz. Satılmış ilanların iptali mümkün değildir ve yaptırım uygulanabilir."
                  />
                  <FaqItem
                    question="Biletimi nasıl daha hızlı satarım?"
                    answer="Net açıklama ve doğru kategori seçimi yapın.<br><br>Biletlerinizi erken yükleyin."
                  />
                </div>
              </div>
            </div>

            <div className="mb-8 sm:mb-10">
              <h2 className="mb-4 flex items-center justify-center text-xl font-bold text-gray-800 sm:mb-6 sm:text-2xl lg:justify-start">
                <span className="mr-2 text-xl sm:text-2xl">🔐</span>
                Güvenlik & Destek
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <div className="space-y-3 sm:space-y-4">
                  <FaqItem
                    question="Alışverişim güvende mi?"
                    answer="Evet. UpBilet, 256-bit SSL şifreleme teknolojisi ile tüm veri akışını korur. Ödemeler güvenli ödeme altyapısı üzerinden gerçekleştirilir."
                  />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <FaqItem
                    question="Destek ekibine nasıl ulaşırım?"
                    answer="Her türlü soru ve yardım talebiniz için info@upbilet.com adresine mail atabilir ya da kullanıcı panelinizden canlı destek talebinde bulunabilirsiniz."
                  />
                </div>
              </div>
            </div>

            <SssContactPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
