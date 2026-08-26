import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import ViewState, {
  DATA_CATALOG_NAME
} from "../../lib/ReactViewModels/ViewState";
import SimpleCatalogItem from "../Helpers/SimpleCatalogItem";
import TerriaReference from "../../lib/Models/Catalog/CatalogReferences/TerriaReference";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import CatalogIndexReference from "../../lib/Models/Catalog/CatalogReferences/CatalogIndexReference";
import CatalogGroup from "../../lib/Models/Catalog/CatalogGroup";
import GroupMixin from "../../lib/ModelMixins/GroupMixin";
import getAncestors from "../../lib/Models/getAncestors";
import { animationDuration } from "../../lib/ReactViews/StandardUserInterface/StandardUserInterface";

describe("ViewState", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria
    });
  });

  describe("viewCatalogMember", function () {
    it("handle nested references", async function () {
      // Test nested reference
      // CatalogIndexReference -> TerriaReference -> CatalogGroup
      terria = new Terria();

      const terriaReference = new TerriaReference("test", terria);
      terriaReference.setTrait(
        CommonStrata.user,
        "url",
        "test/init/wms-v8.json"
      );
      terriaReference.setTrait(CommonStrata.user, "isGroup", true);
      terria.addModel(terriaReference);

      const catalogIndexReference = new CatalogIndexReference("test", terria);

      await viewState.viewCatalogMember(catalogIndexReference);

      expect(viewState.previewedItem).toBeDefined();
      expect(viewState.previewedItem?.type).toBe("group");
    });

    describe("in tabbed mode", function () {
      beforeEach(async function () {
        runInAction(() => {
          terria.configParameters.tabbedCatalog = true;
        });
        await terria.applyInitData({
          initData: {
            catalog: [
              {
                id: "first-tab",
                type: "group",
                name: "First tab",
                members: [
                  {
                    id: "first-tab-group",
                    type: "group",
                    name: "Group in first tab"
                  }
                ]
              },
              {
                id: "second-tab",
                type: "group",
                name: "Second tab",
                members: [
                  {
                    id: "sub-group",
                    type: "group",
                    name: "Sub group",
                    members: [
                      {
                        id: "nested-item",
                        type: "group",
                        name: "Nested item"
                      }
                    ]
                  }
                ]
              },
              {
                // a reference group, so we can test the behaviour for
                // dynamic group tabs that are not loaded statically on app
                // start
                id: "reference-tab",
                type: "terria-reference",
                name: "Reference tab",
                url: "test/init/wms-v8.json",
                isGroup: true
              }
            ]
          }
        });
      });

      it("switches to the top level tab containing the item", async function () {
        const secondTab = terria.getModelById(CatalogGroup, "second-tab")!;
        const subGroup = terria.getModelById(CatalogGroup, "sub-group")!;
        (await secondTab.loadMembers()).throwIfError();
        (await subGroup.loadMembers()).throwIfError();

        const item = terria.getModelById(CatalogGroup, "nested-item")!;
        (await viewState.viewCatalogMember(item)).throwIfError();

        // the tab is the top level group, not the immediate parent group
        expect(viewState.activeTabIdInCategory).toBe("second-tab");
      });

      it("switches to the parent tab of an item in a tab that has not been loaded", async function () {
        const subGroup = terria.getModelById(CatalogGroup, "sub-group")!;

        // Because `second-tab` has not been loaded, the parent -> member links
        // are not established yet, so the item has no known ancestors.
        expect(getAncestors(subGroup).length).toBe(0);

        (await viewState.viewCatalogMember(subGroup)).throwIfError();

        expect(viewState.activeTabIdInCategory).toBe("second-tab");
      });

      it("loads the members of the parent tab", async function () {
        const secondTab = terria.getModelById(CatalogGroup, "second-tab")!;
        const loadMembers = spyOn(secondTab, "loadMembers").and.callThrough();

        const subGroup = terria.getModelById(CatalogGroup, "sub-group")!;
        (await viewState.viewCatalogMember(subGroup)).throwIfError();

        expect(loadMembers).toHaveBeenCalled();
      });

      it("switches to the parent tab of an item in a reference group tab", async function () {
        const referenceTab = terria.getModelById(
          TerriaReference,
          "reference-tab"
        )!;
        (await referenceTab.loadReference()).throwIfError();
        const dereferenced = referenceTab.target;
        expect(GroupMixin.isMixedInto(dereferenced)).toBeTruthy();
        if (!GroupMixin.isMixedInto(dereferenced)) return;
        (await dereferenced.loadMembers()).throwIfError();

        // a group inside the referenced catalog (test/init/wms-v8.json)
        const wmsGroup = terria.getModelById(CatalogGroup, "MLzS8W")!;
        (await viewState.viewCatalogMember(wmsGroup)).throwIfError();

        expect(viewState.activeTabIdInCategory).toBe("reference-tab");
      });

      it("opens the ancestor groups of the item", async function () {
        const secondTab = terria.getModelById(CatalogGroup, "second-tab")!;
        const subGroup = terria.getModelById(CatalogGroup, "sub-group")!;
        (await secondTab.loadMembers()).throwIfError();
        (await subGroup.loadMembers()).throwIfError();

        const item = terria.getModelById(CatalogGroup, "nested-item")!;
        (await viewState.viewCatalogMember(item)).throwIfError();

        expect(secondTab.isOpen).toBe(true);
        expect(subGroup.isOpen).toBe(true);

        // and closes them again when `isOpen` is false
        (await viewState.viewCatalogMember(item, false)).throwIfError();

        expect(secondTab.isOpen).toBe(false);
        expect(subGroup.isOpen).toBe(false);
      });
    });
  });

  describe("removeModelReferences", function () {
    it("unsets the previewedItem if it matches the model", async function () {
      const item = new SimpleCatalogItem("testId", terria);
      await viewState.viewCatalogMember(item);
      viewState.removeModelReferences(item);
      expect(viewState.previewedItem).toBeUndefined();
    });

    it("unsets the userDataPreviewedItem if it matches the model", function () {
      const item = new SimpleCatalogItem("testId", terria);
      viewState.userDataPreviewedItem = item;
      viewState.removeModelReferences(item);
      expect(viewState.userDataPreviewedItem).toBeUndefined();
    });
  });

  describe("tourPointsWithValidRefs", function () {
    it("returns tourPoints ordered by priority", function () {
      runInAction(() => {
        viewState.setTourIndex(0);
        viewState.setShowTour(true);
        (viewState as any).updateAppRef("TestRef", { current: true });
        (viewState as any).updateAppRef("TestRef2", { current: true });
        (viewState as any).updateAppRef("TestRef3", { current: true });
        viewState.tourPoints = [
          {
            appRefName: "TestRef2",
            priority: 20,
            content: "## Motivated by food\n\nNeko loves food"
          },
          {
            appRefName: "TestRef3",
            priority: 30,
            content: "## Lazy\n\nThey like to lounge around all day"
          },
          {
            appRefName: "TestRef",
            priority: 10,
            content: "## Best friends\n\nMochi and neko are best friends"
          }
        ];
      });
      expect(viewState.tourPointsWithValidRefs).toBeDefined();
      expect(viewState.tourPointsWithValidRefs[0].priority).toEqual(10);
      expect(viewState.tourPointsWithValidRefs[1].priority).toEqual(20);
      expect(viewState.tourPointsWithValidRefs[2].priority).toEqual(30);
      expect(viewState.tourPointsWithValidRefs[0].appRefName).toEqual(
        "TestRef"
      );
    });
  });
  describe("tour and trainer interaction", function () {
    beforeEach(function () {
      jasmine.clock().install();
    });
    afterEach(function () {
      jasmine.clock().uninstall();
    });
    it("disables trainer bar if turning on tour", function () {
      runInAction(() => {
        viewState.setTrainerBarExpanded(true);
        viewState.setTrainerBarShowingAllSteps(true);
      });
      expect(viewState.trainerBarExpanded).toEqual(true);
      expect(viewState.trainerBarShowingAllSteps).toEqual(true);
      expect(viewState.showTour).toEqual(false);

      runInAction(() => {
        viewState.setShowTour(true);
      });

      jasmine.clock().tick(animationDuration); // wait for workbench animation

      expect(viewState.trainerBarExpanded).toEqual(false);
      expect(viewState.trainerBarShowingAllSteps).toEqual(false);
      expect(viewState.showTour).toEqual(true);
    });
  });

  it("opens Add Data when openAddData is set to true in config file", function () {
    terria.configParameters.openAddData = true;
    viewState.afterTerriaStarted();
    expect(viewState.explorerPanelIsVisible).toEqual(true);
    expect(viewState.activeTabCategory).toEqual(DATA_CATALOG_NAME);
  });

  it("does not open Add Data when openAddData is set to false in config file", function () {
    terria.configParameters.openAddData = false;
    viewState.afterTerriaStarted();
    expect(viewState.explorerPanelIsVisible).toEqual(false);
  });
});
