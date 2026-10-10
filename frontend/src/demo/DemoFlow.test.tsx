// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('./demoMode', () => ({ demoMode: true }));
import App from '../App';
import { draftRepository } from '../features/content/draftRepository';
import { verificationRepository } from '../features/verification/verificationRepository';
import { setAccountScope } from '../features/auth/accountScope';

afterEach(() => { cleanup(); localStorage.clear(); setAccountScope(null); vi.unstubAllGlobals(); });

it('opens without authentication, persists content and verification without fetching an API', async () => {
  const fetchSpy = vi.fn(() => { throw new Error('Demo must never call an API'); });
  vi.stubGlobal('fetch', fetchSpy);
  setAccountScope('vercel-demo');
  const draft = await draftRepository.save({ title: 'Local demo video', description: 'A fictional demonstration video.', price: '2.00' });
  const view = render(<MemoryRouter initialEntries={['/content']}><App /></MemoryRouter>);
  expect(await screen.findByText('Local demo video')).toBeInTheDocument();
  expect(screen.getByText(/Frontend demo: data stays/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  await expect(draftRepository.publish(draft.id)).rejects.toThrow(/verification is required/);
  const progress = await verificationRepository.load();
  await verificationRepository.save({ ...progress, status: 'IN_PROGRESS', step: 2, personal: { fullName: 'Demo Creator', dateOfBirth: '1995-01-01', country: 'India' } });
  view.unmount();
  render(<MemoryRouter initialEntries={['/content']}><App /></MemoryRouter>);
  expect(await screen.findByText('Local demo video')).toBeInTheDocument();
  expect((await verificationRepository.load()).step).toBe(2);
  expect(fetchSpy).not.toHaveBeenCalled();
});

it('authentication links open the demo workspace without API requests', async () => {
  const fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy);
  render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>);
  expect(await screen.findByText(/Frontend demo: data stays/)).toBeInTheDocument();
  expect(fetchSpy).not.toHaveBeenCalled();
});
