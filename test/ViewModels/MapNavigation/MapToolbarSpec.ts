import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Icon from "../../../lib/Styled/Icon";
import * as MapToolbar from "../../../lib/ViewModels/MapNavigation/MapToolbar";

describe("MapToolbar", function () {
  let viewState: ViewState;
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined
    });
  });

  describe("addTool", function () {
    it("adds the new tool button to toolbar", function () {
      expect(terria.mapNavigationModel.items.length).toBe(0);
      const toolId = MapToolbar.addTool(viewState, {
        id: "x-tool-id",
        name: "X Tool",
        toolComponentLoader: () => Promise.resolve({ default: () => null }),
        toolButton: {
          text: "Open X tool",
          icon: Icon.GLYPHS.bulb
        }
      });
      expect(toolId).toBe("x-tool-id"); // returns the tool id
      expect(terria.mapNavigationModel.items.length).toBe(1);
      expect(terria.mapNavigationModel.items[0].name).toBe("Open X tool");
    });

    it("generates a random id when called without an `id`", function () {
      const toolId = MapToolbar.addTool(viewState, {
        name: "X Tool",
        toolComponentLoader: () => Promise.resolve({ default: () => null }),
        toolButton: {
          text: "Open X tool",
          icon: Icon.GLYPHS.bulb
        }
      });
      expect(toolId).toBeDefined();
    });
  });

  describe("openTool", function () {
    let toolId = "x-tool-id";
    beforeEach(function () {
      MapToolbar.addTool(viewState, {
        id: toolId,
        name: "X Tool",
        toolComponentLoader: () => Promise.resolve({ default: () => null }),
        toolButton: {
          text: "Open X tool",
          icon: Icon.GLYPHS.bulb
        }
      });
    });

    it("activates the tool", function () {
      const isOpen = MapToolbar.openTool(viewState, toolId);
      expect(isOpen).toBe(true);
      const navItem = terria.mapNavigationModel.items[0];
      expect(navItem.controller.active).toBe(true);
    });

    it("returns false if there is no tool with given id", function () {
      const isOpen = MapToolbar.openTool(viewState, "no-such-tool");
      expect(isOpen).toBe(false);
    });
  });

  describe("closeTool", function () {
    it("closes the tool", function () {
      const toolId = MapToolbar.addTool(viewState, {
        name: "X Tool",
        toolComponentLoader: () => Promise.resolve({ default: () => null }),
        toolButton: {
          text: "Open X tool",
          icon: Icon.GLYPHS.bulb
        }
      });

      const isOpen = MapToolbar.openTool(viewState, toolId);
      expect(isOpen).toBe(true);
      MapToolbar.closeTool(viewState, toolId);
      const navItem = terria.mapNavigationModel.items[0];
      expect(navItem.controller.active).toBe(false);
    });
  });

  describe("isToolOpen", function () {
    let toolId = "x-tool-id";
    beforeEach(function () {
      MapToolbar.addTool(viewState, {
        id: toolId,
        name: "X Tool",
        toolComponentLoader: () => Promise.resolve({ default: () => null }),
        toolButton: {
          text: "Open X tool",
          icon: Icon.GLYPHS.bulb
        }
      });
    });

    it("returns true if the tool is open", function () {
      MapToolbar.openTool(viewState, toolId);
      expect(MapToolbar.isToolOpen(viewState, toolId)).toBe(true);
    });

    it("otherwise, returns false", function () {
      expect(MapToolbar.isToolOpen(viewState, toolId)).toBe(false);
    });
  });

  describe("removeTool", function () {
    it("removes the tool from the toolbar", function () {
      const toolId = MapToolbar.addTool(viewState, {
        name: "X Tool",
        toolComponentLoader: () => Promise.resolve({ default: () => null }),
        toolButton: {
          text: "Open X tool",
          icon: Icon.GLYPHS.bulb
        }
      });

      let navItem = terria.mapNavigationModel.items[0];
      expect(navItem.name).toBe("Open X tool");
      MapToolbar.removeTool(viewState, toolId);
      navItem = terria.mapNavigationModel.items[0];
      expect(navItem).toBeUndefined();
    });
  });

  it("is correctly deactivated even when the tool is closed through other means", function () {
    const toolId = MapToolbar.addTool(viewState, {
      name: "X Tool",
      toolComponentLoader: () => Promise.resolve({ default: () => null }),
      toolButton: {
        text: "Open X tool",
        icon: Icon.GLYPHS.bulb
      }
    });
    const navItem = terria.mapNavigationModel.items[0];
    MapToolbar.openTool(viewState, toolId);
    expect(navItem.controller.active).toBe(true);
    // The tool can be closed by other means, not nessecarily by calling toolButton.closeTool()
    // It should still deactivate correctly.
    viewState.closeTool();
    expect(navItem.controller.active).toBe(false);
  });
});
