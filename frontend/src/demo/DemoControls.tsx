import { Link } from 'react-router-dom';
import { Button } from '../components/atoms/Button';
import { accountKey } from '../features/auth/accountScope';
import { DRAFT_STORAGE_KEY } from './localDraftRepository';
import { VERIFICATION_KEY } from './localVerificationRepository';
import { PURCHASE_STORAGE_KEY } from './demoPurchases';
import { useState } from 'react';

export function DemoControls() {
  const [error, setError] = useState('');
  function reset(empty: boolean) {
    if (!window.confirm('Replace this browser’s demo content, purchases and verification progress? This cannot be undone.')) return;
    try {
      for (const key of [DRAFT_STORAGE_KEY, PURCHASE_STORAGE_KEY]) {
        if (empty) localStorage.setItem(accountKey(key), '[]');
        else localStorage.removeItem(accountKey(key));
      }
      localStorage.removeItem(accountKey(VERIFICATION_KEY));
      window.location.assign('/');
    } catch { setError('Browser storage is unavailable. Allow site storage and retry.'); }
  }
  return <details className="mb-5 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm">
    <summary className="cursor-pointer font-semibold">Demo controls</summary>
    <p className="my-3">Sample data includes 12 videos and 30 synthetic purchases. Reset removes your local demo changes and verification progress.</p>
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={() => reset(false)}>Reset sample data</Button>
      <Button onClick={() => reset(true)}>Start with empty data</Button>
      <Link to="/?demo=error" className="p-2 underline">Dashboard error</Link>
      <Link to="/?demo=empty" className="p-2 underline">No-purchase dashboard</Link>
      <Link to="/content?analytics=sample" className="p-2 underline">Sample content metrics</Link>
      <Link to="/content?analytics=error" className="p-2 underline">Analytics error</Link>
      <Link to="/" className="p-2 underline">Normal dashboard</Link>
    </div>
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
  </details>;
}
