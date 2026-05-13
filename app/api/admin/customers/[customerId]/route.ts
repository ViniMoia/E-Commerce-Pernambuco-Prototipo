import { NextResponse } from 'next/server';
import { ok, err } from '@/lib/api-response';
import { requireAdmin } from '@/lib/auth-admin';
import { getCustomerProfile } from '@/services/customer.service';

export async function GET(
  req: Request,
  { params }: { params: { customerId: string } }
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const profile = await getCustomerProfile(params.customerId);
  if (!profile) return err('Cliente não encontrado.', 404, 'NOT_FOUND');

  const serialized = {
    ...profile,
    metrics: {
      ...profile.metrics,
      totalSpent: Number(profile.metrics.totalSpent),
      averageTicket: Number(profile.metrics.averageTicket),
    },
    orders: profile.orders.map((o) => ({
      ...o,
      total: o.total.toNumber(),
    })),
  };

  return ok(serialized);
}
