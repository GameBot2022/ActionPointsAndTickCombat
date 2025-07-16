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
