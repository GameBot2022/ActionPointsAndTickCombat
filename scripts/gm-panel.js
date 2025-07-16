// File: modules/tickpoint-combat/ui/gm-panel.js

const MODULE_ID = "tickpoint-combat";

// File: modules/tickpoint-combat/ui/gm-panel.js

import { parseIntSafe } from "../scripts/helpers.js";

export class CustomActionManager extends FormApplication {
  constructor(object = {}, options = {}) {
    super(object, options);
    this.actions = game.settings.get("tickpoint-combat", "customActions") || [];
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "tickpoint-custom-action-manager",
      title: "Manage Custom Actions",
      template: "modules/tickpoint-combat/templates/custom-actions.html",
      classes: ["tickpoint-combat"],
      width: 500,
      height: "auto",
      resizable: true,
      closeOnSubmit: false
    });
  }

  getData() {
    return {
      actions: this.actions
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".action-delete").click(ev => {
      const index = parseInt(ev.currentTarget.dataset.index);
      this.actions.splice(index, 1);
      this._save();
    });

    html.find(".action-edit").click(ev => {
      const index = parseInt(ev.currentTarget.dataset.index);
      const action = this.actions[index];
      const form = $("#edit-form");
      form.find("[name=label]").val(action.label);
      form.find("[name=apCost]").val(action.apCost);
      form.find("[name=description]").val(action.description);
      form.find("[name=icon]").val(action.icon);
      form.find("[name=sound]").val(action.sound);
      form.attr("data-edit-index", index);
    });

    html.find("#add-action-form").submit(ev => {
      ev.preventDefault();
      const form = ev.currentTarget;
      const data = new FormData(form);
      const action = Object.fromEntries(data.entries());
      action.apCost = parseIntSafe(action.apCost);
      this.actions.push(action);
      form.reset();
      this._save();
    });

    html.find("#edit-form").submit(ev => {
      ev.preventDefault();
      const index = parseInt(ev.currentTarget.dataset.editIndex);
      const form = ev.currentTarget;
      const data = new FormData(form);
      const action = Object.fromEntries(data.entries());
      action.apCost = parseIntSafe(action.apCost);
      this.actions[index] = action;
      form.reset();
      delete form.dataset.editIndex;
      this._save();
    });
  }

  async _save() {
    await game.settings.set("tickpoint-combat", "customActions", this.actions);
    this.render();
  }
}
