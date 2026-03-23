/**
 * Detect duplicate complaints:
 * Two tickets from same ward with same category within 24 hours
 */
export function findDuplicates(tickets) {
  const duplicateIds = new Set();
  const DAY_MS = 24 * 3600000;

  for (let i = 0; i < tickets.length; i++) {
    for (let j = i + 1; j < tickets.length; j++) {
      const a = tickets[i];
      const b = tickets[j];
      if (
        a.ward_id === b.ward_id &&
        (a.category || '').toLowerCase() === (b.category || '').toLowerCase()
      ) {
        const tA = new Date(a.created_at).getTime();
        const tB = new Date(b.created_at).getTime();
        if (Math.abs(tA - tB) < DAY_MS) {
          duplicateIds.add(a.id);
          duplicateIds.add(b.id);
        }
      }
    }
  }

  return duplicateIds;
}
