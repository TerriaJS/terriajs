import * as MapToolbar from "../../../lib/ViewModels/MapNavigation/MapToolbar";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import Icon from "../../../lib/Styled/Icon";

describe("MapToolbar", function () {
  let viewState: ViewState;
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: undefined,
      locationSearchProviders: []
    });
  });

  describe("simple click button", function () {
    it("can be added to the toolbar", function () {
      expect(terria.mapNavigationModel.items.length).toBe(0);
      MapToolbar.addButton(viewState, {
        text: "Simple button",
        icon: Icon.GLYPHS.eye,
        onClick: () => {}
      });
      expect(terria.mapNavigationModel.items.length).toBe(1);
      expect(terria.mapNavigationModel.items[0].name).toBe("Simple button");
    });

    it("calls `onClick` when clicked", function () {
      const onClickSpy = jasmine.createSpy("onClick");
      MapToolbar.addButton(viewState, {
        text: "Simple button",
        icon: Icon.GLYPHS.eye,
        onClick: onClickSpy
      });
      const navItem = terria.mapNavigationModel.items[0];
      expect(navItem).toBeDefined();
      navItem.controller.handleClick();
      expect(onClickSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("mode button", function () {
    it("can be added to the toolbar", function () {
      expect(terria.mapNavigationModel.items.length).toBe(0);
      MapToolbar.addModeButton(viewState, {
        text: "Mode button",
        icon: Icon.GLYPHS.pedestrian,
        onUserEnterMode: () => {},
        onUserCloseMode: () => {}
      });
      expect(terria.mapNavigationModel.items.length).toBe(1);
      expect(terria.mapNavigationModel.items[0].name).toBe("Mode button");
    });

    describe("onUserEnterMode", function () {
      it("is called once when user activates the mode button", function () {
        const onUserEnterModeSpy = jasmine.createSpy("onUserEnterMode");
        MapToolbar.addModeButton(viewState, {
          text: "Mode button",
          icon: Icon.GLYPHS.pedestrian,
          onUserEnterMode: onUserEnterModeSpy,
          onUserCloseMode: () => {}
        });
        const navItem = terria.mapNavigationModel.items[0];
        expect(navItem).toBeDefined();

        expect(onUserEnterModeSpy).toHaveBeenCalledTimes(0);
        navItem.controller.activate();
        expect(onUserEnterModeSpy).toHaveBeenCalledTimes(1);
      });

      it("raises any callback errors to the user", function () {
        MapToolbar.addModeButton(viewState, {
          text: "Mode button",
          icon: Icon.GLYPHS.pedestrian,
          onUserEnterMode: () => {
            throw "onUserEnterMode error";
          },
          onUserCloseMode: () => {}
        });

        const raiseErrorToUserSpy = spyOn(terria, "raiseErrorToUser");
        const navItem = terria.mapNavigationModel.items[0];
        expect(navItem).toBeDefined();
        expect(raiseErrorToUserSpy).toHaveBeenCalledTimes(0);
        navItem.controller.activate();
        expect(raiseErrorToUserSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe("onUserCloseMode", function () {
      it("is called once when user deactivates the mode button", function () {
        const onUserCloseModeSpy = jasmine.createSpy("onUserCloseMode");
        MapToolbar.addModeButton(viewState, {
          text: "Mode button",
          icon: Icon.GLYPHS.pedestrian,
          onUserEnterMode: () => {},
          onUserCloseMode: onUserCloseModeSpy
        });
        const navItem = terria.mapNavigationModel.items[0];
        expect(navItem).toBeDefined();

        expect(onUserCloseModeSpy).toHaveBeenCalledTimes(0);
        navItem.controller.deactivate();
        expect(onUserCloseModeSpy).toHaveBeenCalledTimes(1);
      });

      it("raises any callback errors to the user", function () {
        MapToolbar.addModeButton(viewState, {
          text: "Mode button",
          icon: Icon.GLYPHS.pedestrian,
          onUserEnterMode: () => {},
          onUserCloseMode: () => {
            throw "onUserCloseMode error";
          }
        });

        const raiseErrorToUserSpy = spyOn(terria, "raiseErrorToUser");
        const navItem = terria.mapNavigationModel.items[0];
        expect(navItem).toBeDefined();
        expect(raiseErrorToUserSpy).toHaveBeenCalledTimes(0);
        navItem.controller.deactivate();
        expect(raiseErrorToUserSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("tool button", function () {
    it("can be added to the toolbar", function () {
      expect(terria.mapNavigationModel.items.length).toBe(0);
      MapToolbar.addToolButton(viewState, () => ({
        text: "Light bulb",
        icon: Icon.GLYPHS.bulb,
        tool: {
          name: "Light bulb",
          component: () => () => null
        }
      }));
      expect(terria.mapNavigationModel.items.length).toBe(1);
      expect(terria.mapNavigationModel.items[0].name).toBe("Light bulb");
    });

    it("can be removed from the toolbar", function () {
      expect(terria.mapNavigationModel.items.length).toBe(0);
      const toolButton = MapToolbar.addToolButton(viewState, () => ({
        text: "Light bulb",
        icon: Icon.GLYPHS.bulb,
        tool: {
          name: "Light bulb",
          component: () => () => null
        }
      }));
      expect(terria.mapNavigationModel.items.length).toBe(1);
      toolButton.removeButton();
      expect(terria.mapNavigationModel.items.length).toBe(0);
    });

    it("is activated when opening the tool", function () {
      const toolButton = MapToolbar.addToolButton(viewState, () => ({
        text: "Light bulb",
        icon: Icon.GLYPHS.bulb,
        tool: {
          name: "Light bulb",
          component: () => () => null
        }
      }));
      const navItem = terria.mapNavigationModel.items[0];
      expect(navItem.controller.active).toBe(false);
      toolButton.openTool();
      expect(navItem.controller.active).toBe(true);
    });

    it("is deactivated when the tool is closed through other means", function () {
      const toolButton = MapToolbar.addToolButton(viewState, () => ({
        text: "Light bulb",
        icon: Icon.GLYPHS.bulb,
        tool: {
          name: "Light bulb",
          component: () => () => null
        }
      }));
      const navItem = terria.mapNavigationModel.items[0];
      toolButton.openTool();
      expect(navItem.controller.active).toBe(true);
      // The tool can be closed by other means, not nessecarily by calling toolButton.closeTool()
      // It should deactivate correctly even in that case.
      viewState.closeTool();
      expect(navItem.controller.active).toBe(false);
    });
  });
});
