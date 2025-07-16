.long-action-progress .progress-bar {
  transition: width 0.5s ease-in-out;
  /* existing styling here */
}

/* Additional styling for cancel button visibility */
.cancel-long-action {
  background-color: transparent;
  border: none;
  color: #c00;
  font-weight: bold;
  cursor: pointer;
  margin-left: 6px;
}

// Continued file: modules/tickpoint-combat/ui/history-log.js

export async function addHistoryLog(actor, description, apCost, privateDetails = false) {
  const privateToOthers = actor.id !== game.user.character?.id || privateDetails;
  const content = privateToOthers ? `An action was taken.` : `${description} (-${apCost} AP)`;
  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
  await message.setFlag("tickpoint-combat", "history", true);
}

// Tick Initiative UI Highlight Update (combat-tracker.js)
Hooks.on("renderCombatTracker", (app, html, data) => {
  const combat = game.combat;
  if (!combat) return;

  for (let combatant of combat.combatants) {
    const actor = combatant.actor;
    const ticks = getActorSpeedTicks(actor);
    const listItem = html.find(`[data-combatant-id='${combatant.id}']`);
    if (!listItem.length) continue;

    const tickBar = document.createElement("div");
    tickBar.classList.add("tick-highlight-bar");

    for (let i = 0; i < 24; i++) {
      const tick = document.createElement("div");
      tick.classList.add("tick");
      if (ticks.includes(i)) tick.classList.add("active-tick");
      tickBar.appendChild(tick);
    }

    const longAction = actor.getFlag("tickpoint-combat", "longAction");
    if (longAction) {
      const progress = document.createElement("div");
      progress.classList.add("long-action-progress");
      progress.title = `${longAction.description ?? "Performing action"}: ${longAction.spent}/${longAction.total} AP`;
      progress.style.cursor = "pointer";

      const bar = document.createElement("div");
      bar.classList.add("progress-bar");
      const percent = Math.min(100, Math.floor((longAction.spent / longAction.total) * 100));
      bar.style.width = `${percent}%`;
      bar.innerText = `${longAction.spent}/${longAction.total}`;

      if (longAction.cancelled) {
        progress.classList.add("cancelled");
        bar.innerText = `Cancelled`;
        bar.style.backgroundColor = "#a00";
      }

      progress.appendChild(bar);

      const isOwner = game.user.isGM || actor.isOwner;
      if (isOwner && !longAction.cancelled) {
        const cancelBtn = document.createElement("button");
        cancelBtn.classList.add("cancel-long-action");
        cancelBtn.innerText = "✖";
        cancelBtn.title = "Cancel this long action";
        cancelBtn.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          const currentTick = game.combat?.round % 24;
          if (game.user.isGM || getActorSpeedTicks(actor).includes(currentTick)) {
            longAction.cancelled = true;
            await actor.setFlag("tickpoint-combat", "longAction", longAction);
            ui.notifications.info(`${actor.name}'s long action was cancelled.`);
            addHistoryLog(actor, `${longAction.description} was cancelled`, 0, true);
          }
        });
        progress.appendChild(cancelBtn);
      }

      progress.addEventListener("click", () => {
        if (isOwner && longAction.details) {
          new Dialog({
            title: `${actor.name} Long Action Details`,
            content: `<p><strong>Action:</strong> ${longAction.description}</p><p><strong>Progress:</strong> ${longAction.spent}/${longAction.total} AP</p><p><strong>Details:</strong> ${longAction.details}</p>`,
            buttons: { ok: { label: "Close" } }
          }).render(true);
        }
      });

      listItem.append(progress);
    }

    listItem.append(tickBar);
  }
});

function getActorSpeedTicks(actor) {
  const speed = actor.getFlag("tickpoint-combat", "speed") ?? 1;
  const ticks = [];
  for (let i = 0; i < 24; i++) {
    if (i % Math.floor(24 / speed) === 0) ticks.push(i);
  }
  return ticks;
}

// Long Action Tick Processor
Hooks.on("updateCombat", async (combat, changed, options, userId) => {
  const currentTick = combat.round % 24;

  for (let combatant of combat.combatants) {
    const actor = combatant.actor;
    const ticks = getActorSpeedTicks(actor);
    if (!ticks.includes(currentTick)) continue;

    const longAction = actor.getFlag("tickpoint-combat", "longAction");
    if (!longAction || longAction.cancelled) continue;

    longAction.spent += 1;
    await actor.setFlag("tickpoint-combat", "longAction", longAction);

    if (longAction.spent >= longAction.total) {
      await actor.unsetFlag("tickpoint-combat", "longAction");
      ui.notifications.info(`${actor.name} completed their long action.`);
    }
  }
});
