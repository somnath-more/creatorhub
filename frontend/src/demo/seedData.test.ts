// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { seedContent, seedPurchases } from './seedData';
import { demoPurchases, PURCHASE_STORAGE_KEY } from './demoPurchases';
import { accountKey, setAccountScope } from '../features/auth/accountScope';
afterEach(() => { localStorage.clear(); setAccountScope(null); });
it('provides 12 valid videos and 30 purchases with all required statuses', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  const content = seedContent(now); const purchases = seedPurchases(now);
  expect(content).toHaveLength(12); expect(purchases).toHaveLength(30);
  expect(new Set(content.map(item => item.id)).size).toBe(12);
  expect(new Set(purchases.map(item => item.id)).size).toBe(30);
  expect(new Set(content.map(item => item.status))).toEqual(new Set(['DRAFT', 'PUBLISHED', 'SCHEDULED']));
  expect(new Set(purchases.map(item => item.status))).toEqual(new Set(['Completed', 'Pending', 'Failed']));
  expect(purchases.every(purchase => content.some(item => item.title === purchase.content && item.status === 'PUBLISHED'))).toBe(true);
});
it('persists purchase dates, preserves explicit empty data and reports corruption', () => {
  setAccountScope('vercel-demo');
  const original = demoPurchases(new Date('2026-10-10T12:00:00Z'));
  expect(demoPurchases(new Date('2026-11-10T12:00:00Z'))).toEqual(original);
  localStorage.setItem(accountKey(PURCHASE_STORAGE_KEY), '[]');
  expect(demoPurchases(new Date())).toEqual([]);
  localStorage.setItem(accountKey(PURCHASE_STORAGE_KEY), '{broken');
  expect(() => demoPurchases(new Date())).toThrow(/Existing data has not been changed/);
  expect(localStorage.getItem(accountKey(PURCHASE_STORAGE_KEY))).toBe('{broken');
});
