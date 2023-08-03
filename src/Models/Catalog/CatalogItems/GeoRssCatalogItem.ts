import { RuntimeError, getFilenameFromUri } from "cesium";
import i18next from "i18next";
import { computed, makeObservable, runInAction } from "mobx";
import { JsonObject } from "../../../Core/Json";
import { networkRequestError } from "../../../Core/TerriaError";
import isDefined from "../../../Core/isDefined";
import loadXML from "../../../Core/loadXML";
import readXml from "../../../Core/readXml";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import {
  geoRss2ToGeoJson,
  geoRssAtomToGeoJson
} from "../../../Map/Vector/geoRssConvertor";
import GeoJsonMixin from "../../../ModelMixins/GeojsonMixin";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import GeoRssCatalogItemTraits from "../../../Traits/TraitsClasses/GeoRssCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import createStratumInstance from "../../Definition/createStratumInstance";
import HasLocalData from "../../HasLocalData";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

enum GeoRssFormat {
  RSS = "rss",
  ATOM = "feed"
}

interface Author {
  name?: string;
  email?: string;
  link?: string;
}

interface Feed {
  id?: string;
  title?: string;
  updated?: string;
  author?: Author;
  category?: string[];
  description?: string;
  contributor?: Author | Author[];
  generator?: string;
  link?: string[];
  copyright?: string;
  subtitle?: string;
}

class GeoRssStratum extends LoadableStratum(GeoRssCatalogItemTraits) {
  static stratumName = "georss";
  constructor(
    private readonly _item: GeoRssCatalogItem,
    private readonly _feed?: Feed
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new GeoRssStratum(newModel as GeoRssCatalogItem, this._feed) as this;
  }

  @computed override get name(): string | undefined {
    if (this._feed && this._feed.title && this._feed.title.length > 0) {
      return replaceUnderscores(this._feed.title);
    }
    return super.name;
  }

  @computed override get dataCustodian(): string | undefined {
    if (
      this._feed &&
      this._feed.author &&
      this._feed.author.name &&
      this._feed.author.name.length > 0
    ) {
      return this._feed.author.name;
    }
  }

  @computed override get info() {
    if (!this._feed) {
      return [];
    }
    return [
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.subtitle"),
        content: this._feed.subtitle
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.updated"),
        content: this._feed.updated?.toString()
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.category"),
        content: this._feed.category?.join(", ")
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.description"),
        content: this._feed.description
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.copyrightText"),
        content: this._feed.copyright
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.author"),
        content: this._feed.author?.name
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.georss.link"),
        content:
          typeof this._feed.link === "string"
            ? this._feed.link
            : this._feed.link?.join(", ")
      })
    ];
  }
}

StratumOrder.addLoadStratum(GeoRssStratum.stratumName);

export default class GeoRssCatalogItem
  extends GeoJsonMixin(CreateModel(GeoRssCatalogItemTraits))
  implements HasLocalData
{
  static readonly type = "georss";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return GeoRssCatalogItem.type;
  }

  override get typeName() {
    return i18next.t("models.georss.name");
  }

  _private_georssFile?: File;

  setFileInput(file: File) {
    this._private_georssFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._private_georssFile);
  }

  _private_parseGeorss(xmlData: Document): JsonObject | never {
    const documentElement = xmlData.documentElement;
    let json: JsonObject;
    let metadata: Feed;
    if (documentElement.localName.includes(GeoRssFormat.ATOM)) {
      metadata = parseMetadata(documentElement.childNodes, this);
      json = <any>geoRssAtomToGeoJson(xmlData);
    } else if (documentElement.localName === GeoRssFormat.RSS) {
      const element = documentElement.getElementsByTagName("channel")[0];
      metadata = parseMetadata(element.childNodes, this);
      json = <any>geoRss2ToGeoJson(xmlData);
    } else {
      throw new RuntimeError("document is not valid");
    }
    runInAction(() => {
      this.strata.set(
        GeoRssStratum.stratumName,
        new GeoRssStratum(this, metadata)
      );
    });
    return json;
  }

  async _protected_forceLoadGeojsonData(): Promise<any> {
    let data: Document | undefined;
    if (isDefined(this.geoRssString)) {
      const parser = new DOMParser();
      data = parser.parseFromString(this.geoRssString, "text/xml");
    } else if (isDefined(this._private_georssFile)) {
      data = await readXml(this._private_georssFile);
    } else if (isDefined(this.url)) {
      data = await loadXML(proxyCatalogItemUrl(this, this.url));
    }

    if (!data) {
      throw networkRequestError({
        sender: this,
        title: i18next.t("models.georss.errorLoadingTitle"),
        message: i18next.t("models.georss.errorLoadingMessage", {
          appName: this.terria.appName
        })
      });
    }

    return this._private_parseGeorss(data);
  }

  override _protected_forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }
}

function parseMetadata(
  xmlElements: NodeListOf<ChildNode>,
  item: GeoRssCatalogItem
) {
  const result: Feed = {};
  result.link = [];
  result.category = [];
  for (let i = 0; i < xmlElements.length; ++i) {
    const child = <Element>xmlElements[i];
    if (
      child.nodeType !== 1 ||
      child.localName === "item" ||
      child.localName === "entry"
    ) {
      continue;
    }
    if (child.localName === "id") {
      result.id = child.textContent || undefined;
    } else if (child.localName === "title") {
      result.title = child.textContent || undefined;
    } else if (child.localName === "subtitle") {
      result.subtitle = child.textContent || undefined;
    } else if (child.localName === "description") {
      result.description = child.textContent || undefined;
    } else if (child.localName === "category") {
      if (child.textContent) {
        result.category.push(child.textContent);
      }
    } else if (child.localName === "link") {
      if (child.textContent) {
        result.link.push(child.textContent);
      } else {
        const href = child.getAttribute("href");
        if (href) {
          result.link.push(href);
        }
      }
    } else if (child.localName === "updated") {
      result.updated = child.textContent || undefined;
    } else if (
      child.localName === "rights" ||
      child.localName === "copyright"
    ) {
      result.copyright = child.textContent || undefined;
    } else if (child.localName === "author") {
      const authorNode = child.childNodes;
      if (authorNode.length === 0) {
        result.author = {
          name: child.textContent || undefined
        };
      } else {
        let name, email, link;
        for (
          let authorIndex = 0;
          authorIndex < authorNode.length;
          ++authorIndex
        ) {
          const authorChild = <Element>authorNode[authorIndex];
          if (authorChild.nodeType === 1) {
            if (authorChild.localName === "name") {
              name = authorChild.textContent || undefined;
            } else if (authorChild.localName === "email") {
              email = authorChild.textContent || undefined;
            }
            if (authorChild.localName === "link") {
              link = authorChild.textContent || undefined;
            }
          }
        }
        result.author = {
          name: name,
          email: email,
          link: link
        };
      }
    }
  }
  if (item.url && (!isDefined(result.title) || result.title === item.url)) {
    result.title = getFilenameFromUri(item.url);
  }
  return result;
}
