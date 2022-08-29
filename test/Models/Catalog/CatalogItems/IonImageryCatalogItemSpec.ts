import { runInAction } from "mobx";
import IonImageryProvider from "terriajs-cesium/Source/Scene/IonImageryProvider";
import { ImageryParts } from "../../../../lib/ModelMixins/MappableMixin";
import IonImageryCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/IonImageryCatalogItem";
import Terria from "../../../../lib/Models/Terria";

describe("IonImageryCatalogItem", function () {
  let item = new IonImageryCatalogItem("test", new Terria());

  it("has a type", function () {
    expect(IonImageryCatalogItem.type).toBe("ion-imagery");
  });

  describe("the mapItem", function () {
    beforeEach(function () {
      runInAction(() => {
        item.setTrait("definition", "ionAssetId", 12345);
        item.setTrait("definition", "ionAccessToken", "fakeAccessToken");
        item.setTrait("definition", "ionServer", "fakeServer");
      });
    });

    it("correctly sets the `alpha` value", function () {
      if (!ImageryParts.is(item.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      runInAction(() => item.setTrait("definition", "opacity", 0.42));
      expect(item.mapItems[0].alpha).toBe(0.42);
    });

    it("correctly sets `show`", function () {
      if (!ImageryParts.is(item.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");

      runInAction(() => item.setTrait("definition", "show", false));
      expect(item.mapItems[0].show).toBe(false);
      runInAction(() => item.setTrait("definition", "show", true));
      expect(item.mapItems[0].show).toBe(true);
    });
  });

  describe("imageryProvider", function () {
    it("should be a UrlTemplateImageryProvider", function () {
      if (!ImageryParts.is(item.mapItems[0]))
        throw new Error("Expected MapItem to be an ImageryParts");
      let imageryProvider = item.mapItems[0].imageryProvider;
      expect(imageryProvider instanceof IonImageryProvider).toBeTruthy();
    });
  });
});
