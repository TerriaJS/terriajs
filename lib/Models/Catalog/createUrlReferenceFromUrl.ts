import Terria from "../Terria";
import CommonStrata from "../Definition/CommonStrata";
import upsertModelFromJson from "../Definition/upsertModelFromJson";
import CatalogMemberFactory from "./CatalogMemberFactory";
import UrlReference from "./UrlReference";
import TerriaError from "../../Core/TerriaError";

export default async function createUrlReferenceFromUrl(
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
      localId: url,
      allowLoad: allowLoad
    },
    {}
  ).throwIfUndefined({
    message: `Could not create UrlReference for URL: ${url}`
  }) as UrlReference;

  // Set URL in user stratum so it can be shared
  item.setTrait(CommonStrata.user, "url", url);

  if (!(item instanceof UrlReference)) {
    throw new TerriaError({
      message: `Could not create UrlReference for URL: ${url}`
    });
  }

  terria.catalog.userAddedDataGroup.add(CommonStrata.user, item);

  await item.loadReference();
  if (item.target !== undefined) {
    return item;
  }

  throw new TerriaError({
    message: `Could not load UrlReference for URL: ${url}`
  });
}
