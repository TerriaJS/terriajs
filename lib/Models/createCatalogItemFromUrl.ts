import Terria from "./Terria";
import CommonStrata from "./CommonStrata";
import upsertModelFromJson from "./upsertModelFromJson";
import CatalogMemberFactory from "./CatalogMemberFactory";
import { BaseModel } from "./Model";
import UrlReference from "./UrlReference";

export default function createCatalogItemFromUrl(
  url: string,
  terria: Terria,
  _index?: number, options: {
    id?: string;
  } = {}
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
      allowLoad: true
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
