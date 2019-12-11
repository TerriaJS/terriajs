import WorkbenchItem, {
  WorkbenchItemRaw
} from "../../../lib/ReactViews/Workbench/WorkbenchItem";
import { getShallowRenderedOutput } from "../MoreShallowTools";
import React from "react";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import CatalogItem from "../../../lib/Models/CatalogItem";

describe("WorkbenchItem", function() {
  let terria, viewState, item;

  beforeEach(function() {
    terria = new Terria({ baseUrl: "./" });
    viewState = new ViewState({ terria });
    item = new CatalogItem(terria);
  });

  it("should be wrapped with the sortable HOC as the first HOC", function() {
    expect(WorkbenchItem.name).toBe("SortableItem");
  });

  it("should render WorkbenchItemRaw with a given classname", function() {
    const workbench = (
      <WorkbenchItemRaw
        terria={terria}
        viewState={viewState}
        item={item}
        onTouchStart={() => {}}
        onMouseDown={() => {}}
        t={() => {}}
        className="pheature"
      />
    );
    const result = getShallowRenderedOutput(workbench);
    expect(result.props.className).toContain("pheature");
  });

  it("should render the translation HOC as its child, so it is draggable", function() {
    const workbench = <WorkbenchItem />;
    const result = getShallowRenderedOutput(workbench);
    expect(result.type.name).toBe("I18nextWithTranslation");
    expect(result.type.displayName).toBe(
      "withI18nextTranslation(WorkbenchItem)"
    );
  });
});
