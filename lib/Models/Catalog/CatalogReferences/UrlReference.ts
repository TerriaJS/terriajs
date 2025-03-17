import ReferenceMixin from "../../../ModelMixins/ReferenceMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import CatalogMemberFactory from "../CatalogMemberFactory";
import CreateModel from "../../Definition/CreateModel";
import { BaseModel } from "../../Definition/Model";
import Terria from "../../Terria";
import UrlReferenceTraits from "../../../Traits/TraitsClasses/UrlReferenceTraits";
import StratumOrder from "../../Definition/StratumOrder";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import updateModelFromJson from "../../Definition/updateModelFromJson";

const urlRecordStratum = "url-record";
StratumOrder.addDefaultStratum(urlRecordStratum);

export default class UrlReference extends UrlMixin(
  ReferenceMixin(CreateModel(UrlReferenceTraits))
) {
  static readonly type = "url-reference";

  get type() {
    return UrlReference.type;
  }

  protected forceLoadReference(
    _previousTarget: BaseModel | undefined
  ): Promise<BaseModel | undefined> {
    if (this.url === undefined || this.uniqueId === undefined) {
      return Promise.resolve(undefined);
    }

    const target = UrlReference.createCatalogMemberFromUrlReference(
      this,
      this.uniqueId,
      this.url,
      this.terria,
      this.allowLoad || false
    );

    return Promise.resolve(target);
  }

  private static async createCatalogMemberFromUrlReference(
    sourceReference: BaseModel,
    id: string,
    url: string,
    terria: Terria,
    allowLoad: boolean,
    _index?: number
  ): Promise<BaseModel | undefined> {
    const index = _index || 0;
    if (index >= UrlToCatalogMemberMapping.mapping.length) {
      return Promise.resolve(undefined);
    }

    // Does the mapping at this index match this url?
    // Can we load it if we need to?
    if (
      (UrlToCatalogMemberMapping.mapping[index].matcher &&
        !UrlToCatalogMemberMapping.mapping[index].matcher(url)) ||
      (UrlToCatalogMemberMapping.mapping[index].requiresLoad && !allowLoad)
    ) {
      // Nope, try the mapping at the next index.
      return UrlReference.createCatalogMemberFromUrlReference(
        sourceReference,
        id,
        url,
        terria,
        allowLoad,
        index + 1
      );
    } else {
      // We've got a match! Try and create a model
      const item = CatalogMemberFactory.create(
        UrlToCatalogMemberMapping.mapping[index].type,
        sourceReference.uniqueId,
        terria,
        sourceReference
      );

      if (item === undefined) {
        // Creating the model failed, try the mapping at the next index
        return UrlReference.createCatalogMemberFromUrlReference(
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
      }).logError();

      if (allowLoad && CatalogMemberMixin.isMixedInto(item)) {
        const loadMetadataResult = await item.loadMetadata();
        if (loadMetadataResult.error) {
          return UrlReference.createCatalogMemberFromUrlReference(
            sourceReference,
            id,
            url,
            terria,
            allowLoad,
            index + 1
          );
        }
      }
      return item;
    }
  }
}

export type Matcher = (input: string) => boolean;

export interface MappingEntry {
  matcher: Matcher;
  type: string;
  requiresLoad: boolean;
}

export class UrlMapping {
  mapping: MappingEntry[] = [];

  register(matcher: Matcher, type: string, requiresLoad?: boolean) {
    this.mapping.push({
      matcher,
      type,
      requiresLoad: Boolean(requiresLoad)
    });
  }
}

export const UrlToCatalogMemberMapping = new UrlMapping();

/**
 * Register a url handler for a specific catalog member type.
 *
 * When a user uploads a url or drags-n-drops a particular file, the matchers
 * are tried in order and when there is a match we try and create a catalog
 * member of that type.
 *
 * @param catalogMemberType The type string identifying the catalog member
 * @param matcher The matcher definition
 * @param requiresLoad Should be set to `true` if in addition to URL matching we must also try and load
 *    the item successfully for it to be a valid match. Eg WMS/WFS groups that require enumeration.
 */
export function registerUrlHandlerForCatalogMemberType(
  catalogMemberType: string,
  matcher: Matcher,
  requiresLoad?: boolean
): void {
  UrlToCatalogMemberMapping.register(matcher, catalogMemberType, requiresLoad);
}
