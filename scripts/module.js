// File: modules/tickpoint-combat/module.js

import { registerSettings } from "./settings.js";
import { setupActionPointSystem } from "./ap-tracker.js";
import { initializeTickScheduler } from "./tick-scheduler.js";
import { extendItemSheets } from "./item-sheet.js";
import { setupGMPanel } from "./gm-panel.js";
import { addHistoryHooks } from "./history-log.js";
import { renderCombatTrackerUI } from "./combat-tracker.js";
import { setupQuickActionsUI } from "./quick-actions-ui.js";

const MODULE_ID = "tickpoint-combat";

//  Ensure HistoryLog is Exposed

window.tickpointCombat = {
  ...(window.tickpointCombat || {}),
  HistoryLog
};

Hooks.once("init", async () => {
  console.log(`${MODULE_ID} | Initializing Tickpoint Combat Module`);

  // Register custom settings
  registerSettings();

  // Register styles
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `modules/${MODULE_ID}/styles/styles.css`;
  document.head.appendChild(link);
});

Hooks.once("setup", () => {
  // Extend item sheets to support AP overrides
  extendItemSheets();

  // Setup GM interface
  setupGMPanel();

  // Hook up action history logging
  addHistoryHooks();

  // Render enhancements on combat tracker
  renderCombatTrackerUI();

  // Setup player-facing action buttons
  setupQuickActionsUI();

  // Start tick tracking logic
  initializeTickScheduler();
});

Hooks.on("ready", async () => {
  console.log(`${MODULE_ID} | Ready hook fired`);

  if (!game.user.isGM) return;

  // Migrate or initialize persisted data if needed
  const initialized = game.settings.get(MODULE_ID, "initialized") || false;
  if (!initialized) {
    await game.settings.set(MODULE_ID, "initialized", true);
    console.log(`${MODULE_ID} | First-time setup complete.`);
  }
});

// Auto-Open the Panel for Players When Enabled

Hooks.once("ready", () => {
  if (game.settings.get("MODULE_ID", "showQuickActionPanel")) {
    import("./ui/quick-actions.js").then(module => {
      const panel = new module.QuickActionPanel();
      panel.render(true);
    });
  }
});

// Provide a Macro or UI Button for Players to Toggle the Panel
  
(async () => {
  const existingApp = ui.windows.find(w => w.id === "tickpoint-quick-actions");
  if (existingApp) {
    existingApp.close();
    await game.settings.set("tickpoint-combat", "showQuickActionPanel", false);
  } else {
    const module = await import("modules/tickpoint-combat/ui/quick-actions.js");
    new module.QuickActionPanel().render(true);
    await game.settings.set("tickpoint-combat", "showQuickActionPanel", true);
  }
})();

// Add handlebar helper for timestamp formatting in the log

Handlebars.registerHelper("timestamp", function (ts) {
  return new Date(ts).toLocaleString();
});

// Add log to the GM menu

Hooks.once("ready", () => {
  if (!game.user.isGM) return;

  const button = $('<button class="tickpoint-history-button"><i class="fas fa-history"></i> Action History</button>');
  button.css({
    margin: "5px 0",
    width: "100%"
  });

  button.on("click", () => {
    const { HistoryLog } = window.tickpointCombat;
    new HistoryLog().render(true);
  });

  // Insert into the UI — below the Combat tab
  const controls = $("#sidebar #combat");
  if (controls.length > 0) {
    controls.append(button);
  }
});

// Clean up flags and UI on module disable/uninstall
Hooks.on("disableModule", async (moduleData) => {
  if (moduleData.id !== MODULE_ID) return;
  console.log(`${MODULE_ID} | Disabling module...`);

  for (const actor of game.actors.contents) {
    await actor.unsetFlag(MODULE_ID, "speed");
    await actor.unsetFlag(MODULE_ID, "maxAP");
    await actor.unsetFlag(MODULE_ID, "longAction");
    await actor.unsetFlag(MODULE_ID, "customActions");
  }

  if (confirm("Delete action history logs as well?")) {
    const messages = game.messages.contents.filter(m => m.getFlag(MODULE_ID, "history"));
    for (const msg of messages) {
      await msg.delete();
    }
  }

  ui.notifications.info("Tickpoint Combat cleaned up successfully.");
});
