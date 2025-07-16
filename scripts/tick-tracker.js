import { getActorSpeedTicks } from "../scripts/helpers.js";

export class TickTracker extends Application {
  constructor(options = {}) {
    super(options);
    this.currentTick = 1;
    this.maxTicks = game.settings.get("tickpoint-combat", "maxTicks") || 24;
    this.actors = [];
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "tickpoint-tick-tracker",
      template: "modules/tickpoint-combat/templates/tick-tracker.html",
      classes: ["tickpoint-combat"],
      width: "100%",
      height: "auto",
      resizable: false,
      minimizable: false,
      title: "Combat Tick Tracker"
    });
  }

  getData() {
    // Build an array of tick objects with actor icons who act on that tick
    // Each tick: { number: 1..maxTicks, actors: [{name, img}], progress: 0-100 }

    // Refresh actors list with token img and name for all combatants
    const combat = game.combat;
    if (!combat) return { ticks: [] };

    this.actors = combat.combatants.map(c => {
      const actor = c.actor;
      if (!actor) return null;
      const img = actor.prototypeToken?.texture?.src || actor.data.token?.img || "icons/svg/mystery-man.svg";
      return { id: actor.id, name: actor.name, img, speedTicks: getActorSpeedTicks(actor, this.maxTicks) };
    }).filter(a => a !== null);

    // Build ticks array
    const ticks = [];
    for (let i = 1; i <= this.maxTicks; i++) {
      const actorsOnTick = this.actors.filter(a => a.speedTicks.includes(i));
      ticks.push({
        number: i,
        actors: actorsOnTick,
        progress: 0 // could link to action progress if available
      });
    }

    return { ticks };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Add hover or click listeners for future features if needed
  }

  /** 
   * Update the current active tick
   * @param {number} tick - tick number (1-based)
   */
  updateCurrentTick(tick) {
    this.currentTick = tick;
    this._highlightCurrentTick();
  }

  _highlightCurrentTick() {
    const container = document.getElementById("tick-tracker");
    if (!container) return;

    container.querySelectorAll(".tick").forEach(el => {
      const tickNum = Number(el.dataset.tick);
      if (tickNum === this.currentTick) {
        el.classList.add("current-tick");
      } else {
        el.classList.remove("current-tick");
      }
    });
  }

  /** 
   * Animate progress bar on a specific tick, e.g. for long action progress
   * @param {number} tick 
   * @param {number} percent - progress 0 to 100
   */
  setTickProgress(tick, percent) {
    const container = document.getElementById("tick-tracker");
    if (!container) return;
    const tickEl = container.querySelector(`.tick[data-tick="${tick}"]`);
    if (!tickEl) return;
    const bar = tickEl.querySelector(".progress-bar");
    if (!bar) return;
    bar.style.width = `${percent}%`;
  }
}
