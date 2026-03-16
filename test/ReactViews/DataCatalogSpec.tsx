import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import CatalogGroup from "../../lib/Models/Catalog/CatalogGroup";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import DataCatalog from "../../lib/ReactViews/DataCatalog/DataCatalog";
import { withThemeContext } from "./withContext";

describe("DataCatalog", function () {
  let terria: Terria;
  let viewState: ViewState;

  beforeAll(async () => {
    await i18next.changeLanguage("en");
  });

  afterAll(async () => {
    await i18next.changeLanguage("cimode");
  });

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
  });

  it("does not show the My Data group", function () {
    const anotherGroup = new CatalogGroup("another-group", terria);
    anotherGroup.setTrait(CommonStrata.definition, "name", "Another Group");
    terria.addModel(anotherGroup);
    terria.catalog.group.add(CommonStrata.definition, anotherGroup);

    render(
      withThemeContext(
        <DataCatalog
          terria={terria}
          viewState={viewState}
          items={terria.catalog.group.memberModels}
        />
      )
    );

    expect(screen.getByText("Another Group")).toBeInTheDocument();
    expect(screen.queryByText("User-Added Data")).not.toBeInTheDocument();
  });
});
