'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  Tag,
  Ticket,
  ShoppingCart,
  Users,
  FileText,
  MapPin,
  Image,
  Home,
  X,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events', label: 'Etkinlikler', icon: CalendarDays },
  { href: '/tags', label: 'Etiketler', icon: Tag },
  { href: '/listings', label: 'İlanlar', icon: Ticket },
  { href: '/sales', label: 'Satışlar', icon: ShoppingCart },
  { href: '/members', label: 'Üyeler', icon: Users },
  { href: '/support', label: 'Destek', icon: MessageCircle },
  { href: '/blogs', label: 'Blog', icon: FileText },
  { href: '/venues', label: 'Mekan Yapısı', icon: MapPin },
  { href: '/media', label: 'Medya', icon: Image },
  { href: '/homepage', label: 'Anasayfa Ayarı', icon: Home },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-indigo-600">upBilet</span>
        <button
          className="lg:hidden p-1 rounded-md text-gray-400 hover:bg-gray-100"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={18} className={active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-indigo-400" />}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">upBilet Admin Panel</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {content}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        {content}
      </aside>
    </>
  );
}
