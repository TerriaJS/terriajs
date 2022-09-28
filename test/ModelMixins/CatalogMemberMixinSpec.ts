import { IReactionDisposer, reaction, runInAction } from "mobx";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import createStratumInstance from "../../lib/Models/Definition/createStratumInstance";
import updateModelFromJson from "../../lib/Models/Definition/updateModelFromJson";
import {
  SelectableDimensionEnum,
  isEnum
} from "../../lib/Models/SelectableDimensions/SelectableDimensions";
import Terria from "../../lib/Models/Terria";
import EnumDimensionTraits, {
  DimensionOptionTraits
} from "../../lib/Traits/TraitsClasses/DimensionTraits";

describe("CatalogMemberMixin", function () {
  describe(" - infoWithoutSources", function () {
    let terria: Terria;
    let wmsItem: WebMapServiceCatalogItem;

    beforeEach(async function () {
      terria = new Terria({
        baseUrl: "./"
      });
      wmsItem = new WebMapServiceCatalogItem("test", terria);

      runInAction(() => {
        wmsItem.setTrait(
          "definition",
          "url",
          "test/WMS/single_metadata_url.xml"
        );
      });
      await wmsItem.loadMetadata();
    });

    it(" - infoAsObject exists", function () {
      expect(wmsItem.info.length).toBe(6);
      expect(Object.keys(wmsItem.infoAsObject).length).toBe(6);
      expect(wmsItem.infoAsObject.WebMapServiceLayerDescription).toBe(
        "description foo bar baz"
      );
    });

    it(" - info section can contain both content and contentAsObject ", function () {
      wmsItem.info.forEach((i) => {
        // Something a bit funky with i18n strings not yet being transformed
        if (i.name === "models.webMapServiceCatalogItem.dataDescription") {
          expect(i.content).toBeUndefined();
          expect(i.contentAsObject).toBeDefined();
        } else if (i.name === "Web Map Service Layer Description") {
          expect(i.contentAsObject).toBeUndefined();
          expect(i.content).toBeDefined();
        }
      });
    });

    it(" - info and infoWithoutSources can produce different results", function () {
      expect(wmsItem.info.length).toBe(6);
      if (wmsItem._sourceInfoItemNames !== undefined) {
        expect(wmsItem._sourceInfoItemNames.length).toBe(1);
      }
      expect(wmsItem.infoWithoutSources.length).toBe(5);
    });

    it(" - has metadataUrls", function () {
      expect(wmsItem.metadataUrls.length).toBe(1);
      expect(wmsItem.metadataUrls[0].url).toBe("http://examplemetadata.com");
      expect(wmsItem.metadataUrls[0].title).toBeUndefined();
    });

    it(" - can add metadataUrls title", function () {
      runInAction(() => {
        updateModelFromJson(wmsItem, "definition", {
          metadataUrls: [{ title: "Some Title" }]
        });
      });

      expect(wmsItem.metadataUrls.length).toBe(1);
      expect(wmsItem.metadataUrls[0].url).toBe("http://examplemetadata.com");
      expect(wmsItem.metadataUrls[0].title).toBe("Some Title");
    });
  });

  describe(" - AsyncLoaders work as expected", function () {
    let terria: Terria;
    let wmsItem: WebMapServiceCatalogItem;

    beforeEach(async function () {
      terria = new Terria({
        baseUrl: "./"
      });
      wmsItem = new WebMapServiceCatalogItem("test", terria);

      runInAction(() => {
        wmsItem.setTrait(
          "definition",
          "url",
          "test/WMS/single_metadata_url.xml"
        );
      });
    });

    it(" - calls loadMetadata and then loadMapItems", async () => {
      const promise = wmsItem.loadMapItems();

      expect(wmsItem.isLoading).toBeTruthy();
      expect(wmsItem.isLoadingMetadata).toBeTruthy();
      expect(wmsItem.isLoadingMapItems).toBeFalsy();

      let dispose: IReactionDisposer | undefined;

      // Wait for isLoadingMapItems to be true -> then check isLoadingMetadata and isLoading
      await new Promise((resolve) => {
        dispose = reaction(
          () => wmsItem.isLoadingMapItems,
          () => {
            if (wmsItem.isLoadingMapItems) {
              expect(wmsItem.isLoading).toBeTruthy();
              expect(wmsItem.isLoadingMetadata).toBeFalsy();
              resolve();
            }
          }
        );
      });

      dispose?.();

      await promise;

      expect(wmsItem.isLoading).toBeFalsy();
      expect(wmsItem.isLoadingMetadata).toBeFalsy();
      expect(wmsItem.isLoadingMapItems).toBeFalsy();
    });

    it(" - modelDimensions", () => {
      wmsItem.setTrait(CommonStrata.definition, "styles", "init-style");
      wmsItem.setTrait(CommonStrata.definition, "layers", "init-layers");
      wmsItem.setTrait(CommonStrata.user, "modelDimensions", [
        createStratumInstance(EnumDimensionTraits, {
          id: "modelDimensions",
          options: [
            createStratumInstance(DimensionOptionTraits, {
              id: "styles-test",
              value: { styles: "test" }
            }),
            createStratumInstance(DimensionOptionTraits, {
              id: "styles-test2",
              value: { styles: "test2" }
            }),
            createStratumInstance(DimensionOptionTraits, {
              id: "layers-test",
              value: { layers: "{{modelDimensions.0.selectedId}}" }
            })
          ]
        })
      ]);

      expect(wmsItem.styles).toBe("init-style");
      expect(wmsItem.layers).toBe("init-layers");

      const result = wmsItem.selectableDimensions.find(
        (dim) => dim.id === "modelDimensions"
      );

      expect(result).toBeDefined();
      expect(result?.type === undefined);

      const modelDimension = result;

      if (!modelDimension || !isEnum(modelDimension))
        throw "Couldn't find modelDimensions";

      modelDimension?.setDimensionValue(CommonStrata.user, "styles-test");

      expect(wmsItem.styles).toBe("test");
      expect(wmsItem.layers).toBe("init-layers");

      modelDimension.setDimensionValue(CommonStrata.user, "styles-test2");

      expect(wmsItem.styles).toBe("test2");
      expect(wmsItem.layers).toBe("init-layers");

      modelDimension.setDimensionValue(CommonStrata.user, "layers-test");

      expect(wmsItem.styles).toBe("test2");
      expect(wmsItem.layers).toBe("layers-test");
    });
  });
});
