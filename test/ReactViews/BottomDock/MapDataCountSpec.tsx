import { render, screen } from "@testing-library/react";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { runInAction } from "mobx";
import MapDataCount from "../../../lib/ReactViews/BottomDock/MapDataCount";
import SimpleCatalogItem from "../../Helpers/SimpleCatalogItem";

describe("MapDataCount", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  it("renders noMapDataEnabled when no data on map", function () {
    expect(viewState.useSmallScreenInterface).toEqual(false);
    render(<MapDataCount terria={terria} viewState={viewState} />);
    expect(screen.getByText("countDatasets.noMapDataEnabled")).toBeVisible();
  });

  it("renders count of datasets on map", function () {
    const simple1 = new SimpleCatalogItem("simple1", terria);
    terria.addModel(simple1);
    terria.workbench.add(simple1);

    render(<MapDataCount terria={terria} viewState={viewState} />);

    expect(screen.getByText("countDatasets.mapDataState")).toBeVisible();
  });

  it("doesn't render anything when in mobile UI via useSmallScreenInterface", function () {
    runInAction(() => (viewState.useSmallScreenInterface = true));
    expect(viewState.useSmallScreenInterface).toEqual(true);
    render(<MapDataCount terria={terria} viewState={viewState} />);

    expect(
      screen.queryByText("countDatasets.noMapDataEnabled")
    ).not.toBeInTheDocument();
  });
});
