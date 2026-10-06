import { fireEvent, screen } from "@testing-library/react";
import getPath from "../../../lib/Core/getPath";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import WorkbenchItem from "../../../lib/ReactViews/Workbench/WorkbenchItem";
import { renderWithContexts } from "../withContext";

describe("WorkbenchItem", function () {
  let viewState: ViewState;
  let item: GeoJsonCatalogItem;
  let startSort: jasmine.Spy;

  const SortableWorkbenchItem = WorkbenchItem as any;

  beforeEach(function () {
    const terria = new Terria({ baseUrl: "./" });
    viewState = new ViewState({ terria });
    item = new GeoJsonCatalogItem("test-item", terria);
    startSort = jasmine.createSpy("startSort");
  });

  function renderItem() {
    const result = renderWithContexts(
      <SortableWorkbenchItem
        item={item}
        viewState={viewState}
        sortableIndex={0}
        onSortableItemReadyToMove={startSort}
      />,
      viewState
    );
    const draggable = screen.getAllByTitle(getPath(item, " → "))[0];
    return { ...result, draggable };
  }

  function moveMouse(clientX: number, buttons = 1) {
    fireEvent.mouseMove(document, { clientX, clientY: 10, buttons });
  }

  it("doesn't start sorting for a click with a little mouse movement", function () {
    const { draggable } = renderItem();
    fireEvent.mouseDown(draggable, { clientX: 10, clientY: 10 });
    moveMouse(12);
    fireEvent.mouseUp(document);
    moveMouse(30);

    expect(startSort).not.toHaveBeenCalled();
  });

  it("starts sorting once the mouse has moved past the threshold", function () {
    const { draggable } = renderItem();
    fireEvent.mouseDown(draggable, { clientX: 10, clientY: 10 });
    moveMouse(30);

    expect(startSort).toHaveBeenCalledTimes(1);
  });

  it("stops listening if the mouse moves with no button pressed", function () {
    const { draggable } = renderItem();
    fireEvent.mouseDown(draggable, { clientX: 10, clientY: 10 });
    moveMouse(30, 0);
    moveMouse(50);

    expect(startSort).not.toHaveBeenCalled();
  });

  it("stops listening on mouseup even if another handler stops it propagating", function () {
    const { draggable } = renderItem();
    draggable.addEventListener("mouseup", (e) => e.stopPropagation());
    fireEvent.mouseDown(draggable, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(draggable);
    moveMouse(30);

    expect(startSort).not.toHaveBeenCalled();
  });

  it("stops listening when unmounted", function () {
    const { draggable, unmount } = renderItem();
    fireEvent.mouseDown(draggable, { clientX: 10, clientY: 10 });
    unmount();
    moveMouse(30);

    expect(startSort).not.toHaveBeenCalled();
  });
});
