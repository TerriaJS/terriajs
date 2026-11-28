import { CatalogMemberFactory } from "terriajs-plugin-api";
import OgcProcessCatalogFunction from "./Ogc/Process/OgcProcessCatalogFunction";
import OgcProcessCatalogFunctionJob from "./Ogc/Process/OgcProcessCatalogFunctionJob";
import OgcProcessCatalogGroup from "./Ogc/Process/OgcProcessCatalogGroup";
import OgcProcessJobCatalogGroup from "./Ogc/Process/OgcProcessJobCatalogGroup";
import OgcProcessJobReference from "./Ogc/Process/OgcProcessJobReference";

export default function registerCatalogMembers() {
  const catalogTypes = [
    OgcProcessCatalogGroup,
    OgcProcessCatalogFunction,
    OgcProcessCatalogFunctionJob,
    OgcProcessJobCatalogGroup,
    OgcProcessJobReference
  ];

  catalogTypes.map((c) => CatalogMemberFactory.register(c.type, c));
}
