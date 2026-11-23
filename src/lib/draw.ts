/**
 * Assigns each giver a receiver so that nobody gets themselves and no
 * excluded pair (in either direction) is matched. Returns null when the
 * exclusions make it impossible.
 */
export function drawAssignments(
  ids: string[],
  exclusions: Array<[string, string]>,
  random: () => number = Math.random,
): Map<string, string> | null {
  if (ids.length < 3) return null;

  const blocked = new Set<string>();
  for (const [a, b] of exclusions) {
    blocked.add(`${a}>${b}`);
    blocked.add(`${b}>${a}`);
  }
  const allowed = (giver: string, receiver: string) =>
    giver !== receiver && !blocked.has(`${giver}>${receiver}`);

  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Most-constrained givers first keeps the backtracking fast.
  const givers = shuffle(ids).sort(
    (x, y) =>
      ids.filter((r) => allowed(x, r)).length -
      ids.filter((r) => allowed(y, r)).length,
  );

  const result = new Map<string, string>();
  const taken = new Set<string>();

  const solve = (i: number): boolean => {
    if (i === givers.length) return true;
    const giver = givers[i];
    for (const receiver of shuffle(ids)) {
      if (taken.has(receiver) || !allowed(giver, receiver)) continue;
      result.set(giver, receiver);
      taken.add(receiver);
      if (solve(i + 1)) return true;
      taken.delete(receiver);
      result.delete(giver);
    }
    return false;
  };

  return solve(0) ? result : null;
}
