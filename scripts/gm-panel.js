// File: modules/tickpoint-combat/ui/gm-panel.js

const MODULE_ID = "tickpoint-combat";

export class GMSettingsPanel extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "tickpoint-gm-panel",
      title: "Tickpoint Combat: GM Tools",
      template: `modules/${MODULE_ID}/templates/gm-panel.html`,
      width: 600,
      height: "auto",
      classes: ["tickpoint-gm"],
      closeOnSubmit: false,
      resizable: true
    });
  }

  getData() {
    return {
      customActions: game.settings.get(MODULE_ID, "customActions") || [],
      exportable: true,
      hasLogs: !!game.settings.get(MODULE_ID, "actionHistory"),
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("#add-action").on("click", () => {
      const newAction = { name: "New Action", cost: 1, category: "general", icon: "" };
      const actions = game.settings.get(MODULE_ID, "customActions") || [];
      actions.push(newAction);
      game.settings.set(MODULE_ID, "customActions", actions);
      this.render();
    });

    html.find(".delete-action").on("click", ev => {
      const index = parseInt(ev.currentTarget.dataset.index);
      const actions = game.settings.get(MODULE_ID, "customActions") || [];
      actions.splice(index, 1);
      game.settings.set(MODULE_ID, "customActions", actions);
      this.render();
    });

    html.find(".custom-action").on("change", ev => {
      const index = parseInt(ev.currentTarget.dataset.index);
      const field = ev.currentTarget.dataset.field;
      const value = ev.currentTarget.value;
      const actions = game.settings.get(MODULE_ID, "customActions") || [];
      if (actions[index]) {
        actions[index][field] = field === "cost" ? parseInt(value) : value;
        game.settings.set(MODULE_ID, "customActions", actions);
      }
    });

    html.find("#export-log").on("click", () => this._exportLog());
    html.find("#clear-log").on("click", () => this._clearLog());
  }

  async _exportLog() {
    const logs = game.settings.get(MODULE_ID, "actionHistory") || [];
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tickpoint-action-log.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async _clearLog() {
    const confirmed = await Dialog.confirm({
      title: "Clear History Log?",
      content: "<p>This will delete all saved action logs. Are you sure?</p>"
    });
    if (confirmed) {
      await game.settings.set(MODULE_ID, "actionHistory", []);
      ui.notifications.info("Action history log cleared.");
      this.render();
    }
  }
}
