import "../lib/Core/prerequisites";
import { configure, spy } from "mobx";
import i18next from "i18next";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import { worker } from "./mocks/browser";

configure({
  enforceActions: "always",
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  safeDescriptors: false
});

registerCatalogMembers();

spy((event) => {
  if (event.type === "error") {
    throw new Error(event.message);
  }
});

beforeAll(async () => {
  // Unregister stale service workers from previous runs.
  // In Vitest watch mode, the old SW may stop intercepting requests
  // after the previous page context is destroyed. Unregistering forces
  // a clean SW registration on each run.
  const existingRegs = await navigator.serviceWorker.getRegistrations();
  for (const reg of existingRegs) {
    await reg.unregister();
  }

  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: true
  });

  await i18next.init({
    lng: "cimode",
    debug: false,
    resources: {}
  });
});

afterEach(() => {
  worker.resetHandlers();
});

afterAll(() => {
  worker.stop();
});
