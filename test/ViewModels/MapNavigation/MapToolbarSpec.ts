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
});
