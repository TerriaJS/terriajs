import i18next from "i18next";
import { autorun, computed, IReactionDisposer, makeObservable } from "mobx";
import TerriaError from "../../lib/Core/TerriaError";
import AutoRefreshingMixin from "../../lib/ModelMixins/AutoRefreshingMixin";
import MappableMixin, { MapItem } from "../../lib/ModelMixins/MappableMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CreateModel from "../../lib/Models/Definition/CreateModel";
import Terria from "../../lib/Models/Terria";
import AutoRefreshingTraits from "../../lib/Traits/TraitsClasses/AutoRefreshingTraits";
import CatalogMemberTraits from "../../lib/Traits/TraitsClasses/CatalogMemberTraits";
import mixTraits from "../../lib/Traits/mixTraits";

class TestAutoRefreshingItem extends AutoRefreshingMixin(
  MappableMixin(
    CreateModel(mixTraits(AutoRefreshingTraits, CatalogMemberTraits))
  )
) {
  refreshResult: () => Promise<void> = () => Promise.resolve();

  constructor(id: string, terria: Terria) {
    super(id, terria);
    makeObservable(this);
  }

  refreshData() {
    return this.refreshResult();
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  get mapItems(): MapItem[] {
    return [];
  }
}

async function flushPromises() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

describe("AutoRefreshingMixin", function () {
  let terria: Terria;
  let item: TestAutoRefreshingItem;
  let errorSpy: jasmine.Spy;
  let disposeObserver: IReactionDisposer;

  async function tick() {
    jasmine.clock().tick(1000);
    await flushPromises();
  }

  beforeEach(function () {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 0, 1));
    terria = new Terria();
    errorSpy = spyOn(terria.errorService, "error");
    item = new TestAutoRefreshingItem("live", terria);
    item.setTrait(CommonStrata.user, "name", "Live feed");
    item.setTrait(CommonStrata.user, "refreshInterval", 1);
    disposeObserver = autorun(() => item.mapItems);
  });

  afterEach(function () {
    jasmine.clock().uninstall();
    disposeObserver?.();
  });

  it("reports a failed refresh once while it keeps failing", async function () {
    item.refreshResult = () => Promise.reject(new Error("feed down"));
    await tick();
    await tick();
    await tick();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [error, display] = errorSpy.calls.mostRecent().args;
    expect(error).toEqual(jasmine.any(TerriaError));
    expect(error.title).toBe(
      i18next.t(($) => $.models.autoRefreshing.refreshErrorTitle)
    );
    expect(display).toBe("none");
  });

  it("reports again after a successful refresh", async function () {
    item.refreshResult = () => Promise.reject(new Error("feed down"));
    await tick();
    item.refreshResult = () => Promise.resolve();
    await tick();
    item.refreshResult = () => Promise.reject(new Error("feed down again"));
    await tick();

    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  describe("on the workbench", function () {
    beforeEach(function () {
      terria.workbench.items = [item];
    });

    it("shows the failure on the item and tags it workbench", async function () {
      item.refreshResult = () => Promise.reject(new Error("feed down"));
      await tick();

      const [error, display] = errorSpy.calls.mostRecent().args;
      expect(display).toBe("workbench");
      expect(terria.workbench.getItemErrors(item)).toEqual([error]);
    });

    it("keeps the item's other errors", async function () {
      const loadError = new TerriaError({ message: "load failed" });
      terria.workbench.setItemErrors(item, [loadError]);
      item.refreshResult = () => Promise.reject(new Error("feed down"));
      await tick();

      expect(terria.workbench.getItemErrors(item).length).toBe(2);
      item.refreshResult = () => Promise.resolve();
      await tick();

      expect(terria.workbench.getItemErrors(item)).toEqual([loadError]);
    });

    it("clears the failure after a successful refresh", async function () {
      item.refreshResult = () => Promise.reject(new Error("feed down"));
      await tick();
      item.refreshResult = () => Promise.resolve();
      await tick();

      expect(terria.workbench.getItemErrors(item)).toEqual([]);
    });
  });

  it("reports a refresh that throws synchronously", async function () {
    item.refreshResult = () => {
      throw new Error("bad config");
    };
    await tick();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
