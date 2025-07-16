// scripts/cleanup.js

export async function cleanupModuleData() {
  const confirmDeleteLogs = await new Promise((resolve) => {
    new Dialog({
      title: "TickPoint Combat Cleanup",
      content: "<p>Do you want to delete all TickPoint Combat action logs?</p>",
      buttons: {
        yes: {
          label: "Yes",
          callback: () => resolve(true)
        },
        no: {
          label: "No",
          callback: () => resolve(false)
        }
      },
      default: "no"
    }).render(true);
  });

  for (const actor of game.actors.contents) {
    await actor.unsetFlag("tickpoint-combat", "");
  }

  for (const item of game.items.contents) {
    await item.unsetFlag("tickpoint-combat", "");
  }

  for (const combat of game.combats.contents) {
    for (const combatant of combat.combatants) {
      await combatant.unsetFlag("tickpoint-combat", "");
    }
  }

  if (confirmDeleteLogs) {
    const messages = game.messages.filter(m => m.getFlag("tickpoint-combat", "history"));
    for (const msg of messages) {
      await msg.delete();
    }
  }

  if (ui.tickpointCombatQuickActionPanel) ui.tickpointCombatQuickActionPanel.close();

  ui.notifications.info("TickPoint Combat cleanup completed.");
}

Hooks.once("setup", () => {
  game.settings.registerMenu("tickpoint-combat", "cleanup", {
    name: "Cleanup TickPoint Combat Data",
    label: "Cleanup / Uninstall",
    icon: "fas fa-trash",
    type: class extends FormApplication {
      constructor() { super(); }
      getData() { return {}; }
      activateListeners(html) {
        super.activateListeners(html);
        html.find("button").click(() => {
          cleanupModuleData();
          this.close();
        });
      }
      static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          template: "modules/tickpoint-combat/templates/cleanup-menu.html",
          classes: ["form"],
          width: 400,
          height: "auto"
        });
      }
    },
    restricted: true
  });
});
