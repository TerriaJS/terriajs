import i18next from "i18next";
import { configure, spy } from "mobx";
import { http, HttpResponse } from "msw";
import { initReactI18next } from "react-i18next";
import "../lib/Core/prerequisites";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import regionMapping from "../wwwroot/data/regionMapping.json";
import english from "../wwwroot/languages/en/translation.json";
import { worker } from "./mocks/browser";

configure({
  enforceActions: "always",
  computedRequiresReaction: true,
  // Turn off safeDescriptors required for spying on computed items
  // TODO: mobx docs says this should only be enabled when need and not globally,
  // see if we can remove this global setting
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
    onUnhandledRequest(request, print) {
      const url = new URL(request.url);
      // Allow Vite dev server and local fixture requests
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return;
      }
      print.error();
      throw new Error(`UNHANDLED REQUEST: ${request.method} ${request.url}`);
    },
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

  await i18next.use(initReactI18next).init({
    lng: "cimode",
    debug: false,
    resources: {
      en: {
        translation: english
      }
    }
  });
});

beforeEach(function () {
  worker.resetHandlers();
});

afterAll(function () {
  worker.resetHandlers();
  worker.stop();
});
