export class QuickActionPanel extends Application {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "quick-action-panel",
      title: "Quick Actions",
      template: "modules/tickpoint-combat/templates/quick-action-panel.html",
      popOut: true,
      width: 300,
      height: "auto",
      resizable: true
    });
  }

  getData() {
    const actor = game.user.character;
    if (!actor) return { actions: [], actor: null };

    const ap = actor.getFlag("tickpoint-combat", "currentAP") ?? 0;
    const inCombat = !!game.combat;
    const currentTick = game.combat?.round % 24;
    const isActiveTick = getActorSpeedTicks(actor).includes(currentTick);

    const actions = getAvailableActions(actor).map(action => {
      const disabled = ap < action.apCost || (!isActiveTick && inCombat);
      const reason = !inCombat
        ? "Not in combat"
        : !isActiveTick
        ? "Not your tick"
        : ap < action.apCost
        ? "Insufficient AP"
        : "";

      return { ...action, disabled, reason };
    });

    return { actions, actor, ap };
  }

  activateListeners(html) {
    html.find(".quick-action").on("click", async (ev) => {
      const btn = ev.currentTarget;
      const apCost = parseInt(btn.dataset.ap);
      const label = btn.dataset.label;
      const actor = game.user.character;

      const currentAP = actor.getFlag("tickpoint-combat", "currentAP");
      if (currentAP < apCost) return ui.notifications.warn("Not enough AP.");

      await actor.setFlag("tickpoint-combat", "currentAP", currentAP - apCost);
      await addHistoryLog(actor, `Used action: ${label}`, apCost);
      this.render();
    });
  }
}

function getAvailableActions(actor) {
  const customActions = game.settings.get("tickpoint-combat", "customActions") || [];
  const standardActions = [
    { name: "Attack", apCost: 3 },
    { name: "Move", apCost: 2 },
    { name: "Defend", apCost: 2 }
  ];
  return [...standardActions, ...customActions.map(c => ({ name: c.name, apCost: c.apCost }))];
}
