import "./cleanup.js";
import "./quick-action-ui.js";
// ... import other scripts as necessary

Hooks.once("init", () => {
  console.log("TickPoint Combat | Initializing module");
  // Register your settings, formulas, and any other initialization here
});

// Listeners to play sounds - add inside activateListeners()
await actor.setFlag("tickpoint-combat", "currentAP", currentAP - apCost);
await addHistoryLog(actor, `Used action: ${label}`, apCost);
await AudioHelper.play({ src: "sounds/dice.wav", volume: 0.8, autoplay: true });

