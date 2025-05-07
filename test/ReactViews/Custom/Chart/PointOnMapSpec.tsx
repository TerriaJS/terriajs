import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import PointOnMap from "../../../../lib/ReactViews/Custom/Chart/PointOnMap";
import { renderWithContexts } from "../../withContext";

describe("PointOnMap", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  it("adds the point as an overlay on mount", async function () {
    renderWithContexts(
      <PointOnMap
        color="red"
        point={{ latitude: -37.814, longitude: 144.96332 }}
      />,
      viewState
    );

    const pointItem: GeoJsonCatalogItem = terria.overlays
      .items[0] as GeoJsonCatalogItem;
    expect(pointItem).toBeDefined();
    expect(pointItem instanceof GeoJsonCatalogItem).toBe(true);

    await pointItem.loadMapItems();
    expect(pointItem.style["marker-color"]).toBe("red");
    const geometry: any = pointItem.geoJsonData?.geometry;
    expect(geometry.type).toBe("Point");
    expect(geometry.coordinates).toEqual([144.96332, -37.814]);
  });

  it("it removes the point from overlay on umount", async function () {
    const { unmount } = renderWithContexts(
      <PointOnMap
        color="red"
        point={{ latitude: -37.814, longitude: 144.96332 }}
      />,
      viewState
    );

    expect(terria.overlays.items.length).toBe(1);
    unmount();

    expect(terria.overlays.items.length).toBe(0);
  });
});
