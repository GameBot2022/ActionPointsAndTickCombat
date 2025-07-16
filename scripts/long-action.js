// File: modules/tickpoint-combat/system/long-action.js

const MODULE_ID = "tickpoint-combat";

/**
 * Retrieve the actor's current long action from their flags.
 * @param {Actor} actor
 * @returns {Promise<Object|null>}
 */
export async function getLongAction(actor) {
  return actor.getFlag(MODULE_ID, "longAction") ?? null;
}

/**
 * Start a long action for an actor.
 * @param {Actor} actor
 * @param {Object} actionData
 * @param {string} actionData.description - Description of the action
 * @param {string} actionData.details - More verbose info
 * @param {number} actionData.total - Total AP required
 */
export async function startLongAction(actor, { description, details = "", total }) {
  const longAction = {
    description,
    details,
    total,
    spent: 0,
    cancelled: false,
    startedAt: game.combat?.round ?? 0,
  };

  await actor.setFlag(MODULE_ID, "longAction", longAction);
}

/**
 * Cancel a long action for an actor.
 * @param {Actor} actor
 * @param {string} reason Optional cancellation note.
 */
export async function cancelLongAction(actor, reason = "") {
  const longAction = await getLongAction(actor);
  if (!longAction) return;

  longAction.cancelled = true;
  if (reason) longAction.details += `<br><em>Cancelled:</em> ${reason}`;
  await actor.setFlag(MODULE_ID, "longAction", longAction);
}

/**
 * Clear a long action when complete or canceled.
 * @param {Actor} actor
 */
export async function clearLongAction(actor) {
  await actor.unsetFlag(MODULE_ID, "longAction");
}

/**
 * Progress the long action by 1 AP tick.
 * Returns true if the action is complete after this tick.
 * @param {Actor} actor
 * @returns {Promise<{completed: boolean}>}
 */
export async function updateLongActionProgress(actor) {
  const longAction = await getLongAction(actor);
  if (!longAction || longAction.cancelled) return { completed: false };

  longAction.spent += 1;

  if (longAction.spent >= longAction.total) {
    await clearLongAction(actor);
    return { completed: true };
  } else {
    await actor.setFlag(MODULE_ID, "longAction", longAction);
    return { completed: false };
  }
}

/**
 * Check if an actor currently has an active long action in progress.
 * @param {Actor} actor
 * @returns {boolean}
 */
export function hasActiveLongAction(actor) {
  const longAction = actor.getFlag(MODULE_ID, "longAction");
  return !!(longAction && !longAction.cancelled && longAction.spent < longAction.total);
}
