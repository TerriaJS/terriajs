import i18next from "i18next";
import isDefined from "../Core/isDefined";
import loadText from "../Core/loadText";
import readText from "../Core/readText";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GpxCatalogItemTraits from "../Traits/TraitsClasses/GpxCatalogItemTraits";
import GeoJsonMixin from "./../ModelMixins/GeojsonMixin";
import CreateModel from "./CreateModel";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
const toGeoJSON = require("@mapbox/togeojson");

class GpxCatalogItem extends GeoJsonMixin(
  CatalogMemberMixin(CreateModel(GpxCatalogItemTraits))
) {
  static readonly type = "gpx";

  get type() {
    return GpxCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.gpx.name");
  }

  private loadGpxText(text: string) {
    var dom = new DOMParser().parseFromString(text, "text/xml");
    return toGeoJSON.gpx(dom);
  }

  protected loadGeoJson() {
    return super.loadGeoJson().then(data => {
      if (isDefined(data)) {
        return this.loadGpxText(data as any);
      }
      return undefined;
    });
  }

  protected loadFromFile(file: File): Promise<any> {
    return readText(file);
  }

  protected loadFromUrl(url: string): Promise<any> {
    throw loadText(proxyCatalogItemUrl(this, url));
  }

  protected async customDataLoader(
    resolve: (value: any) => void,
    _reject: (reason: any) => void
  ): Promise<any> {
    if (isDefined(this.gpxString)) {
      resolve(this.gpxString);
    }
  }
}

export default GpxCatalogItem;
