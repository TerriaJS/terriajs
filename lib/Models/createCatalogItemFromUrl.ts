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
  const index = _index || 0;
  if (index >= mapping.length) {
    return Promise.resolve(undefined);
  }
  if (
    (mapping[index].matcher && !mapping[index].matcher(url)) ||
    (mapping[index].requiresLoad && !allowLoad)
  ) {
    return createCatalogItemFromUrl(url, terria, allowLoad, index + 1);
  } else {
    var item = upsertModelFromJson(
      CatalogMemberFactory,
      terria,
      "",
      undefined,
      CommonStrata.definition,
      { type: mapping[index].type, name: url, url: url }
    );

    if (allowLoad && CatalogMemberMixin.isMixedInto(item)) {
      return item
        .loadMetadata()
        .then(() => item)
        .catch(e => {
          return createCatalogItemFromUrl(url, terria, allowLoad, index + 1);
        });
    } else {
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

// TODO: move registrations to a seperate file
createCatalogItemFromUrl.register(matchesExtension("geojson"), "geojson");
createCatalogItemFromUrl.register(matchesUrl(/\/wms/i), "wms-group", true);
createCatalogItemFromUrl.register(matchesExtension("kml"), "kml");
createCatalogItemFromUrl.register(matchesExtension("kmz"), "kml");

function matchesUrl(regex: RegExp) {
  return /./.test.bind(regex);
}

function matchesExtension(extension: string) {
  var regex = new RegExp("\\." + extension + "$", "i");
  return function(url: string) {
    return Boolean(url.match(regex));
  };
}
