// File: modules/tickpoint-combat/api/history-log.js

export class HistoryLog {
  static STORAGE_KEY = "tickpoint-combat.historyLog";

  static async addEntry(entry) {
    const log = await this._getLog();
    log.push({
      id: randomID(),
      timestamp: Date.now(),
      ...entry
    });
    await this._saveLog(log);
    ui.notifications.info("Action logged.");
    Hooks.callAll("tickpointHistoryUpdated", log);
  }

  static async getVisibleEntries(forUser) {
    const log = await this._getLog();

    return log.map((entry) => {
      const isGM = forUser.isGM;
      const isOwner = entry.actorUuid && forUser.hasPermission(entry.actorUuid, "OWNER");

      if (isGM || isOwner) return entry;

      return {
        id: entry.id,
        timestamp: entry.timestamp,
        summary: entry.summary || "An action was taken.",
        actorName: entry.actorName
      };
    });
  }

  static async exportLog() {
    const log = await this._getLog();
    const dataStr = JSON.stringify(log, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    saveAs(blob, "tickpoint-history-log.json");
  }

  static async clearLog() {
    await game.settings.set("tickpoint-combat", this.STORAGE_KEY, []);
    Hooks.callAll("tickpointHistoryUpdated", []);
  }

  static async confirmAndClear() {
    const confirmed = await Dialog.confirm({
      title: "Clear History Log?",
      content: "<p>This will permanently delete all history entries. Are you sure?</p>"
    });
    if (confirmed) await this.clearLog();
  }

  static async _getLog() {
    return game.settings.get("tickpoint-combat", this.STORAGE_KEY) || [];
  }

  static async _saveLog(log) {
    await game.settings.set("tickpoint-combat", this.STORAGE_KEY, log);
  }

  static async deleteEntry(entryId) {
    const log = await this._getLog();
    const newLog = log.filter((entry) => entry.id !== entryId);
    await this._saveLog(newLog);
    Hooks.callAll("tickpointHistoryUpdated", newLog);
  }

  static async markCancelled(entryId) {
    const log = await this._getLog();
    const entry = log.find(e => e.id === entryId);
    if (entry) {
      entry.cancelled = true;
      await this._saveLog(log);
      Hooks.callAll("tickpointHistoryUpdated", log);
    }
  }

  static renderLogPanel(user) {
    new HistoryLogPanel(user).render(true);
  }
}

class HistoryLogPanel extends Application {
  constructor(user, options = {}) {
    super(options);
    this.user = user;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "tickpoint-history-log",
      title: "Action History Log",
      template: "modules/tickpoint-combat/templates/history-log.html",
      width: 600,
      height: "auto",
      resizable: true,
    });
  }

  async getData() {
    const entries = await HistoryLog.getVisibleEntries(this.user);
    return { entries };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".log-entry").hover(
      function () { $(this).addClass("hover"); },
      function () { $(this).removeClass("hover"); }
    );

    html.find(".log-detail").click(ev => {
      const entryId = ev.currentTarget.dataset.entryId;
      const entry = this.object?.find(e => e.id === entryId);
      if (entry && entry.detail) {
        new Dialog({
          title: "Action Detail",
          content: `<pre>${entry.detail}</pre>`,
          buttons: { ok: { label: "Close" } }
        }).render(true);
      }
    });

    html.find(".log-export").click(() => HistoryLog.exportLog());
    html.find(".log-clear").click(() => HistoryLog.confirmAndClear());
  }
}
