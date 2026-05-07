/**
 * POC: ObservableMap vs plain Map reactivity for strata.
 *
 * Demonstrates why `_strata` must be an ObservableMap:
 * a plain Map does not notify MobX when a new key is added,
 * so autoruns that read config properties would not re-run
 * when a stratum is populated for the first time.
 */
import { ObservableMap, autorun, observable, runInAction } from "mobx";

describe("strata storage reactivity POC", function () {
  describe("ObservableMap", function () {
    it("autorun re-runs when a new stratum is added", function () {
      const strata = new ObservableMap<string, Record<string, unknown>>();
      strata.set("defaults", observable({ appName: "Default" }));

      const seen: unknown[] = [];
      const dispose = autorun(() => {
        for (const [, s] of strata) {
          seen.push(s["appName"]);
        }
      });

      expect(seen).toEqual(["Default"]); // initial run

      runInAction(() => {
        strata.set("definition", observable({ appName: "Definition" }));
      });

      // Re-ran after new stratum was added — sees both strata
      expect(seen).toEqual(["Default", "Default", "Definition"]);

      dispose();
    });
  });

  describe("plain Map", function () {
    it("autorun does NOT re-run when a new stratum is added", function () {
      const strata = new Map<string, Record<string, unknown>>();
      strata.set("defaults", observable({ appName: "Default" }));

      const seen: unknown[] = [];
      const dispose = autorun(() => {
        for (const [, s] of strata) {
          seen.push(s["appName"]);
        }
      });

      expect(seen).toEqual(["Default"]); // initial run

      runInAction(() => {
        strata.set("definition", observable({ appName: "Definition" }));
      });

      // autorun did NOT re-run — the definition stratum is invisible
      expect(seen).toEqual(["Default"]);

      dispose();
    });

    it("autorun DOES re-run when an existing stratum's key is mutated", function () {
      const strata = new Map<string, Record<string, unknown>>();
      const defaultStratum = observable<Record<string, unknown>>({
        appName: "Default"
      });
      strata.set("defaults", defaultStratum);

      const seen: unknown[] = [];
      const dispose = autorun(() => {
        for (const [, s] of strata) {
          seen.push(s["appName"]);
        }
      });

      expect(seen).toEqual(["Default"]); // initial run

      runInAction(() => {
        defaultStratum["appName"] = "Updated";
      });

      // Re-ran because the inner observable property changed
      expect(seen).toEqual(["Default", "Updated"]);

      dispose();
    });
  });
});
