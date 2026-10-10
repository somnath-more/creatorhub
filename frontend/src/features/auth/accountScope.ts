let accountId: string | null = null;
let revision = 0;
export function setAccountScope(id: string | null) {
  if (id !== accountId) { accountId = id; revision++; }
}
export function accountKey(key: string) {
  return accountId === null ? key : `${key}:${accountId}`;
}
export function captureAccount() {
  const captured = revision;
  return () => {
    if (captured !== revision) throw new Error("Your account changed. Please reopen this page.");
  };
}
