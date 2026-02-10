import "../lib/Core/prerequisites";
import { configure, spy } from "mobx";
import { http, HttpResponse } from "msw";
import i18next from "i18next";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import { worker } from "./mocks/browser";
import regionMapping from "../wwwroot/data/regionMapping.json";

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

  // Serve regionMapping.json globally — many tests create Terria/CSV items
  // that load region providers. Without a build step, the default URL
  // (build/TerriaJS/data/regionMapping.json) doesn't exist in Vite's serve tree.
  worker.use(
    http.get("*/data/regionMapping.json", () =>
      HttpResponse.json(regionMapping)
    )
  );

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
