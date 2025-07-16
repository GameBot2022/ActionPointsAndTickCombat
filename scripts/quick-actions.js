// File: modules/tickpoint-combat/ui/quick-actions.js

const MODULE_ID = "tickpoint-combat";

import { isCombatActive } from "../scripts/helpers.js";

export class QuickActionPanel extends Application {
  constructor(options = {}) {
    super(options);
    this.actions = game.settings.get("tickpoint-combat", "customActions") || [];
  }
  
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "tickpoint-quick-actions",
      title: "Quick Actions",
      template: `modules/${MODULE_ID}/templates/quick-actions.html`,
      popOut: true,
      width: 400,
      height: "auto",
      resizable: true,
      classes: ["tickpoint-quick"],
    });    
  }

  getData() {
    const actor = game.user.character;
    if (!actor) return {};

    const currentAP = actor.getFlag(MODULE_ID, "currentAP") ?? 0;
    const maxAP = actor.getFlag(MODULE_ID, "maxAP") ?? 0;

    const actions = (game.settings.get(MODULE_ID, "customActions") || []).map(a => {
      return {
        ...a,
        disabled: currentAP < a.cost,
        tooltip: currentAP < a.cost
          ? `Requires ${a.cost} AP (You have ${currentAP})`
          : `Cost: ${a.cost} AP`
      };
    });

    const categorized = {};
    for (let action of actions) {
      if (!categorized[action.category]) categorized[action.category] = [];
      categorized[action.category].push(action);
    }

    return {
      currentAP,
      maxAP,
      categorizedActions: categorized
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // If not in combat, drop out
    
  html.find("button.action-button").click(this._onActionClick.bind(this));
  }

  _onActionClick(event) {
    event.preventDefault();

    if (!isCombatActive()) {
      ui.notifications.warn("Quick actions can only be used during active combat.");
      return;
    }
    
    html.find(".quick-action-button").on("click", async (ev) => {
      const index = ev.currentTarget.dataset.index;
      const actions = game.settings.get(MODULE_ID, "customActions") || [];
      const action = actions[index];
      const actor = game.user.character;

      const currentAP = actor.getFlag(MODULE_ID, "currentAP") ?? 0;
      if (!actor || currentAP < action.cost) return;

      await actor.setFlag(MODULE_ID, "currentAP", currentAP - action.cost);
      ui.notifications.info(`You used "${action.name}" (-${action.cost} AP).`);

      const logMsg = `${actor.name} used ${action.name}`;
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: logMsg
      });

      const logs = game.settings.get(MODULE_ID, "actionHistory") || [];
      logs.push({
        actorId: actor.id,
        name: actor.name,
        action: action.name,
        apCost: action.cost,
        timestamp: Date.now()
      });
      await game.settings.set(MODULE_ID, "actionHistory", logs);

      this.render(); // refresh UI
    });
  }
}
