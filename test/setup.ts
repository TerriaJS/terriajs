import "../lib/Core/prerequisites";
import { configure, spy } from "mobx";
import i18next from "i18next";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";
import { worker } from "./mocks/browser";

configure({
  enforceActions: "always",
  computedRequiresReaction: true,
  safeDescriptors: false
});

registerCatalogMembers();

spy((event) => {
  if (event.type === "error") {
    throw new Error(event.message);
  }
});

beforeAll(async () => {
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
