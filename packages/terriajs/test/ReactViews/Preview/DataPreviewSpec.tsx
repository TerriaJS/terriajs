import { screen } from "@testing-library/react";
import { runInAction } from "mobx";
import CatalogMemberMixin from "../../../lib/ModelMixins/CatalogMemberMixin";
import CatalogGroup from "../../../lib/Models/Catalog/CatalogGroup";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import WebProcessingServiceCatalogFunction from "../../../lib/Models/Catalog/Ows/WebProcessingServiceCatalogFunction";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import DataPreview from "../../../lib/ReactViews/Preview/DataPreview";
import {
  PreviewRendererType,
  addCustomPreviewRenderer,
  removeCustomPreviewRenderer
} from "../../../lib/ReactViews/Preview/PreviewRenderers";
import { renderWithContexts } from "../withContext";

const CustomRenderer: PreviewRendererType = ({
  previewed
}: {
  previewed: CatalogMemberMixin.Instance;
}) => <div>Custom renderer for {previewed.name}</div>;

describe("DataPreview", function () {
  describe("preview rendering", function () {
    let terria: Terria;
    let viewState: ViewState;
    let mappableItem: GeoJsonCatalogItem;
    let functionItem: WebProcessingServiceCatalogFunction;
    let groupItem: CatalogGroup;

    beforeEach(function () {
      terria = new Terria({ baseUrl: "./" });
      viewState = new ViewState({ terria });

      mappableItem = new GeoJsonCatalogItem("test-geojson", terria);
      functionItem = new WebProcessingServiceCatalogFunction(
        "test-wps",
        terria
      );
      groupItem = new CatalogGroup("test-group", terria);

      runInAction(() => {
        mappableItem.setTrait(CommonStrata.definition, "name", "Test GeoJSON");
        // Avoid spinning up the preview map, which isn't what we're testing here.
        mappableItem.setTrait(CommonStrata.definition, "disablePreview", true);
        functionItem.setTrait(CommonStrata.definition, "name", "Test WPS");
        groupItem.setTrait(CommonStrata.definition, "name", "Test Group");
      });
    });

    // The renderer registry is module global, so leave it as we found it.
    afterEach(function () {
      removeCustomPreviewRenderer(mappableItem.type);
      removeCustomPreviewRenderer(functionItem.type);
      removeCustomPreviewRenderer(groupItem.type);
    });

    function renderPreview(previewed: CatalogMemberMixin.Instance) {
      return renderWithContexts(
        <DataPreview
          terria={terria}
          viewState={viewState}
          previewed={previewed}
        />,
        viewState
      );
    }

    it("renders the built-in renderer when no custom renderer is registered", function () {
      // MappablePreview, InvokeFunction and GroupPreview all title the preview
      // with the catalog member name.
      const mappablePreview = renderPreview(mappableItem);
      expect(
        screen.getByRole("heading", { name: "Test GeoJSON" })
      ).toBeVisible();
      expect(screen.queryByText(/Custom renderer for/)).toBeNull();
      mappablePreview.unmount();

      const functionPreview = renderPreview(functionItem);
      expect(screen.getByRole("heading", { name: "Test WPS" })).toBeVisible();
      expect(screen.queryByText(/Custom renderer for/)).toBeNull();
      functionPreview.unmount();

      const groupPreview = renderPreview(groupItem);
      expect(screen.getByRole("heading", { name: "Test Group" })).toBeVisible();
      expect(screen.queryByText(/Custom renderer for/)).toBeNull();
      groupPreview.unmount();
    });

    it("renders the custom renderer registered for the catalog member type", function () {
      addCustomPreviewRenderer(mappableItem.type, CustomRenderer);
      addCustomPreviewRenderer(functionItem.type, CustomRenderer);
      addCustomPreviewRenderer(groupItem.type, CustomRenderer);

      const mappablePreview = renderPreview(mappableItem);
      expect(
        screen.getByText("Custom renderer for Test GeoJSON")
      ).toBeVisible();
      expect(
        screen.queryByRole("heading", { name: "Test GeoJSON" })
      ).toBeNull();
      mappablePreview.unmount();

      const functionPreview = renderPreview(functionItem);
      expect(screen.getByText("Custom renderer for Test WPS")).toBeVisible();
      expect(screen.queryByRole("heading", { name: "Test WPS" })).toBeNull();
      functionPreview.unmount();

      const groupPreview = renderPreview(groupItem);
      expect(screen.getByText("Custom renderer for Test Group")).toBeVisible();
      expect(screen.queryByRole("heading", { name: "Test Group" })).toBeNull();
      groupPreview.unmount();
    });

    it("passes the preview props to the custom renderer", function () {
      let receivedProps: Record<string, unknown> | undefined;
      const PropCapturingRenderer: PreviewRendererType = (props) => {
        receivedProps = props;
        return null;
      };
      addCustomPreviewRenderer(mappableItem.type, PropCapturingRenderer);

      renderPreview(mappableItem);

      expect(receivedProps).toEqual(
        jasmine.objectContaining({
          previewed: mappableItem,
          terria,
          viewState
        })
      );
    });
  });
});
