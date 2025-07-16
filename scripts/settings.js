// File: modules/tickpoint-combat/settings.js

const MODULE_ID = "tickpoint-combat";

export function registerSettings() {

// Allow GMs to toggle the Quick Action panel's visibility. This setting will:
// Appear in the module’s Settings panel.
// Persist between sessions.
// Automatically open or close the Quick Action panel based on the setting value.
// Allow players to toggle their own Quick Action panel visibility if desired.
  
  game.settings.register("tickpoint-combat", "showQuickActionPanel", {
  name: "Show Quick Action Panel",
  hint: "Toggle the player-facing Quick Action panel visibility.",
  scope: "client",         // client-level so each player controls their own view
  config: true,
  type: Boolean,
  default: true,
  onChange: (value) => {
    // Open or close the panel when the setting changes
    const existingApp = ui.windows.find(w => w.id === "tickpoint-quick-actions");
    if (value) {
      if (!existingApp) {
        import("./ui/quick-actions.js").then(module => {
          const panel = new module.QuickActionPanel();
          panel.render(true);
        });
      }
    } else {
      if (existingApp) existingApp.close();
    }
  }
});

  
  // Speed formula
  game.settings.register(MODULE_ID, "speedFormula", {
    name: "Speed Formula",
    hint: "Use attributes like DEX, INT, SIZ to calculate Speed. Use 'Math.floor' if needed.",
    scope: "world",
    config: true,
    type: String,
    default: "Math.floor((DEX + INT + SIZ) / 3)"
  });

  // Max AP formula
  game.settings.register(MODULE_ID, "maxAPFormula", {
    name: "Max AP Formula",
    hint: "Use attributes like DEX, INT, CON to calculate Maximum AP.",
    scope: "world",
    config: true,
    type: String,
    default: "Math.floor((DEX + INT + CON) / 3)"
  });

  // Allow tracking AP outside combat
  game.settings.register(MODULE_ID, "trackAPOutOfCombat", {
    name: "Track AP Outside Combat",
    hint: "If enabled, AP will be tracked even when not in combat rounds.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Show Quick Action Panel toggle
  game.settings.register(MODULE_ID, "showQuickActionPanel", {
    name: "Show Quick-Action Panel",
    hint: "Allows players to see the Quick-Action panel on their screen.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      const existingApp = ui.windows["tickpoint-quick-actions"];
      if (value) {
        if (!existingApp) {
          import("./ui/quick-actions.js").then(module => {
            new module.QuickActionPanel().render(true);
          });
        }
      } else {
        if (existingApp) existingApp.close();
      }
    }
  });
  
  // Enable GM custom actions
  game.settings.register(MODULE_ID, "enableCustomActions", {
    name: "Enable Custom Actions",
    hint: "Allow the GM to define custom action types with AP costs.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Persisted history setting
  game.settings.register(MODULE_ID, "persistHistory", {
    name: "Persist Action History Log",
    hint: "Keep logs of AP actions across sessions (visible to GMs and players).",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Internal flag to check for setup
  game.settings.register(MODULE_ID, "initialized", {
    name: "Initialized",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });
}

/**
 * Utility function to compute speed or AP based on formula.
 * @param {Actor} actor
 * @param {String} formulaSettingName
 * @returns {Number}
 */
export function evaluateFormula(actor, formulaSettingName) {
  const formula = game.settings.get(MODULE_ID, formulaSettingName);
  const data = duplicate(actor.system?.attributes ?? {});
  try {
    const scope = { ...data };
    const keys = Object.keys(scope);
    const values = Object.values(scope);
    const fn = new Function(...keys, `return ${formula};`);
    const result = fn(...values);
    return Number.isFinite(result) ? Math.floor(result) : 1;
  } catch (err) {
    console.warn(`${MODULE_ID} | Invalid formula: ${formula}`);
    return 1;
  }
}
