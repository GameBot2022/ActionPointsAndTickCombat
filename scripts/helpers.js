// File: modules/tickpoint-combat/scripts/helpers.js

/**
 * Format tick progress for long actions (e.g., 3/7).
 * @param {number} current - Current tick progress
 * @param {number} total - Total required ticks
 * @returns {string}
 */
export function formatTickProgress(current, total) {
  return `${current}/${total}`;
}

/**
 * Check if an action can be afforded with the current Action Points.
 * @param {number} currentAP - Current action points
 * @param {number} cost - Cost of the action
 * @returns {boolean}
 */
export function canAffordAction(currentAP, cost) {
  return currentAP >= cost;
}

/**
 * Return a timestamp string.
 * @returns {string}
 */
export function getTimestamp() {
  return new Date().toLocaleTimeString();
}

/**
 * Safely parse an integer from a form value or string.
 * Returns defaultValue if parsing fails.
 * @param {string|FormDataEntryValue} value
 * @param {number} defaultValue
 * @returns {number}
 */
export function parseIntSafe(value, defaultValue = 0) {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Play a sound if a valid path is provided.
 * @param {string} path - Audio file path
 */
export function playActionSound(path) {
  if (path && typeof path === "string") {
    AudioHelper.play({ src: path, volume: 0.8, autoplay: true, loop: false }, true);
  }
}

/**
 * Formats an action point cost value for display.
 * @param {number} ap - The action point cost.
 * @param {object} [options] - Optional config for label style.
 * @param {boolean} [options.trailing] - If true, formats as \"3 AP\" instead of \"AP: 3\".
 * @returns {string}
 */
export function formatAPCostLabel(ap, options = {}) {
  if (isNaN(ap)) return "";
  return options.trailing ? `${ap} AP` : `AP: ${ap}`;
}

/**
 * Checks whether there is an active combat encounter.
 * @returns {boolean}
 */
export function isCombatActive() {
  return !!game.combat && game.combat.started;
}

/**
 * Calculate the set of ticks an actor acts on during a combat round.
 * @param {Actor} actor - The actor whose speed is used.
 * @param {number} maxTicks - The maximum number of ticks in the round.
 * @returns {number[]} - Array of tick numbers (1-based) when actor acts.
 */
export function getActorSpeedTicks(actor, maxTicks) {
  if (!actor) return [];

  // Read configurable Speed formula from settings (example default: (DEX + SIZ + INT) / 3)
  const formula = game.settings.get("tickpoint-combat", "speedFormula") || "(DEX + SIZ + INT) / 3";

  // Gather stats - attempt to find in actor.data.data.attributes or similar
  const dex = getStat(actor, "dex");
  const siz = getStat(actor, "siz");
  const intl = getStat(actor, "int");

  if ([dex, siz, intl].some(s => s === null)) return [];

  // Evaluate formula safely
  let speedValue;
  try {
    // We replace variables with their values in the formula string
    const expr = formula
      .replace(/DEX/g, dex)
      .replace(/SIZ/g, siz)
      .replace(/INT/g, intl);
    // eslint-disable-next-line no-eval
    speedValue = eval(expr);
  } catch (err) {
    console.error("Error evaluating speed formula:", err);
    speedValue = 1; // fallback speed
  }

  speedValue = Math.max(1, Math.floor(speedValue)); // minimum speed 1

  // Spread the actor's ticks evenly across the maxTicks
  const interval = maxTicks / speedValue;
  const ticks = [];
  for (let i = 0; i < speedValue; i++) {
    // Calculate tick as 1-based integer within maxTicks
    const tick = Math.floor(1 + i * interval);
    ticks.push(tick > maxTicks ? maxTicks : tick);
  }

  // Remove duplicates and sort ascending
  return Array.from(new Set(ticks)).sort((a, b) => a - b);
}

/**
 * Helper to safely get a stat from an actor.
 * Looks in common paths like data.data.attributes or data.data.stats
 * @param {Actor} actor 
 * @param {string} statName - e.g. "dex", "siz", "int"
 * @returns {number|null} stat value or null if not found
 */
function getStat(actor, statName) {
  const data = actor.data.data || {};
  // Check possible paths for stats (customize per system)
  const paths = [
    `attributes.${statName}.value`,
    `stats.${statName}.value`,
    `abilities.${statName}.value`,
    statName // fallback direct property on data.data
  ];

  for (const path of paths) {
    const value = foundry.utils.getProperty(data, path);
    if (typeof value === "number") return value;
  }
  return null;
}
