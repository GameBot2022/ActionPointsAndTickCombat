// scripts/quick-action-ui.js

import { TickPointQuickActionPanel } from "../modules/tickpoint-combat/ui/quick-action-ui.js";

Hooks.once("ready", () => {
  if (game.settings.get("tickpoint-combat", "showQuickActionPanel")) {
    ui.tickpointCombatQuickActionPanel = new TickPointQuickActionPanel();
    ui.tickpointCombatQuickActionPanel.render(true);
  }
});

Hooks.on("renderTickPointQuickActionPanel", (app, html, data) => {
  // Optional: Additional logic for panel render, if needed
});

game.settings.register("tickpoint-combat", "showQuickActionPanel", {
  name: "Show Quick Action Panel",
  hint: "Toggle visibility of the player-facing Quick Action UI panel.",
  scope: "world",
  config: true,
  type: Boolean,
  default: true,
  onChange: (value) => {
    if (value) {
      if (!ui.tickpointCombatQuickActionPanel) {
        ui.tickpointCombatQuickActionPanel = new TickPointQuickActionPanel();
      }
      ui.tickpointCombatQuickActionPanel.render(true);
    } else {
      ui.tickpointCombatQuickActionPanel?.close();
      ui.tickpointCombatQuickActionPanel = null;
    }
  }
});
