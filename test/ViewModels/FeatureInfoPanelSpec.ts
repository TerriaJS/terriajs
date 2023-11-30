import { runInAction } from "mobx";
import PickedFeatures from "../../lib/Map/PickedFeatures/PickedFeatures";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import * as FeatureInfoPanel from "../../lib/ViewModels/FeatureInfoPanel";

describe("FeatureInfoPanel", function () {
  let viewState: ViewState;
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  describe("closePanel", function () {
    it("closes the open feature info panel", function () {
      runInAction(() => {
        viewState.terria.pickedFeatures = new PickedFeatures();
      });
      FeatureInfoPanel.closePanel(viewState);
      expect(viewState.terria.pickedFeatures).toBeUndefined();
    });
  });

  describe("addFeatureButton", function () {
    it("adds a new feature button generator", function () {
      expect(viewState.featureInfoPanelButtonGenerators.length).toEqual(0);
      FeatureInfoPanel.addFeatureButton(viewState, () => undefined);
      expect(viewState.featureInfoPanelButtonGenerators.length).toEqual(1);
      expect(typeof viewState.featureInfoPanelButtonGenerators[0]).toBe(
        "function"
      );
    });
  });
});
