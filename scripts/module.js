// File: modules/tickpoint-combat/module.js

import { registerSettings } from "./scripts/settings.js";
import { APTracker } from "./scripts/ap-tracker.js";
import { TickScheduler } from "./scripts/tick-scheduler.js";
import { LongActionManager } from "./scripts/long-action.js";
import { CustomActionManager } from "./ui/gm-panel.js";
import { QuickActionsPanel } from "./ui/quick-actions.js";
import { TickTrackerUI } from "./ui/tick-tracker.js";
import { HistoryLog } from "./scripts/history-log.js";

Hooks.once('init', async function() {
  console.log("Tickpoint Combat | Initializing module");

  // Register module settings
  registerSettings();

  // Initialize core module objects
  game.tickpointCombat = {
    apTracker: new APTracker(),
    tickScheduler: new TickScheduler(),
    longActionManager: new LongActionManager(),
    customActionManager: null,
    quickActionsPanel: null,
    tickTrackerUI: null,
    historyLog: null,
  };

  // Create and render Tick Tracker UI (visible for all)
  game.tickpointCombat.tickTrackerUI = new TickTrackerUI();
  game.tickpointCombat.tickTrackerUI.render(true);

  // Optionally create and render Quick Actions Panel for players if enabled
  if (game.settings.get("tickpoint-combat", "showQuickActionPanel")) {
    game.tickpointCombat.quickActionsPanel = new QuickActionsPanel();
    game.tickpointCombat.quickActionsPanel.render(true);
  }

  // Add GM-only sidebar buttons for custom actions and history log
  if (game.user.isGM) {
    Hooks.callAll('registerCustomActionManagerButton');
    Hooks.callAll('registerHistoryLogButton');
  }
});

Hooks.once('ready', async function() {
  console.log("Tickpoint Combat | Module ready");

  // If combat is active on load, start scheduling ticks and set AP for actors
  if (game.combats.active) {
    game.tickpointCombat.tickScheduler.startCombat(game.combats.active);
  }
});

Hooks.on('updateActor', (actor, changed, options, userId) => {
  // React to ability changes (DEX, SIZ, INT, CON) and update AP/speed
  if (changed.data?.abilities) {
    game.tickpointCombat.apTracker.updateActorAttributes(actor);
  }
});

Hooks.on('updateCombat', (combat, changed, options, userId) => {
  // On round/turn update, update tick scheduling and AP tracking
  if (changed.round !== undefined || changed.turn !== undefined) {
    game.tickpointCombat.tickScheduler.updateCombatState(combat);
    game.tickpointCombat.apTracker.handleCombatTurnChange(combat, changed);
  }
});

Hooks.on('deleteCombat', (combat) => {
  // Clean up on combat end
  game.tickpointCombat.tickScheduler.endCombat();
  game.tickpointCombat.apTracker.resetAllActors();
});

Hooks.on('renderTokenHUD', (app, html, data) => {
  // Add quick action buttons or AP info to tokens if needed
  if (game.tickpointCombat.quickActionsPanel) {
    game.tickpointCombat.quickActionsPanel.addTokenButtons(app, html, data);
  }
});

Hooks.on('renderActorSheet', (app, html, data) => {
  // Inject AP cost overrides and AP info into actor sheets
  game.tickpointCombat.apTracker.injectActorSheetUI(app, html, data);
});

// Register GM sidebar button to open Custom Actions Manager
Hooks.on('registerCustomActionManagerButton', () => {
  if (!game.user.isGM) return;
  ui.sidebar.addButton({
    name: "tickpointCustomActions",
    icon: "fas fa-cogs",
    title: "Manage Custom Actions",
    onClick: () => {
      if (!game.tickpointCombat.customActionManager) {
        game.tickpointCombat.customActionManager = new CustomActionManager();
      }
      game.tickpointCombat.customActionManager.render(true);
    },
  });
});

// Register GM sidebar button to open History Log panel
Hooks.on('registerHistoryLogButton', () => {
  if (!game.user.isGM) return;
  ui.sidebar.addButton({
    name: "tickpointHistoryLog",
    icon: "fas fa-scroll",
    title: "Tickpoint Combat History",
    onClick: () => {
      if (game.tickpointCombat.historyLog) {
        game.tickpointCombat.historyLog.render(true);
      }
    },
  });
});

// Clean up module flags and UI on module disable/uninstall
Hooks.on('closeModule', (moduleName) => {
  if (moduleName !== "tickpoint-combat") return;
  console.log("Tickpoint Combat | Cleaning up on module disable");

  // Clear flags from all actors and combats
  for (let actor of game.actors.contents) {
    actor.unsetFlag("tickpoint-combat", "ap");
    actor.unsetFlag("tickpoint-combat", "longAction");
    actor.unsetFlag("tickpoint-combat", "customActionOverrides");
  }

  for (let combat of game.combats.contents) {
    combat.unsetFlag("tickpoint-combat", "tickData");
  }

  // Remove any temporary UI elements if needed
  if (game.tickpointCombat.quickActionsPanel) {
    game.tickpointCombat.quickActionsPanel.close();
    game.tickpointCombat.quickActionsPanel = null;
  }
  if (game.tickpointCombat.tickTrackerUI) {
    game.tickpointCombat.tickTrackerUI.close();
    game.tickpointCombat.tickTrackerUI = null;
  }
  if (game.tickpointCombat.customActionManager) {
    game.tickpointCombat.customActionManager.close();
    game.tickpointCombat.customActionManager = null;
  }
  if (game.tickpointCombat.historyLog) {
    game.tickpointCombat.historyLog.close();
    game.tickpointCombat.historyLog = null;
  }

  // Optionally prompt GM to clear stored logs here
  if (game.user.isGM) {
    const clear = confirm("Do you want to delete Tickpoint Combat history logs?");
    if (clear) {
      game.settings.set("tickpoint-combat", "historyLog", []);
    }
  }
});
