// File: modules/tickpoint-combat/scripts/tick-scheduler.js

import { getActorSpeedTicks, isCombatActive } from "./helpers.js";
import { LongActionManager } from "./long-action.js";
import { APTracker } from "./ap-tracker.js";

export class TickScheduler {
  constructor() {
    this.isRunning = false;
    this.currentTick = 0;
    this.maxTicks = game.settings.get("tickpoint-combat", "maxTicks") || 24;
    this.tickDuration = game.settings.get("tickpoint-combat", "tickDuration") || 1000; // ms per tick
    this.timerId = null;
    this.paused = false;

    // Cache actors acting each tick: {tick: [actorIds]}
    this.tickActorsMap = new Map();

    // Bind combat hooks
    Hooks.on("combatStart", this._onCombatStart.bind(this));
    Hooks.on("combatEnd", this._onCombatEnd.bind(this));
    Hooks.on("updateActor", this._onActorUpdate.bind(this));
  }

  /* -------------------- Public API -------------------- */

  start() {
    if (this.isRunning) return;
    if (!isCombatActive()) return;

    this.isRunning = true;
    this.currentTick = 0;
    this._buildTickActorsMap();
    this._scheduleNextTick();
    console.log("TickScheduler started.");
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = null;
    this.currentTick = 0;
    this.tickActorsMap.clear();
    this._clearTickUI();
    console.log("TickScheduler stopped.");
  }

  pause() {
    this.paused = true;
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = null;
    console.log("TickScheduler paused.");
  }

  resume() {
    if (!this.isRunning || !this.paused) return;
    this.paused = false;
    this._scheduleNextTick();
    console.log("TickScheduler resumed.");
  }

  manualAdvance() {
    if (!this.isRunning) return;
    this._advanceTick();
  }

  /* -------------------- Private methods -------------------- */

  async _onCombatStart() {
    // Only start scheduler if AP tracking enabled in combat
    if (!game.settings.get("tickpoint-combat", "enableAPTrackingInCombat")) return;
    this.start();
  }

  async _onCombatEnd() {
    this.stop();
  }

  _onActorUpdate(actor, data, options, userId) {
    // Rebuild tick map if speed-affecting attributes changed
    if (!this.isRunning) return;
    if (!actor.hasPlayerOwner) return; // Only player actors

    const speedFields = ["data.attributes.dex", "data.attributes.siz", "data.attributes.int"];
    if (speedFields.some(field => data.hasOwnProperty(field))) {
      this._buildTickActorsMap();
    }
  }

  _scheduleNextTick() {
    if (this.paused || !this.isRunning) return;

    this.timerId = setTimeout(() => {
      this._advanceTick();
    }, this.tickDuration);
  }

  _advanceTick() {
    this.currentTick = (this.currentTick % this.maxTicks) + 1;
    this._processTickActors(this.currentTick);
    this._updateTickUI(this.currentTick);
    Hooks.call("tickpoint-combat-tickAdvance", { tick: this.currentTick });

    this._scheduleNextTick();
  }

  _buildTickActorsMap() {
    this.tickActorsMap.clear();
    const combatants = game.combat?.combatants || [];
    const maxTicks = this.maxTicks;

    for (let tick = 1; tick <= maxTicks; tick++) {
      this.tickActorsMap.set(tick, []);
    }

    for (const combatant of combatants) {
      const actor = combatant.actor;
      if (!actor) continue;

      // Compute which ticks actor acts on, based on current speed formula
      const speedTicks = getActorSpeedTicks(actor, maxTicks);
      for (const tick of speedTicks) {
        if (!this.tickActorsMap.has(tick)) this.tickActorsMap.set(tick, []);
        this.tickActorsMap.get(tick).push(actor.id);
      }
    }
  }

  _processTickActors(tick) {
    const actorsThisTick = this.tickActorsMap.get(tick) || [];
    for (const actorId of actorsThisTick) {
      const actor = game.actors.get(actorId);
      if (!actor) continue;

      // Skip if no AP or not in combat or paused
      if (!isCombatActive() || this.paused) continue;

      const apTracker = APTracker.forActor(actor);
      if (!apTracker) continue;

      // Skip if actor has no current AP
      if (apTracker.currentAP <= 0) {
        ui.notifications.info(`${actor.name} has no Action Points left and is skipped this tick.`);
        continue;
      }

      // Check long action progress & handle accordingly
      const longAction = LongActionManager.getForActor(actor);
      if (longAction) {
        longAction.progressTick();
        if (longAction.isComplete()) {
          LongActionManager.completeLongAction(actor);
          ui.notifications.info(`${actor.name} has completed their long action.`);
        } else {
          ui.notifications.info(`${actor.name} is progressing long action: ${longAction.label}`);
        }
      }

      // Signal that actor can act this tick
      Hooks.call("tickpoint-combat-actorTick", { actor, tick });
    }
  }

  _updateTickUI(tick) {
    // Example implementation: highlight current tick in UI
    const trackerElement = document.getElementById("tickpoint-combat-tracker");
    if (!trackerElement) return;

    // Clear previous highlights
    trackerElement.querySelectorAll(".tick").forEach(el => el.classList.remove("active-tick"));

    // Highlight current tick
    const currentTickEl = trackerElement.querySelector(`.tick[data-tick="${tick}"]`);
    if (currentTickEl) {
      currentTickEl.classList.add("active-tick");
      // Animate progress bar if exists
      const progressBar = currentTickEl.querySelector(".tick-progress-bar");
      if (progressBar) {
        progressBar.style.transition = `width ${this.tickDuration}ms linear`;
        progressBar.style.width = "100%";
        setTimeout(() => (progressBar.style.width = "0%"), this.tickDuration);
      }
    }
  }

  _clearTickUI() {
    const trackerElement = document.getElementById("tickpoint-combat-tracker");
    if (!trackerElement) return;
    trackerElement.querySelectorAll(".tick").forEach(el => {
      el.classList.remove("active-tick");
      const progressBar = el.querySelector(".tick-progress-bar");
      if (progressBar) progressBar.style.width = "0%";
    });
  }
}

// Singleton instance for global usage
export const tickScheduler = new TickScheduler();

Hooks.once("ready", () => {
  if (isCombatActive() && game.settings.get("tickpoint-combat", "enableAPTrackingInCombat")) {
    tickScheduler.start();
  }
});
