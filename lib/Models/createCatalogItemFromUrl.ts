import Terria from "./Terria";
import CommonStrata from "./CommonStrata";
import upsertModelFromJson from "./upsertModelFromJson";
import CatalogMemberFactory from "./CatalogMemberFactory";
import { BaseModel } from "./Model";
import UrlReference from "./UrlReference";

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
  const item = upsertModelFromJson(
    CatalogMemberFactory,
    terria,
    "",
    undefined,
    CommonStrata.definition,
    {
      type: UrlReference.type,
      name: url,
      url: url,
      localId: options.id || url,
      allowLoad: allowLoad
    }
  );

  if (item === undefined || !(item instanceof UrlReference)) {
    return Promise.resolve(undefined);
  }

  return item.loadReference().then(() => {
    if (item.target !== undefined) {
      return Promise.resolve(item);
    } else {
      return Promise.resolve(undefined);
    }
  });
}

type Matcher = (input: string) => boolean;
interface MappingEntry {
  matcher: Matcher;
  type: string;
  requiresLoad: boolean;
}

export const mapping: MappingEntry[] = [];

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
