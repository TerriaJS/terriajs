import i18next from "i18next";
import { computed, makeObservable, override } from "mobx";
import { getFilenameFromUri } from "cesium";
import isDefined from "../../../Core/isDefined";
import loadText from "../../../Core/loadText";
import readText from "../../../Core/readText";
import { networkRequestError } from "../../../Core/TerriaError";
import GeoJsonMixin, {
  FeatureCollectionWithCrs
} from "../../../ModelMixins/GeojsonMixin";
import GpxCatalogItemTraits from "../../../Traits/TraitsClasses/GpxCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import { ModelConstructorParameters } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

const toGeoJSON = require("@mapbox/togeojson");

class GpxCatalogItem extends GeoJsonMixin(CreateModel(GpxCatalogItemTraits)) {
  static readonly type = "gpx";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return GpxCatalogItem.type;
  }

  override get typeName() {
    return i18next.t("models.gpx.name");
  }

  _private_gpxFile?: File;

  setFileInput(file: File) {
    this._private_gpxFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._private_gpxFile);
  }

  _private_loadGpxText(text: string) {
    var dom = new DOMParser().parseFromString(text, "text/xml");
    return toGeoJSON.gpx(dom);
  }

  async _protected_forceLoadGeojsonData(): Promise<FeatureCollectionWithCrs> {
    let data: string | undefined;
    if (isDefined(this.gpxString)) {
      data = this.gpxString;
    } else if (isDefined(this._private_gpxFile)) {
      data = await readText(this._private_gpxFile);
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

    return this._private_loadGpxText(data);
  }

  override _protected_forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  @override
  override get name() {
    if (this.url && super.name === this.url) {
      return getFilenameFromUri(this.url);
    }
    return super.name;
  }
}

export default GpxCatalogItem;
