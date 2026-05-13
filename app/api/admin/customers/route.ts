import { NextResponse } from 'next/server';
import { ok, err } from '@/lib/api-response';
import { requireAdmin } from '@/lib/auth-admin';
import { listCustomersQuerySchema } from '@/lib/validators/customer.validators';
import { listCustomers } from '@/services/customer.service';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const parsed = listCustomersQuerySchema.safeParse(
    Object.fromEntries(new URL(req.url).searchParams)
  );
  if (!parsed.success) return err('Parâmetros inválidos.', 400, 'VALIDATION_ERROR');

  return ok(
    await listCustomers({
      ...parsed.data,
      lojaID: auth.user.lojaID,
    })
  );
}
