// File: modules/tickpoint-combat/scripts/ap-tracker.js

import { isCombatActive } from "./helpers.js";
import { updateHistoryLog } from "./history-log.js";
import { refreshQuickActions } from "../ui/quick-actions.js";

export class APTracker {
  /**
   * Initialize the APTracker: set up hooks for combat and actor updates
   */
  static init() {
    // Hook when combat starts or combatants added - set initial AP values
    Hooks.on("combatStart", APTracker._onCombatStart);
    Hooks.on("updateCombat", APTracker._onCombatRoundUpdate);
    Hooks.on("createCombatant", APTracker._onCombatantCreate);

    // Hook actor updates to keep AP data in sync
    Hooks.on("updateActor", APTracker._onActorUpdate);
  }

  /**
   * When combat starts, initialize each combatant's AP pool
   * @param {Combat} combat 
   */
  static async _onCombatStart(combat) {
    for (let combatant of combat.combatants) {
      const actor = combatant.actor;
      if (!actor) continue;
      await APTracker._initializeActorAP(actor);
    }
  }

  /**
   * When a new combatant is created (e.g., joining mid-combat),
   * initialize its AP values.
   * @param {Combatant} combatant 
   */
  static async _onCombatantCreate(combatant) {
    const actor = combatant.actor;
    if (!actor) return;
    await APTracker._initializeActorAP(actor);
  }

  /**
   * At the start of each new combat round, restore AP for all combatants
   * @param {Combat} combat 
   * @param {object} changes 
   */
  static async _onCombatRoundUpdate(combat, changes) {
    if (changes.round !== undefined) {
      for (let combatant of combat.combatants) {
        const actor = combatant.actor;
        if (!actor) continue;
        await APTracker._restoreActorAP(actor);
      }
    }
  }

  /**
   * Sync AP values when an actor is updated externally
   * (optional: used if AP is stored as actor flags or data)
   * @param {Actor} actor 
   * @param {object} data 
   * @param {object} options 
   * @param {string} userId 
   */
  static _onActorUpdate(actor, data, options, userId) {
    // For now, just refresh the quick action UI panel if AP changed
    if (data.flags?.["tickpoint-combat"]?.currentAP !== undefined ||
        data.flags?.["tickpoint-combat"]?.maxAP !== undefined) {
      refreshQuickActions();
    }
  }

  /**
   * Initialize actor AP pools on combat start or joining combat
   * @param {Actor} actor 
   */
  static async _initializeActorAP(actor) {
    if (!isCombatActive()) return;
    const maxAP = APTracker._calculateMaxAP(actor);
    await actor.setFlag("tickpoint-combat", "maxAP", maxAP);
    // Start currentAP full
    await actor.setFlag("tickpoint-combat", "currentAP", maxAP);

    updateHistoryLog(actor, "AP initialized to max (" + maxAP + ")");
    refreshQuickActions();
  }

  /**
   * Restore AP to max at new combat rounds
   * @param {Actor} actor 
   */
  static async _restoreActorAP(actor) {
    if (!isCombatActive()) return;
    const maxAP = actor.getFlag("tickpoint-combat", "maxAP") || APTracker._calculateMaxAP(actor);
    await actor.setFlag("tickpoint-combat", "maxAP", maxAP);
    await actor.setFlag("tickpoint-combat", "currentAP", maxAP);

    updateHistoryLog(actor, "AP restored to max (" + maxAP + ")");
    refreshQuickActions();
  }

  /**
   * Calculate max AP from the actor data using configured formula or defaults
   * @param {Actor} actor 
   * @returns {number}
   */
  static _calculateMaxAP(actor) {
    // Example default formula: average of DEX, CON, INT rounded down
    const DEX = actor.data.data.abilities?.dex?.value || 10;
    const CON = actor.data.data.abilities?.con?.value || 10;
    const INT = actor.data.data.abilities?.int?.value || 10;

    // Allow configurable formula here (could be replaced with setting)
    return Math.floor((DEX + CON + INT) / 3);
  }

  /**
   * Attempt to spend AP for an action.
   * Will fail if insufficient AP.
   * @param {Actor} actor 
   * @param {number} cost 
   * @returns {boolean} success or failure
   */
  static async spendAP(actor, cost) {
    if (cost <= 0) return true; // No cost, always succeed

    const currentAP = actor.getFlag("tickpoint-combat", "currentAP") || 0;
    if (currentAP < cost) return false;

    const newAP = Math.max(0, currentAP - cost);
    await actor.setFlag("tickpoint-combat", "currentAP", newAP);

    updateHistoryLog(actor, `Spent ${cost} AP, remaining ${newAP}`);
    refreshQuickActions();

    return true;
  }

  /**
   * Get current AP for an actor
   * @param {Actor} actor 
   * @returns {number}
   */
  static getCurrentAP(actor) {
    return actor.getFlag("tickpoint-combat", "currentAP") || 0;
  }

  /**
   * Get max AP for an actor
   * @param {Actor} actor 
   * @returns {number}
   */
  static getMaxAP(actor) {
    return actor.getFlag("tickpoint-combat", "maxAP") || APTracker._calculateMaxAP(actor);
  }
}
