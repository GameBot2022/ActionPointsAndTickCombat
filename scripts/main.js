Hooks.once("ready", () => {
  if (game.user.character) {
    game.settings.registerMenu("tickpoint-combat", "quickActions", {
      name: "Quick Action Panel",
      label: "Open Quick Actions",
      icon: "fas fa-bolt",
      type: QuickActionPanel,
      restricted: false
    });

    game.keybindings.register("tickpoint-combat", "toggleQuickPanel", {
      name: "Toggle Quick Action Panel",
      editable: [{ key: "KeyQ" }],
      onDown: () => {
        const existing = Object.values(ui.windows).find(w => w instanceof QuickActionPanel);
        if (existing) existing.close();
        else new QuickActionPanel().render(true);
        return true;
      }
    });
  }
});
