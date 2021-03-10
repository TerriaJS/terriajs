import React from "react";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import { GLYPHS } from "../../../../lib/ReactViews/Icon";
import MapNavigationModel from "../../../../lib/ReactViews/Map/Navigation/MapNavigationModel";
import {
  MapNavigationItemType,
  MapNavigationItemExtendedType
} from "../../../../lib/ReactViews/Map/Navigation/MapNavigationItem";

describe("MapNavigationModel", function() {
  let terria: Terria;
  let viewState: ViewState;
  let item1: MapNavigationItemType;
  let item2: MapNavigationItemType;
  let item3: MapNavigationItemType;
  let item4: MapNavigationItemType;
  let item5: MapNavigationItemExtendedType;
  let item2Duplicate: MapNavigationItemType;
  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
    item1 = {
      id: "item1",
      name: "item1",
      title: "item1",
      glyph: "item1",
      location: "TOP",
      hidden: false,
      pinned: false,
      onClick: () => {},
      mapIconButtonProps: {},
      order: 1,
      height: 42,
      width: 32,
      itemRef: React.createRef()
    };

    item2 = {
      id: "item2",
      name: "item2",
      title: "item2",
      glyph: "item2",
      location: "TOP",
      hidden: false,
      mapIconButtonProps: {},
      pinned: true,
      onClick: () => {},
      order: 2,
      height: 42,
      width: 32,
      itemRef: React.createRef()
    };

    item3 = {
      id: "item3",
      name: "item3",
      title: "item3",
      glyph: "item3",
      location: "TOP",
      hidden: true,
      mapIconButtonProps: {},
      pinned: false,
      onClick: () => {},
      order: 3,
      height: 42,
      width: 32,
      itemRef: React.createRef()
    };
    item4 = {
      id: "item4",
      name: "item4",
      title: "item4",
      glyph: "item4",
      location: "TOP",
      hidden: false,
      mapIconButtonProps: {},
      pinned: false,
      forceCollapsed: true,
      onClick: () => {},
      order: 4,
      height: 42,
      width: 32,
      itemRef: React.createRef()
    };

    item5 = {
      id: "item5",
      name: "item5",
      title: "item5",
      glyph: "item5",
      location: "TOP",
      hidden: false,
      mapIconButtonProps: {},
      pinned: false,
      forceCollapsed: false,
      collapsed: true,
      onClick: () => {},
      order: 5,
      height: 42,
      width: 32,
      itemRef: React.createRef()
    };

    item2Duplicate = {
      id: "item2",
      name: "item2",
      title: "item2",
      glyph: "item2",
      location: "TOP",
      hidden: true,
      mapIconButtonProps: {},
      pinned: false,
      onClick: () => {},
      order: 2,
      height: 42,
      width: 32,
      itemRef: React.createRef()
    };
  });

  it("properly constructs model", function() {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(items);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(3);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);
    let itemsId = mapNavigationModel.items.map(item => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3", "item4", "item5"]);
  });

  it("properly sets items", function() {
    const mapNavigationModel = new MapNavigationModel([item2]);
    expect(mapNavigationModel.items.length).toEqual(1);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(1);
    expect(mapNavigationModel.visibleItems.length).toEqual(1);
    expect(mapNavigationModel.collapsedItems.length).toEqual(0);
    let itemsId = mapNavigationModel.items.map(item => item.id);
    expect(itemsId).toEqual(["item2"]);
    const items = [item1, item2Duplicate, item3, item4, item5];
    mapNavigationModel.setItems(items);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(0);
    expect(mapNavigationModel.enabledItems.length).toEqual(2);
    expect(mapNavigationModel.visibleItems.length).toEqual(2);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);
    itemsId = mapNavigationModel.items.map(item => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3", "item4", "item5"]);
  });

  it("properly adds item to model", function() {
    const items = [item1, item2, item3];
    const mapNavigationModel = new MapNavigationModel(items);
    expect(mapNavigationModel.items.length).toEqual(3);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(2);
    expect(mapNavigationModel.visibleItems.length).toEqual(2);
    expect(mapNavigationModel.collapsedItems.length).toEqual(0);
    let itemsId = mapNavigationModel.items.map(item => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3"]);

    mapNavigationModel.addItem(item4);
    mapNavigationModel.addItem(item5);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(3);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);
    itemsId = mapNavigationModel.items.map(item => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3", "item4", "item5"]);

    mapNavigationModel.addItem(item2Duplicate);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(0);
    expect(mapNavigationModel.enabledItems.length).toEqual(2);
    expect(mapNavigationModel.visibleItems.length).toEqual(2);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);
    itemsId = mapNavigationModel.items.map(item => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3", "item4", "item5"]);
  });

  it("properly adds item to index", function() {
    const items = [item1, item2, item3];
    const mapNavigationModel = new MapNavigationModel(items);
    expect(mapNavigationModel.items.length).toEqual(3);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(2);
    expect(mapNavigationModel.visibleItems.length).toEqual(2);
    expect(mapNavigationModel.collapsedItems.length).toEqual(0);
    let itemsId = mapNavigationModel.items.map(item => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3"]);

    mapNavigationModel.addItem(item4, 2);
    mapNavigationModel.addItem(item5, 1);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(3);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);
    itemsId = mapNavigationModel.items.map(item => item.id);
    expect(itemsId).toEqual(["item1", "item5", "item2", "item4", "item3"]);
  });

  it("properly removes item", function() {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(items);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(3);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);

    mapNavigationModel.removeItem(item1.id);
    expect(mapNavigationModel.items.length).toEqual(4);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(2);
    expect(mapNavigationModel.visibleItems.length).toEqual(2);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);
  });

  it("properly hides item", function() {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(items);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(3);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);

    mapNavigationModel.hideItem(item1.id);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(2);
    expect(mapNavigationModel.visibleItems.length).toEqual(2);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);
  });

  it("properly collapse item", function() {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(items);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(3);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);
    expect(mapNavigationModel.items[0].collapsed).toBeFalsy();

    mapNavigationModel.collapseItem(item1.id);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(1);
    expect(mapNavigationModel.enabledItems.length).toEqual(3);
    expect(mapNavigationModel.visibleItems.length).toEqual(2);
    expect(mapNavigationModel.collapsedItems.length).toEqual(2);
    expect(mapNavigationModel.items[0].collapsed).toBeTruthy();

    mapNavigationModel.uncollapseItem(item1.id);
    expect(mapNavigationModel.items[0].collapsed).toBeFalsy();
  });

  it("properly sets pinned", function() {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(items);
    spyOn(console, "error");

    mapNavigationModel.setPinned(item1.id, true);
    expect(console.error).toHaveBeenCalledTimes(0);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(2);
    expect(mapNavigationModel.enabledItems.length).toEqual(3);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);
  });

  it("properly sets pinned2", function() {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(items);
    spyOn(console, "error");

    mapNavigationModel.setPinned(item5.id, true);
    expect(console.error).toHaveBeenCalledTimes(0);
    expect(mapNavigationModel.items.length).toEqual(5);
    expect(mapNavigationModel.pinnedItems.length).toEqual(2);
    expect(mapNavigationModel.enabledItems.length).toEqual(3);
    expect(mapNavigationModel.visibleItems.length).toEqual(3);
    expect(mapNavigationModel.collapsedItems.length).toEqual(1);
  });

  it("properly sets pinned3", function() {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(items);
    spyOn(console, "error");

    mapNavigationModel.setPinned(item4.id, true);
    expect(console.error).toHaveBeenCalled();
    expect(mapNavigationModel.pinnedItems.length).toEqual(2);
  });

  it("properly moves item", function() {
    const items = [item1, item2, item3, item4, item5];
    const mapNavigationModel = new MapNavigationModel(items);
    let itemsId = mapNavigationModel.items.map(item => item.id);
    expect(itemsId).toEqual(["item1", "item2", "item3", "item4", "item5"]);

    mapNavigationModel.moveItem(item1.id, item3.id);
    itemsId = mapNavigationModel.items.map(item => item.id);
    expect(itemsId).toEqual(["item2", "item3", "item1", "item4", "item5"]);
  });
});
