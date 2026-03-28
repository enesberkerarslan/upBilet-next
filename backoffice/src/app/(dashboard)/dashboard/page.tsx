import { CalendarDays, Ticket, ShoppingCart, Users } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { serverFetch } from '@/lib/server-fetch';

async function getCount(path: string, direct = false): Promise<number> {
  try {
    if (direct) {
      const arr = await serverFetch<unknown[]>(path);
      return Array.isArray(arr) ? arr.length : 0;
    }
    const res = await serverFetch<{ data: unknown[] }>(path);
    return res.data?.length ?? 0;
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const [events, listings, sales, members] = await Promise.all([
    getCount('/events/get-all-events', true),   // direkt array
    getCount('/listings/get-all-listings', true), // direkt array
    getCount('/sales'),                           // { success, data }
    getCount('/members/get-all-members'),         // { success, data }
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Genel bakış ve istatistikler</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Etkinlikler" value={events} icon={<CalendarDays size={20} />} color="indigo" />
        <StatCard title="İlanlar" value={listings} icon={<Ticket size={20} />} color="blue" />
        <StatCard title="Satışlar" value={sales} icon={<ShoppingCart size={20} />} color="green" />
        <StatCard title="Üyeler" value={members} icon={<Users size={20} />} color="yellow" />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Hızlı Erişim</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Etkinlik Ekle', href: '/events', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
              { label: 'Üyeleri Gör', href: '/members', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { label: 'Satışları Gör', href: '/sales', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
              { label: 'İlanları Gör', href: '/listings', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
            ].map((item) => (
              <a key={item.href} href={item.href} className={`p-4 rounded-lg text-sm font-medium transition-colors ${item.color}`}>
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Sistem Bilgisi</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">API Sunucusu</dt>
              <dd className="font-medium text-gray-900">{process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Panel Versiyonu</dt>
              <dd className="font-medium text-gray-900">v1.0.0</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
