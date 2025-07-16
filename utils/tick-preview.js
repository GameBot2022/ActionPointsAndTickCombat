export function previewNextAvailableTick(actor, apCost) {
  const speed = actor.system.speed ?? 1;
  const currentTick = game.combat?.getFlag("tickpoint-combat", "currentTick") ?? 0;
  const ap = actor.system.currentAP ?? 0;

  if (speed <= 0) return null;

  // Check next 24 ticks in round
  for (let i = 1; i <= 24; i++) {
    const tick = (currentTick + i) % 24;

    // Can act on this tick?
    if ((tick % Math.floor(24 / speed)) === 0) {
      // Regenerate AP at round start (tick 0)
      const simulatedAP = (tick === 0) ? actor.system.maxAP : ap;

      if (simulatedAP >= apCost) return i;
    }
  }

  return null;
}
