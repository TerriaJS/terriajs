import i18next from "i18next";
import isDefined from "../../../Core/isDefined";
import loadText from "../../../Core/loadText";
import readText from "../../../Core/readText";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GeoJsonMixin from "../../../ModelMixins/GeojsonMixin";
import GpxCatalogItemTraits from "../../../Traits/TraitsClasses/GpxCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

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

  private parseGpxText(text: string) {
    var dom = new DOMParser().parseFromString(text, "text/xml");
    return toGeoJSON.gpx(dom);
  }

  protected async loadFromFile(file: File): Promise<string | undefined> {
    try {
      return this.parseGpxText(await readText(file));
    } catch (e) {
      throw TerriaError.from(e, {
        title: i18next.t("models.gpx.errorLoadingTitle"),
        message: i18next.t("models.gpx.errorLoadingMessage")
      });
    }
  }

  protected async loadFromUrl(url: string): Promise<string | undefined> {
    try {
      return this.parseGpxText(await loadText(proxyCatalogItemUrl(this, url)));
    } catch (e) {
      throw TerriaError.from(e, {
        title: i18next.t("models.gpx.errorLoadingTitle"),
        message: i18next.t("models.gpx.errorLoadingMessage")
      });
    }
  }

  protected async dataLoader(): Promise<string | undefined> {
    if (isDefined(this.gpxString)) {
      return this.parseGpxText(this.gpxString);
    } else {
      super.dataLoader();
    }
  }
}

export default GpxCatalogItem;
