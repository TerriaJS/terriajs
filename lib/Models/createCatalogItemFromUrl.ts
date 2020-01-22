import Terria from "./Terria";
import CommonStrata from "./CommonStrata";
import upsertModelFromJson from "./upsertModelFromJson";
import CatalogMemberFactory from "./CatalogMemberFactory";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import { BaseModel } from "./Model";

export default function createCatalogItemFromUrl(
  url: string,
  terria: Terria,
  allowLoad: boolean,
  _index?: number
): Promise<BaseModel | undefined> {
  return createCatalogItemFromUrlWithOptions(
    url,
    terria,
    allowLoad,
    {},
    _index
  );
}

export function createCatalogItemFromUrlWithOptions(
  url: string,
  terria: Terria,
  allowLoad: boolean,
  options: {
    id?: string;
  },
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
    return createCatalogItemFromUrlWithOptions(
      url,
      terria,
      allowLoad,
      options,
      index + 1
    );
  } else {
    // Try creating an item of this type and loading it using provided url.
    // If it works then add the item to terria and return it, otherwise discard
    // it and try the next type.
    var item = CatalogMemberFactory.create(
      mapping[index].type,
      "/" + (options.id || url),
      terria
    );

    if (item === undefined) {
      return createCatalogItemFromUrlWithOptions(
        url,
        terria,
        allowLoad,
        options,
        index + 1
      );
    }

    item.setTrait(CommonStrata.definition, "url", url);
    item.setTrait(CommonStrata.definition, "name", url);

    if (allowLoad && CatalogMemberMixin.isMixedInto(item)) {
      return item
        .loadMetadata()
        .then(() => {
          terria.addModel(<BaseModel>item);
          return item;
        })
        .catch(e => {
          return createCatalogItemFromUrlWithOptions(
            url,
            terria,
            allowLoad,
            options,
            index + 1
          );
        });
    } else {
      terria.addModel(<BaseModel>item);
      return Promise.resolve(item);
    }
  }
}

type Matcher = (input: string) => boolean;
interface MappingEntry {
  matcher: Matcher;
  type: string;
  requiresLoad: boolean;
}

const mapping: MappingEntry[] = [];

createCatalogItemFromUrl.register = function(
  matcher: Matcher,
  type: string,
  requiresLoad?: boolean
) {
  mapping.push({
    matcher,
    type,
    requiresLoad: Boolean(requiresLoad)
  });
};
