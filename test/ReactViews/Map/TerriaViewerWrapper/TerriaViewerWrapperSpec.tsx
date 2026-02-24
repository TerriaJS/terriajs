import { screen } from "@testing-library/react";
import { runInAction } from "mobx";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";
import ViewerMode from "../../../../lib/Models/ViewerMode";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import { TerriaViewerWrapper } from "../../../../lib/ReactViews/Map/TerriaViewerWrapper";
import { renderWithContexts } from "../../withContext";

describe("TerriaViewerWrapper", function () {
  let viewState: ViewState;
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({ terria, catalogSearchProvider: undefined });
  });

  describe("when main viewer is in leaflet mode", function () {
    beforeEach(function () {
      runInAction(() => {
        terria.mainViewer.viewerMode = ViewerMode.Leaflet;
      });
    });

    it("sets container background if the active base map specifies a backgroundColor", async function () {
      terria.baseMapsModel.loadFromJson(CommonStrata.user, {
        items: [
          {
            item: {
              id: "test-basemap",
              type: "url-template-imagery"
            },
            backgroundColor: "lime"
          }
        ]
      });
      await terria.mainViewer.setBaseMap(
        terria.baseMapsModel.baseMapItems[0].item
      );

      renderWithContexts(<TerriaViewerWrapper />, viewState);
      const container = screen.queryByTestId("mapContainer");
      console.log(container?.dataset, container?.classList);
      expect(container).toHaveStyle(`background-color: rgb(0, 255, 0)`);
    });
  });
});
