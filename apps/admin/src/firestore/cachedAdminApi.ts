import {
  adminApi,
  type AdminCustomer,
  type AdminPolicyRow,
  type KycQueueItem,
  type PaymentLedgerRow,
} from '../api';
import { ADMIN_CACHE_DOCS, loadWithAdminCache } from './adminCache';

export const cachedAdminApi = {
  listCustomers: (force?: boolean) =>
    loadWithAdminCache<{ customers: AdminCustomer[]; count: number }>(
      ADMIN_CACHE_DOCS.customers,
      () => adminApi.listCustomers(),
      { force },
    ),

  listKycQueue: (force?: boolean) =>
    loadWithAdminCache<{ queue: KycQueueItem[]; count: number; pending_count: number }>(
      ADMIN_CACHE_DOCS.kycQueue,
      () => adminApi.listKycQueue(),
      { force },
    ),

  listPolicies: (force?: boolean) =>
    loadWithAdminCache<{ policies: AdminPolicyRow[]; count: number }>(
      ADMIN_CACHE_DOCS.policies,
      () => adminApi.listPolicies(),
      { force },
    ),

  listPayments: (force?: boolean) =>
    loadWithAdminCache<{ payments: PaymentLedgerRow[]; count: number }>(
      ADMIN_CACHE_DOCS.payments,
      () => adminApi.listPayments(),
      { force },
    ),
};

export function filterCustomers(
  customers: AdminCustomer[],
  search: string,
  filter: 'all' | 'verified' | 'in_progress',
): AdminCustomer[] {
  let rows = customers;
  if (filter !== 'all') {
    rows = rows.filter((c) => c.kyc_status === filter);
  }
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (c) =>
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.mobile_number.includes(q) ||
      c.id.toLowerCase().includes(q),
  );
}
