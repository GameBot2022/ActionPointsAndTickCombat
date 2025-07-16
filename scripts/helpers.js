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

