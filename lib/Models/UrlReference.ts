import ReferenceMixin from "../ModelMixins/ReferenceMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import CatalogMemberFactory from "./CatalogMemberFactory";
import CreateModel from "./CreateModel";
import { BaseModel } from "./Model";
import StratumFromTraits from "./StratumFromTraits";
import Terria from "./Terria";
import ModelTraits from "../Traits/ModelTraits";
import UrlReferenceTraits from "../Traits/UrlReferenceTraits";
import StratumOrder from "./StratumOrder";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import { mapping } from "./createCatalogItemFromUrl";
import updateModelFromJson from "./updateModelFromJson";
import isDefined from "terriajs/lib/Core/isDefined";

const urlRecordStratum = "url-record";
StratumOrder.addDefaultStratum(urlRecordStratum);

export default class UrlReference extends UrlMixin(
  ReferenceMixin(CreateModel(UrlReferenceTraits))
) {
  static readonly type = "url-reference";

  get type() {
    return UrlReference.type;
  }

  constructor(
    id: string | undefined,
    terria: Terria,
    sourceReference?: BaseModel,
    strata?: Map<string, StratumFromTraits<ModelTraits>>
  ) {
    super(id, terria, sourceReference, strata);
  }

  protected forceLoadReference(
    previousTarget: BaseModel | undefined
  ): Promise<BaseModel | undefined> {
    if (this.url === undefined || this.uniqueId === undefined) {
      return Promise.resolve(undefined);
    }

    // hack to make datastore api urls work across environments
    this.rewritePlaceholderUrl();

    const target = UrlReference.createCatalogItemFromUrlReference(
      this,
      this.uniqueId,
      this.url,
      this.terria,
      this.allowLoad || false
    );

    return Promise.resolve(target);
  }

  private static createCatalogItemFromUrlReference(
    sourceReference: BaseModel,
    id: string,
    url: string,
    terria: Terria,
    allowLoad: boolean,
    _index?: number
  ): Promise<BaseModel | undefined> {
    const index = _index || 0;
    if (index >= mapping.length) {
      return Promise.resolve(undefined);
    }

    if (
      (mapping[index].matcher && !mapping[index].matcher(url)) ||
      (mapping[index].requiresLoad && !allowLoad)
    ) {
      return UrlReference.createCatalogItemFromUrlReference(
        sourceReference,
        id,
        url,
        terria,
        allowLoad,
        index + 1
      );
    } else {
      const item = CatalogMemberFactory.create(
        mapping[index].type,
        sourceReference.uniqueId,
        terria,
        sourceReference
      );

      if (item === undefined) {
        return UrlReference.createCatalogItemFromUrlReference(
          sourceReference,
          id,
          url,
          terria,
          allowLoad,
          index + 1
        );
      }

      updateModelFromJson(item, urlRecordStratum, {
        name: url,
        url: url
      });

      if (allowLoad && CatalogMemberMixin.isMixedInto(item)) {
        return item
          .loadMetadata()
          .then(() => item)
          .catch(e => {
            return UrlReference.createCatalogItemFromUrlReference(
              sourceReference,
              id,
              url,
              terria,
              allowLoad,
              index + 1
            );
          });
      } else {
        return Promise.resolve(item);
      }
    }
  }

  rewritePlaceholderUrl() {
    // This is a terrible hack and I'm so sorry
    // We represent the base url with a placeholder so that it can be configured per environment
    const baseUrl: string = this.terria.configParameters.baseUrl as string;
    if(isDefined( this.url) &&  isDefined(baseUrl) && this.url.includes("{{BASE_URL}}")) {
      this.url.replace("{{BASE_URL}}", baseUrl);
    }
  }
}
