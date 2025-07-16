// Extend item sheet UI for AP override (item-sheet.js)
Hooks.on("renderItemSheet", (app, html, data) => {
  if (!game.user.isGM) return;

  const item = app.object;
  if (!["weapon", "spell"].includes(item.type)) return;

  const override = item.getFlag("tickpoint-combat", "apCost");
  const apInput = $(
    `<div class="form-group">
      <label>Override AP Cost</label>
      <input type="number" name="flags.tickpoint-combat.apCost" value="${override ?? ""}"/>
      ${override !== undefined ? `<span class="ap-override-indicator">(Overridden)</span>` : ""}
    </div>`
  );

  html.find(".sheet-header").after(apInput);
});
