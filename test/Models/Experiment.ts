import { autorun, configure, runInAction } from "mobx";
import CatalogMemberMixin from "../../lib/ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../lib/ModelMixins/MappableMixin";
import CommonStrata from "../../lib/Models/Definition/CommonStrata";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogGroup from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogGroup";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";

configure({
  enforceActions: true,
  computedRequiresReaction: true
});

describe("NewStuff", function () {
  it("test", function () {
    const terria = new Terria();
    const wms = new WebMapServiceCatalogGroup(
      "Taxation Statistics 2011-2012",
      terria
    );

    const wmsItem = new WebMapServiceCatalogItem(
      "Taxation Statistics 2011-2012/ckan_95d9e550_8b36_4273_8df7_2b76c140e73a",
      terria
    );
    wmsItem.setTrait(CommonStrata.definition, "name", "Foo");
    terria.addModel(wmsItem);

    const wmsItem2 = new WebMapServiceCatalogItem("another", terria);
    wmsItem2.setTrait(CommonStrata.definition, "name", "Another");
    wmsItem2.setTrait(
      CommonStrata.definition,
      "url",
      "https://data.gov.au/geoserver/taxation-statistics-2011-12/wms"
    );
    terria.addModel(wmsItem2);

    runInAction(() => {
      wms.setTrait(CommonStrata.definition, "members", [wmsItem2.uniqueId!]);
      wms.setTrait(
        CommonStrata.definition,
        "name",
        "Taxation Statistics 2011-2012"
      );
      wms.setTrait(
        CommonStrata.definition,
        "url",
        "https://data.gov.au/geoserver/taxation-statistics-2011-12/wms"
      );
    });

    autorun((dispose) => {
      console.log("Run: " + wms.memberModels.length);
      wms.memberModels.forEach((model) => {
        if (CatalogMemberMixin.isMixedInto(model)) {
          console.log(`${model.name}: ${model.uniqueId}`);
        }
        if (MappableMixin.isMixedInto(model)) {
          console.log(model.mapItems);
        }
      });
    });

    expect().nothing();
  });
});
