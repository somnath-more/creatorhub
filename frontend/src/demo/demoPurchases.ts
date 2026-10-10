import { z } from 'zod';
import { accountKey } from '../features/auth/accountScope';
import { seedPurchases } from './seedData';
export const PURCHASE_STORAGE_KEY = 'creatorhub.purchases.v1';
const schema = z.array(z.object({
  id: z.string(), date: z.iso.datetime(), content: z.string(), amountCents: z.number().int().nonnegative(),
  country: z.string(), status: z.enum(['Completed', 'Pending', 'Failed']),
}));
export function demoPurchases(now: Date) {
  try {
    const key = accountKey(PURCHASE_STORAGE_KEY);
    const raw = localStorage.getItem(key);
    if (raw !== null) return schema.parse(JSON.parse(raw));
    const records = seedPurchases(now);
    localStorage.setItem(key, JSON.stringify(records));
    return records;
  } catch { throw new Error('Demo purchases could not be read or saved. Existing data has not been changed. Use demo controls to reset it.'); }
}
