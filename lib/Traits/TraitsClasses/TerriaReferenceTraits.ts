import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";
import mixTraits from "../mixTraits";
import CatalogMemberReferenceTraits from "./CatalogMemberReferenceTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "../Decorators/primitiveTrait";
import { traitClass } from "../Trait";

@traitClass({
  description: `Creates a catalog group or item from url that points to a terria catalog json file.
  
  <strong>Note:</strong> 
  <li>The referenced json file may contain more items than you need.</li>
  <li>Specify required catalog entry IDs (e.g. "LAEMW8fc") in <code>path</code>. If not specified, the whole catalog will be added.</li>
  <li>If the reference is a group, it is helpful to set <code>isGroup</code> to <code>true</code>.</li>`,
  example: {
    type: "terria-reference",
    url: "https://tiles.terria.io/terriajs-examples/terria-reference/a-terria-catalog.json",
    isGroup: true,
    path: ["LAEMW8fc"],
    name: "terria-reference example",
    id: "some unique id for terria-reference example"
  }
})
export default class TerriaReferenceTraits extends mixTraits(
  UrlTraits,
  CatalogMemberReferenceTraits
) {
  @primitiveTrait({
    name: "Is Open",
    description:
      "True if this group is open and its contents are visible; otherwise, false. (This only applies if `isGroup = true`)",
    type: "boolean"
  })
  isOpen?: boolean;

  @primitiveArrayTrait({
    type: "string",
    name: "Path",
    description:
      "The path to the catalog item or group in the target catalog file given as a list of IDs. If not given, Terria will create a pseudo-group with all the catalog items in the catalog file as its members."
  })
  path?: string[];
}
