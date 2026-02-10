import { ChartItem } from "../../../../lib/ModelMixins/ChartableMixin";
import GeoJsonCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import { BottomDockChart } from "../../../../lib/ReactViews/Custom/Chart/BottomDockChart";
import { renderWithContexts } from "../../withContext";

describe("BottomDockChart", function () {
  let terria: Terria;
  let viewState: ViewState;
  let chartItems: ChartItem[];

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
    chartItems = [
      {
        item: {} as never,
        id: "zzz",
        name: "zzz",
        categoryName: "ZZZ",
        key: `key-zzz`,
        type: "line",
        xAxis: { name: "Time", scale: "time" },
        points: [{ x: 10, y: 10 }],
        domain: { x: [0, 100], y: [0, 50] },
        units: "time",
        isSelectedInWorkbench: true,
        showInChartPanel: true,
        updateIsSelectedInWorkbench: () => {},
        getColor: () => "#fff",
        pointOnMap: { latitude: -33.8688, longitude: 151.2093 }
      },
      {
        item: {} as never,
        id: "aaa",
        name: "aaa",
        categoryName: "AAA",
        key: `key-aaa`,
        type: "line",
        xAxis: { name: "Time", scale: "time" },
        points: [{ x: 10, y: 10 }],
        domain: { x: [0, 100], y: [0, 50] },
        units: "time",
        isSelectedInWorkbench: true,
        showInChartPanel: true,
        updateIsSelectedInWorkbench: () => {},
        getColor: () => "#fff",
        pointOnMap: { latitude: -37.814, longitude: 144.96332 }
      }
    ];
  });

  it("renders all points on map for active chart items", async function () {
    renderWithContexts(
      <BottomDockChart
        height={100}
        initialHeight={100}
        initialWidth={100}
        xAxis={{ scale: "time" } as never}
        chartItems={chartItems}
      />,
      viewState
    );

    const pointsOnMap = terria.overlays.items.filter(
      (item) => item instanceof GeoJsonCatalogItem
    );
    expect(pointsOnMap.length).toBe(2);
  });
});
