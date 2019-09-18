import { computed, toJS } from "mobx";
import CzmlDataSource from "terriajs-cesium/Source/DataSources/CzmlDataSource";
import isDefined from "../Core/isDefined";
import { JsonObject } from "../Core/Json";
import readJson from "../Core/readJson";
import TerriaError from "../Core/TerriaError";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import CzmlCatalogItemTraits from "../Traits/CzmlCatalogItemTraits";
import CreateModel from "./CreateModel";
import Mappable from "./Mappable";

export default class CzmlCatalogItem
  extends AsyncMappableMixin(
    UrlMixin(CatalogMemberMixin(CreateModel(CzmlCatalogItemTraits)))
  )
  implements Mappable {
  static readonly type = "czml";
  get type() {
    return CzmlCatalogItem.type;
  }

  readonly canZoomTo = true;

  private _dataSource: CzmlDataSource | undefined;
  private _czmlFile?: File;

  setFileInput(file: File) {
    this._czmlFile = file;
  }

  protected forceLoadMapItems(): Promise<void> {
    return new Promise<string | readonly JsonObject[]>(resolve => {
      if (isDefined(this.czmlData)) {
        resolve(toJS(this.czmlData));
      } else if (isDefined(this.czmlString)) {
        resolve(JSON.parse(this.czmlString));
      } else if (isDefined(this._czmlFile)) {
        resolve(readJson(this._czmlFile));
      } else if (isDefined(this.url)) {
        resolve(this.url);
      } else {
        throw new TerriaError({
          sender: this,
          title: "No CZML available",
          message:
            `The CZML catalog item cannot be loaded because it was not configured ` +
            `with a \`url\`, \`czmlData\`, or \`czmlString\` property.`
        });
      }
    })
      .then(czmlLoadInput => {
        return CzmlDataSource.load(czmlLoadInput);
      })
      .then(czml => {
        this._dataSource = czml;
      })
      .catch(e => {
        if (e instanceof TerriaError) {
          throw e;
        } else {
          throw new TerriaError({
            sender: this,
            title: "Could not load CZML",
            message:
              `An error occurred while retrieving or parsing JSON data from the provided link.` +
              `<p>If you entered the link manually, please verify that the link is correct.</p>` +
              `<p>This error may also indicate that the server does not support ` +
              `<a href="http://enable-cors.org/" target="_blank">CORS</a>. If this is your server, ` +
              `verify that CORS is enabled and enable it if it is not.  If you do not control the ` +
              `server, please contact the administrator of the server and ask them to enable CORS. Or, ` +
              `contact the ${this.terria.appName} team by emailing ` +
              `<a href="mailto:${this.terria.supportEmail}">${
                this.terria.supportEmail
              }</a> ` +
              `and ask us to add this server to the list of non-CORS-supporting servers that may be ` +
              `proxied by ${
                this.terria.appName
              } itself.</p><p>If you did not enter this link manually, ` +
              `this error may indicate that the data source you're trying to add is temporarily unavailable ` +
              `or there is a problem with your internet connection.  Try adding the data source again, and if ` +
              `the problem persists, please report it by sending an email to ` +
              `<a href="mailto:${this.terria.supportEmail}">${
                this.terria.supportEmail
              }</a>. See the technical details below.</p>` +
              `<pre>${e.stack || e.toString()}</pre>`
          });
        }
      });
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  get mapItems() {
    if (this.isLoadingMapItems || this._dataSource === undefined) {
      return [];
    }
    this._dataSource.show = this.show;
    return [this._dataSource];
  }
}
