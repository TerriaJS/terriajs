import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import MapNavigationModel from "../../../lib/ViewModels/MapNavigation/MapNavigationModel";
import { IMapNavigationItem } from "../../../lib/ViewModels/MapNavigation/MapNavigationModel";
import { GenericMapNavigationItemController } from "../../../lib/ViewModels/MapNavigation/MapNavigationItemController";

describe("MapNavigationModel", function () {
  let terria: Terria;
  let viewState: ViewState;
  let item1: IMapNavigationItem;
  let item2: IMapNavigationItem;
  let item3: IMapNavigationItem;
  let item4: IMapNavigationItem;
  let item5: IMapNavigationItem;
  let item2Duplicate: IMapNavigationItem;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: undefined
    });
    item1 = {
      id: "item1",
      name: "item1",
      title: "item1",
      order: 1,
      controller: new GenericMapNavigationItemController({
        icon: { id: "test" }
      }),
      screenSize: undefined,
      location: "TOP"
    };

    item2 = {
      id: "item2",
      name: "item2",
      title: "item2",
      order: 2,
      controller: new GenericMapNavigationItemController({
        icon: { id: "test" }
      }),
      screenSize: undefined,
      location: "TOP"
    };
    item2.controller.pinned = true;

    item3 = {
      id: "item3",
      name: "item3",
      title: "item3",
      order: 3,
      controller: new GenericMapNavigationItemController({
        icon: { id: "test" }
      }),
      screenSize: undefined,
      location: "TOP"
    };
    item3.controller.setVisible(false);

    item4 = {
      id: "item4",
      name: "item4",
      title: "item4",
      order: 4,
      controller: new GenericMapNavigationItemController({
        icon: { id: "test" }
      }),
      screenSize: undefined,
      location: "TOP"
    };
    item4.controller.collapsed = true;

    item5 = {
      id: "item5",
      name: "item5",
      title: "item5",
      order: 5,
      controller: new GenericMapNavigationItemController({
        icon: { id: "test" }
      }),
      screenSize: undefined,
      location: "TOP"
    };
    item5.controller.collapsed = true;

    item2Duplicate = {
      id: "item2",
      name: "item2",
      title: "item2",
      order: 2,
      controller: new GenericMapNavigationItemController({
        icon: { id: "test" }
      }),
      screenSize: undefined,
      location: "TOP"
    };
    item2Duplicate.controller.setVisible(false);
  });

  it("properly constructs model", function () {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(terria, items);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(4);
    let collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);
    let itemsId = mapNavigationModel.items.map((item) => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3", "item4", "item5"]);
  });

  it("properly sets items", function () {
    const mapNavigationModel = new MapNavigationModel(terria, [item2]);
    expect(mapNavigationModel.items.length).toEqual(1);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(1);
    let collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(0);
    let itemsId = mapNavigationModel.items.map((item) => item.id);
    expect(itemsId).toEqual(["item2"]);
    const items = [item1, item2Duplicate, item3, item4, item5];
    mapNavigationModel.setItems(items);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(0);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);
    itemsId = mapNavigationModel.items.map((item) => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3", "item4", "item5"]);
  });

  it("properly adds item to model", function () {
    const items = [item1, item2, item3];
    const mapNavigationModel = new MapNavigationModel(terria, items);
    let collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );

    expect(mapNavigationModel.items.length).toEqual(3);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(2);
    expect(collapsedItems.length).toEqual(0);
    let itemsId = mapNavigationModel.items.map((item) => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3"]);

    mapNavigationModel.addItem(item4);
    mapNavigationModel.addItem(item5);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(4);
    collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);
    itemsId = mapNavigationModel.items.map((item) => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3", "item4", "item5"]);

    mapNavigationModel.addItem(item2Duplicate);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(0);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);
    itemsId = mapNavigationModel.items.map((item) => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3", "item4", "item5"]);
  });

  it("properly adds item to index", function () {
    const items = [item1, item2, item3];
    const mapNavigationModel = new MapNavigationModel(terria, items);
    expect(mapNavigationModel.items.length).toEqual(3);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(2);
    let collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(0);
    let itemsId = mapNavigationModel.items.map((item) => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3"]);

    mapNavigationModel.addItem(item4, 2);
    mapNavigationModel.addItem(item5, 1);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(4);
    collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);
    itemsId = mapNavigationModel.items.map((item) => item.id);
    expect(itemsId).toEqual(["item1", "item5", "item2", "item4", "item3"]);
  });

  it("properly removes item", function () {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(terria, items);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(4);
    let collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);

    mapNavigationModel.remove(item1.id);
    expect(mapNavigationModel.items.length).toEqual(4);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);
  });

  it("properly hides item", function () {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(terria, items);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(4);
    let collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);

    mapNavigationModel.hide(item1.id);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);
  });

  it("properly collapse item", function () {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(terria, items);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(4);
    let collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);
    expect(mapNavigationModel.items[0].controller.collapsed).toBeFalsy();

    mapNavigationModel.setCollapsed(item1.id, true);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(4);
    collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(3);
    expect(mapNavigationModel.items[0].controller.collapsed).toBeTruthy();

    mapNavigationModel.setCollapsed(item1.id, false);
    collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);
    expect(mapNavigationModel.items[0].controller.collapsed).toBeFalsy();
  });

  it("properly sets pinned", function () {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(terria, items);
    spyOn(console, "error");

    mapNavigationModel.setPinned(item1.id, true);
    expect(console.error).toHaveBeenCalledTimes(0);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(2);
    expect(mapNavigationModel.visibleItems.length).toEqual(4);
    let collapsedItems = mapNavigationModel.visibleItems.filter(
      (item) => item.controller.collapsed
    );
    expect(collapsedItems.length).toEqual(2);
  });

  it("properly moves item", function () {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(terria, items);
    let itemsId = mapNavigationModel.items.map((item) => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3", "item4", "item5"]);

    mapNavigationModel.move(item1.id, item3.id);
    itemsId = mapNavigationModel.items.map((item) => item.id);
    expect(itemsId).toEqual(["item2", "item3", "item1", "item4", "item5"]);
  });
});
