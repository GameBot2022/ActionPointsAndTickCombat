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

// Custom Actions Manager UI with Edit or Delete

class CustomActionsConfig extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "custom-actions-config",
      title: "Manage Custom Actions",
      template: "modules/tickpoint-combat/templates/custom-actions-config.html",
      width: 600,
      height: "auto"
    });
  }

  getData() {
    return {
      actions: game.settings.get("tickpoint-combat", "customActions") || []
    };
  }

  async _updateObject(event, formData) {
    event.preventDefault();
    const form = new FormDataExtended(event.target).object;
    const actions = [];

    const count = Object.keys(form).filter(k => k.startsWith("name_")).length;
    for (let i = 0; i < count; i++) {
      if (form[`name_${i}`]) {
        actions.push({
          name: form[`name_${i}`],
          apCost: Number(form[`apCost_${i}`]),
          tag: form[`tag_${i}`] || ""
        });
      }
    }
    await game.settings.set("tickpoint-combat", "customActions", actions);
  }
}

// Update custom actions setting to support the new shapes
{
  "name": "Cast Spirit Spell",
  "apCost": 5,
  "category": "Magic",
  "icon": "icons/magic/fire/beam-jet-stream-yellow.webp"
}
