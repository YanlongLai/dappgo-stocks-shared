export const COLLAPSIBLE_INTERVAL_MS = 180_000;
export const BANNER_PAGE_SETTLE_MS = 3_000;

/** One clock across reading pages; background/blocked time does not advance it. */
export function createBottomBannerPolicy(now: () => number = () => performance.now()) {
  const owners = new Set<symbol>();
  let elapsed = 0;
  let activeSince: number | null = null;
  let nextOpportunity = COLLAPSIBLE_INTERVAL_MS;
  let quietAfter = 0;
  const activeTime = () => elapsed + (activeSince === null ? 0 : Math.max(0, now() - activeSince));
  return {
    setActive(owner: symbol, active: boolean) {
      if (active === owners.has(owner)) return;
      elapsed = activeTime();
      if (active) owners.add(owner); else owners.delete(owner);
      activeSince = owners.size > 0 ? now() : null;
    },
    noteInteraction() { quietAfter = now() + BANNER_PAGE_SETTLE_MS; },
    remainingMs() { return Math.max(0, nextOpportunity - activeTime(), quietAfter - now()); },
    reserve() {
      if (owners.size === 0 || activeTime() < nextOpportunity || now() < quietAfter) return false;
      // A request/no-fill consumes the opportunity too. Rotation cannot refund it.
      nextOpportunity = activeTime() + COLLAPSIBLE_INTERVAL_MS;
      return true;
    },
  };
}

export const bottomBannerPolicy = createBottomBannerPolicy();
export const noteBottomBannerInteraction = () => bottomBannerPolicy.noteInteraction();
