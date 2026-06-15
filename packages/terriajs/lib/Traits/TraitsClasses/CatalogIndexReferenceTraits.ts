import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import { traitClass } from "../Trait";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";

@traitClass({
  description: `See [CatalogIndex](/guide/customizing/search-providers/#catalogindex) guide. 

If your TerriaMap has many dynamic groups which need to be loaded, it may be worth generating a static catalog index JSON file.

- \`yarn build-tools\`
- \`node ./build/generateCatalogIndex.js -c config-url -b base-url\``
})
export default class CatalogIndexReferenceTraits extends mixTraits(
  CatalogMemberReferenceTraits
) {
  @primitiveArrayTrait({
    type: "string",
    name: "Member known container unique IDs",
    description:
      "These are used to load models which this model depends on (eg parent groups)."
  })
  memberKnownContainerUniqueIds: string[] = [];

  @primitiveArrayTrait({
    type: "string",
    name: "Share keys",
    description:
      "Share keys can be used to resolve older model IDs to this model."
  })
  shareKeys?: string[];

  @primitiveTrait({
    name: "Name in catalog",
    description:
      "The name of the item to be displayed in the catalog. This will only be defined if it differs from `name`.",
    type: "string"
  })
  nameInCatalog?: string;
}
