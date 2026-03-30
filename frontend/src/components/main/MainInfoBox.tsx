export function MainInfoBox() {
  return (
    <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3">
      <div className="flex flex-col items-center rounded-[20px] bg-white p-6 text-center shadow-md">
        <div className="mb-4 h-12 w-12 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
        <h3 className="mb-3 text-xl font-semibold">Hızlı ve Şeffaf Satış Sistemi</h3>
        <p className="text-sm text-gray-600">
          Elindeki biletleri birkaç adımda satışa çıkar. UpBilet, ilanını binlerce kullanıcıya ulaştırır. Ödemeler
          etkinlik sonrası garantili şekilde yapılır.
        </p>
      </div>
      <div className="flex flex-col items-center rounded-[20px] bg-white p-6 text-center shadow-md">
        <div className="mb-4 h-12 w-12 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h3 className="mb-3 text-xl font-semibold">Güvenli Bilet Alışverişi</h3>
        <p className="text-sm text-gray-600">
          Hayalindeki etkinliğe giden biletini huzurla seç! Fiyatları karşılaştır, güvenilir satıcılardan al.
        </p>
      </div>
      <div className="flex flex-col items-center rounded-[20px] bg-white p-6 text-center shadow-md">
        <div className="mb-4 h-12 w-12 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="mb-3 text-xl font-semibold">Her Adımda Yanındayız</h3>
        <p className="text-sm text-gray-600">
          UpBilet&apos;te tüm işlemler izlenebilir, tüm satıcılar doğrulanır. Alıcı ve satıcı arasında güvene dayalı
          bir sistem oluştururuz.
        </p>
      </div>
    </div>
  );
}
