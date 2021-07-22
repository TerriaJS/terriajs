import i18next from "i18next";
import { computed, observable, runInAction } from "mobx";
import getFilenameFromUri from "terriajs-cesium/Source/Core/getFilenameFromUri";
import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import isDefined from "../Core/isDefined";
import loadXML from "../Core/loadXML";
import readXml from "../Core/readXml";
import replaceUnderscores from "../Core/replaceUnderscores";
import TerriaError from "../Core/TerriaError";
import { geoRss2ToGeoJson, geoRssAtomToGeoJson } from "../Map/geoRssConvertor";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GeoJsonMixin from "../ModelMixins/GeojsonMixin";
import { InfoSectionTraits } from "../Traits/TraitsClasses/CatalogMemberTraits";
import GeoRssCatalogItemTraits from "../Traits/TraitsClasses/GeoRssCatalogItemTraits";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumOrder from "./StratumOrder";

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

interface ConvertedJson {
  geoJsonData: any;
  metadata: Feed;
}

class GeoRssStratum extends LoadableStratum(GeoRssCatalogItemTraits) {
  static stratumName = "georss";
  constructor(
    private readonly _item: GeoRssCatalogItem,
    private readonly _feed?: Feed
  ) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new GeoRssStratum(newModel as GeoRssCatalogItem, this._feed) as this;
  }

  @computed get name(): string | undefined {
    if (this._feed && this._feed.title && this._feed.title.length > 0) {
      return replaceUnderscores(this._feed.title);
    }
    return super.name;
  }

  @computed get dataCustodian(): string | undefined {
    if (
      this._feed &&
      this._feed.author &&
      this._feed.author.name &&
      this._feed.author.name.length > 0
    ) {
      return this._feed.author.name;
    }
  }

  @computed get info() {
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

export default class GeoRssCatalogItem extends GeoJsonMixin(
  CatalogMemberMixin(CreateModel(GeoRssCatalogItemTraits))
) {
  static readonly type = "georss";
  get type() {
    return GeoRssCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.georss.name");
  }

  protected async loadData(): Promise<any> {
    try {
      const xmlData: any = await super.loadData();
      if (!isDefined(xmlData)) {
        throw new RuntimeError("document is not valid");
      }
      const json = this.parseGeorss(xmlData);
      runInAction(() => {
        this.strata.set(
          GeoRssStratum.stratumName,
          new GeoRssStratum(this, json?.metadata)
        );
      });
      return json?.geoJsonData;
    } catch (e) {
      throw TerriaError.from(e, {
        title: i18next.t("models.georss.errorLoadingTitle"),
        message: i18next.t("models.georss.errorLoadingMessage")
      });
    }
  }

  private parseGeorss(xmlData: any): ConvertedJson | never {
    const documentElement = xmlData.documentElement;

    if (documentElement.localName.includes(GeoRssFormat.ATOM)) {
      const jsonData: ConvertedJson = {
        geoJsonData: geoRssAtomToGeoJson(xmlData),
        metadata: parseMetadata(documentElement.childNodes, this)
      };
      return jsonData;
    } else if (documentElement.localName === GeoRssFormat.RSS) {
      const element = documentElement.getElementsByTagName("channel")[0];
      const jsonData: ConvertedJson = {
        geoJsonData: geoRss2ToGeoJson(xmlData),
        metadata: parseMetadata(element.childNodes, this)
      };
      return jsonData;
    } else {
      throw new RuntimeError("document is not valid");
    }
  }

  protected async loadFromFile(file: File): Promise<Document> {
    return readXml(file);
  }

  protected async loadFromUrl(url: string): Promise<Document> {
    return loadXML(proxyCatalogItemUrl(this, url));
  }

  protected async customDataLoader(
    resolve: (value: any) => void,
    _reject: (reason: any) => void
  ): Promise<any> {
    if (isDefined(this.geoRssString)) {
      const parser = new DOMParser();
      resolve(parser.parseFromString(this.geoRssString, "text/xml"));
    }
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
