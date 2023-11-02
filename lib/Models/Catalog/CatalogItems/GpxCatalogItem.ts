import i18next from "i18next";
import { computed } from "mobx";
import getFilenameFromUri from "terriajs-cesium/Source/Core/getFilenameFromUri";
import isDefined from "../../../Core/isDefined";
import loadText from "../../../Core/loadText";
import readText from "../../../Core/readText";
import { networkRequestError } from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GeoJsonMixin, {
  FeatureCollectionWithCrs
} from "../../../ModelMixins/GeojsonMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import GpxCatalogItemTraits from "../../../Traits/TraitsClasses/GpxCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

const toGeoJSON = require("@mapbox/togeojson");

class GpxCatalogItem extends GeoJsonMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(GpxCatalogItemTraits)))
) {
  static readonly type = "gpx";

  get type() {
    return GpxCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.gpx.name");
  }

  private _gpxFile?: File;

  setFileInput(file: File) {
    this._gpxFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._gpxFile);
  }

  private loadGpxText(text: string) {
    var dom = new DOMParser().parseFromString(text, "text/xml");
    return toGeoJSON.gpx(dom);
  }

  protected async forceLoadGeojsonData(): Promise<FeatureCollectionWithCrs> {
    let data: string | undefined;
    if (isDefined(this.gpxString)) {
      data = this.gpxString;
    } else if (isDefined(this._gpxFile)) {
      data = await readText(this._gpxFile);
    } else if (isDefined(this.url)) {
      data = await loadText(proxyCatalogItemUrl(this, this.url));
    }

    if (!data) {
      throw networkRequestError({
        sender: this,
        title: i18next.t("models.gpx.errorLoadingTitle"),
        message: i18next.t("models.gpx.errorLoadingMessage", {
          appName: this.terria.appName
        })
      });
    }

    return this.loadGpxText(data);
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  @computed get name() {
    if (this.url && super.name === this.url) {
      return getFilenameFromUri(this.url);
    }
    return super.name;
  }
}

export default GpxCatalogItem;
