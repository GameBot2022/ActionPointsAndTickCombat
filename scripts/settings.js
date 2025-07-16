// GM Settings Panel code for the Tickpoint Combat module. This registers and renders settings for Speed and Max AP formulas, toggleable AP tracking outside combat, and supports custom action definitions.

export function registerTickpointSettings() {
  game.settings.register("tickpoint-combat", "speedFormula", {
    name: "Speed Formula",
    hint: "Formula using DEX, SIZ, INT (e.g., (DEX + SIZ + INT) / 3)",
    scope: "world",
    config: true,
    type: String,
    default: "(DEX + SIZ + INT)/3"
  });

  game.settings.register("tickpoint-combat", "maxAPFormula", {
    name: "Max AP Formula",
    hint: "Formula using DEX, CON, INT (e.g., (DEX + CON + INT) / 3)",
    scope: "world",
    config: true,
    type: String,
    default: "(DEX + CON + INT)/3"
  });

  game.settings.register("tickpoint-combat", "apOutsideCombat", {
    name: "Track Action Points Outside of Combat",
    hint: "Enable AP system when not actively in a combat encounter.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register("tickpoint-combat", "customActions", {
    name: "Custom Actions",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.registerMenu("tickpoint-combat", "customActionsMenu", {
    name: "Manage Custom Actions",
    label: "Configure",
    hint: "Define and manage custom action types.",
    icon: "fas fa-cogs",
    type: CustomActionsConfig,
    restricted: true
  });
}

// Allow GMs to manage custom actions from the UI

class CustomActionsConfig extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "custom-actions-config",
      title: "Custom Actions",
      template: "modules/tickpoint-combat/templates/custom-actions-config.html",
      width: 500
    });
  }

  getData() {
    return {
      actions: game.settings.get("tickpoint-combat", "customActions")
    };
  }

  async _updateObject(event, formData) {
    const actions = {};
    for (let [key, value] of Object.entries(formData)) {
      const [, field, index] = key.match(/^actions\[(\w+)\]\[(\d+)\]$/) || [];
      if (!actions[index]) actions[index] = {};
      actions[index][field] = value;
    }

    await game.settings.set("tickpoint-combat", "customActions", Object.values(actions));
  }
}
