// File: modules/tickpoint-combat/system/ap-tracker.js

import { evaluateFormula } from "../settings.js";

const MODULE_ID = "tickpoint-combat";

/**
 * Initialize AP for an actor, using the configured formula.
 * Stores max and current AP.
 * @param {Actor} actor
 */
export async function initializeAP(actor) {
  const maxAP = evaluateFormula(actor, "maxAPFormula");
  await actor.setFlag(MODULE_ID, "maxAP", maxAP);
  await actor.setFlag(MODULE_ID, "currentAP", maxAP);
}

/**
 * Get current and max AP for the actor.
 * @param {Actor} actor
 * @returns {{current: number, max: number}}
 */
export function getAP(actor) {
  return {
    current: actor.getFlag(MODULE_ID, "currentAP") ?? 0,
    max: actor.getFlag(MODULE_ID, "maxAP") ?? 0
  };
}

/**
 * Attempt to consume AP. Returns success or failure.
 * @param {Actor} actor
 * @param {number} cost
 * @returns {Promise<boolean>}
 */
export async function consumeAP(actor, cost) {
  const current = actor.getFlag(MODULE_ID, "currentAP") ?? 0;
  if (cost > current) return false;

  const newAP = Math.max(0, current - cost);
  await actor.setFlag(MODULE_ID, "currentAP", newAP);
  return true;
}

/**
 * Restore AP (e.g. after a canceled action).
 * @param {Actor} actor
 * @param {number} amount
 */
export async function restoreAP(actor, amount) {
  const max = actor.getFlag(MODULE_ID, "maxAP") ?? 0;
  const current = actor.getFlag(MODULE_ID, "currentAP") ?? 0;
  const newAP = Math.min(current + amount, max);
  await actor.setFlag(MODULE_ID, "currentAP", newAP);
}

/**
 * Reset current AP to maximum — typically at the start of combat.
 * @param {Actor} actor
 */
export async function resetAP(actor) {
  const max = actor.getFlag(MODULE_ID, "maxAP") ?? 0;
  await actor.setFlag(MODULE_ID, "currentAP", max);
}

/**
 * Check whether an action can be performed.
 * @param {Actor} actor
 * @param {number} cost
 * @returns {boolean}
 */
export function canPerformAction(actor, cost) {
  const current = actor.getFlag(MODULE_ID, "currentAP") ?? 0;
  return cost <= current;
}
