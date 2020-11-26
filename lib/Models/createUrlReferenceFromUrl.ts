import Terria from "./Terria";
import CommonStrata from "./CommonStrata";
import upsertModelFromJson from "./upsertModelFromJson";
import CatalogMemberFactory from "./CatalogMemberFactory";
import UrlReference from "./UrlReference";

export default function createUrlReferenceFromUrl(
  url: string,
  terria: Terria,
  allowLoad: boolean
): Promise<UrlReference | undefined> {
  const item = upsertModelFromJson(
    CatalogMemberFactory,
    terria,
    "",
    CommonStrata.definition,
    {
      type: UrlReference.type,
      name: url,
      url: url,
      localId: url,
      allowLoad: allowLoad
    },
    {}
  );

  if (item === undefined || !(item instanceof UrlReference)) {
    return Promise.resolve(undefined);
  }

  terria.catalog.userAddedDataGroup.add(CommonStrata.user, item);

  return item.loadReference().then(() => {
    if (item.target !== undefined) {
      return Promise.resolve(item);
    } else {
      return Promise.resolve(undefined);
    }
  });
}
