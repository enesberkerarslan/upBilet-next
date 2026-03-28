import { cn } from '@/lib/utils';

type Variant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'orange';

const variants: Record<Variant, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800',
  purple: 'bg-purple-100 text-purple-800',
  /** Satış onaylandı, teslimat bekleniyor */
  orange: 'bg-orange-100 text-orange-900',
};

// sale.status + sale.paymentStatus + üye/ilan durumları (aynı string birden fazla bağlamda kullanılabilir)
export const statusVariant: Record<string, Variant> = {
  active: 'green',
  inactive: 'gray',
  pending: 'yellow',
  approved: 'orange',
  rejected: 'red',
  cancelled: 'red',
  paid: 'green',
  suspended: 'red',
  partial: 'yellow',
  delivered: 'green',
  failed: 'red',
  pending_approval: 'yellow',
  refunded: 'purple',
  broker: 'blue',
  user: 'gray',
  succeeded: 'green',
  completed: 'green',
};

interface BadgeProps {
  label: string;
  variant?: Variant;
}

export default function Badge({ label, variant = 'gray' }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant])}>
      {label}
    </span>
  );
}
