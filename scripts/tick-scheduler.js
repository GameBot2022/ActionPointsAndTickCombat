// File: modules/tickpoint-combat/system/tick-scheduler.js

import { getAP, resetAP } from "./ap-tracker.js";
import { getLongAction, updateLongActionProgress } from "./long-action.js";
import { getSpeedFormulaValue } from "../settings.js";
import { addHistoryLog } from "../ui/history-log.js";

const MODULE_ID = "tickpoint-combat";

/**
 * Get an array of ticks (0–23) on which an actor may act.
 * Based on the Speed attribute and global tick count of 24.
 * @param {Actor} actor
 * @returns {number[]} Array of valid tick indices
 */
export function getActorSpeedTicks(actor) {
  const speed = getSpeedFormulaValue(actor);
  if (!speed || speed <= 0) return [];

  const spacing = Math.floor(24 / speed);
  const ticks = [];

  for (let i = 0; i < 24; i++) {
    if (i % spacing === 0) ticks.push(i);
  }

  return ticks;
}

/**
 * Called when combat advances to a new round or tick.
 * Processes actor long actions and AP recovery at round start.
 * @param {Combat} combat
 * @param {object} changes
 */
export async function onTickUpdate(combat, changes) {
  const tick = combat.round % 24;
  const isNewRound = (changes.round !== undefined && changes.round !== combat.round);

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || actor.type !== "character") continue;

    // Recover AP at start of a new round
    if (isNewRound) await resetAP(actor);

    const ticks = getActorSpeedTicks(actor);
    if (!ticks.includes(tick)) continue;

    const longAction = await getLongAction(actor);
    if (longAction && !longAction.cancelled) {
      const updated = await updateLongActionProgress(actor);
      if (updated?.completed) {
        ui.notifications.info(`${actor.name} completed a long action.`);
        await addHistoryLog(actor, `${longAction.description} completed`, 0, true);
      }
    }
  }
}
