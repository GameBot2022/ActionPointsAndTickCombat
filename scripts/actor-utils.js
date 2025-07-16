export function calculateSpeed(actor) {
  const formula = game.settings.get("tickpoint-combat", "speedFormula") || "(DEX + SIZ + INT)/3";
  return Math.floor(safeEvalFormula(actor, formula));
}

export function calculateMaxAP(actor) {
  const formula = game.settings.get("tickpoint-combat", "maxAPFormula") || "(DEX + CON + INT)/3";
  return Math.floor(safeEvalFormula(actor, formula));
}

function safeEvalFormula(actor, formula) {
  const abilities = actor.system?.attributes || actor.system?.characteristics || {};
  const data = {
    DEX: getAbility(abilities, "dex"),
    SIZ: getAbility(abilities, "siz"),
    INT: getAbility(abilities, "int"),
    CON: getAbility(abilities, "con")
  };
  try {
    return Roll.safeEval(formula, data);
  } catch (e) {
    console.warn("Tickpoint formula error:", e);
    return 1;
  }
}

function getAbility(abilities, key) {
  const match = Object.entries(abilities).find(([k]) => k.toLowerCase().includes(key.toLowerCase()));
  return match?.[1]?.value ?? 1;
}

// Update getActorSpeedTicks to use this:

function getActorSpeedTicks(actor) {
  const speed = calculateSpeed(actor);
  const ticks = [];
  for (let i = 0; i < 24; i++) {
    if (i % Math.floor(24 / speed) === 0) ticks.push(i);
  }
  return ticks;
}

// Add a hook to set CurrentAP and MaxAP on actor creation:

Hooks.on("createActor", async (actor) => {
  const maxAP = calculateMaxAP(actor);
  await actor.setFlag("tickpoint-combat", "maxAP", maxAP);
  await actor.setFlag("tickpoint-combat", "currentAP", maxAP);
  await actor.setFlag("tickpoint-combat", "speed", calculateSpeed(actor));
});
