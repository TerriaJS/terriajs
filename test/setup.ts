import "../lib/Core/prerequisites";
import { configure, spy } from "mobx";
import i18next from "i18next";
import registerCatalogMembers from "../lib/Models/Catalog/registerCatalogMembers";

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
  await i18next.init({
    lng: "cimode",
    debug: false,
    resources: {}
  });
});
