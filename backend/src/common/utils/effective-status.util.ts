/**
 * Stored status only moves on explicit actions (revoke), so an ACTIVE row
 * past its `expiresAt` is really expired. Use this when returning rows to
 * clients so what they see matches what `checkAccess` will answer.
 */
export function withEffectiveStatus<
  T extends { status: string; expiresAt: Date | null },
>(row: T, now: Date = new Date()): T {
  if (row.status === 'ACTIVE' && row.expiresAt && row.expiresAt <= now) {
    return { ...row, status: 'EXPIRED' };
  }
  return row;
}
