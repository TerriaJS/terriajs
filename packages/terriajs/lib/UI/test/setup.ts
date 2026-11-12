// The design system's global CSS, as the UI's entry loads it, so a component
// tested on its own is styled and laid out as it is in the app
import "../layerOrder";
import "@terria/design-system/tokens.css";
import "@terria/design-system/reset.css";
import "@terria/design-system/base.css";
import "@terria/design-system/typography.css";
import "@terria/design-system/layout.css";
import "@terria/design-system/fonts.css";
import i18next from "i18next";
import { afterEach } from "vitest";
import { initReactI18next } from "react-i18next";
import english from "../../../wwwroot/languages/en/translation.json";
import { network } from "./network";

// React Aria's virtualizer reads process.env, which browsers don't have, as the
// design system's tests also provide
globalThis.process ??= { env: {} } as unknown as NodeJS.Process;

// TerriaJS's English strings, so tests find controls by the names users hear
await i18next.use(initReactI18next).init({
  lng: "en",
  resources: { en: { translation: english } },
  interpolation: { escapeValue: false }
});

// A request to another host that no handler answers is refused, as MSW's
// "error" strategy does, and fails the test that made it. That strategy alone
// lets through anything named like a file, a map tile's .png too, so only the
// test server's own files go through: the tests' modules, Cesium's, the fonts
const unhandled: string[] = [];
await network.start({
  quiet: true,
  onUnhandledRequest: (request, print) => {
    if (new URL(request.url).origin === location.origin) return;
    unhandled.push(`${request.method} ${request.url}`);
    print.error();
  }
});
afterEach(() => {
  network.resetHandlers();
  const requests = unhandled.splice(0);
  if (requests.length > 0) {
    throw new Error(`No handler answered:\n${requests.join("\n")}`);
  }
});
