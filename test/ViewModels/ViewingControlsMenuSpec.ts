import CatalogMemberMixin from "../../lib/ModelMixins/CatalogMemberMixin";
import Terria from "../../lib/Models/Terria";
import ViewState from "../../lib/ReactViewModels/ViewState";
import Icon from "../../lib/Styled/Icon";
import * as ViewingControlsMenu from "../../lib/ViewModels/ViewingControlsMenu";
import SimpleCatalogItem from "../Helpers/SimpleCatalogItem";

describe("ViewingControlsMenu", function () {
  describe("addMenuItem", function () {
    it("adds the menu item generator function to `viewState.globalViewingControlOptions` array", function () {
      const terria = new Terria();
      const viewState = new ViewState({
        terria,
        catalogSearchProvider: undefined
      });
      expect(viewState.globalViewingControlOptions.length).toEqual(0);
      const generateFunction = (item: CatalogMemberMixin.Instance) => ({
        name: "View more details",
        icon: Icon.GLYPHS.eye,
        onClick: () => {}
      });
      const simpleItem = new SimpleCatalogItem("simple", terria);
      ViewingControlsMenu.addMenuItem(viewState, generateFunction);
      expect(viewState.globalViewingControlOptions.length).toEqual(1);
      // Check the viewing control name is the same as the one we created
      expect(
        viewState.globalViewingControlOptions[0](simpleItem)?.name
      ).toEqual("View more details");
    });
  });
});
