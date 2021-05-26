import { DimensionTraits } from "./DimensionTraits";
import primitiveTrait from "./primitiveTrait";

/**
 * Notes on region mapping concepts:
 * RegionType is determined by sdmxJsonDataflowStratum.column in this order:
 * - `conceptTraits.regionType`
 * - if `conceptTraits.type === 'region'` and there exists another conceptTraits with `type === 'region-type'` in the datastructure, therefore region-type will be set from this concept
 * - the dimension id
 * - the concept name
 * - the concept id (the actual string, not URN form)
 */
export class ConceptTraits extends DimensionTraits {
  @primitiveTrait({
    type: "string",
    name: "ID",
    description:
      "Concept ID (full URN form - urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=ABS:CS_C16_COMMON(1.0.0).REGION)"
  })
  id?: string;

  @primitiveTrait({
    type: "string",
    name: "Type",
    description:
      "Override concept/dimension type - Possible values are 'region' (values contain region codes used for region mapping - eg Country code) or 'region-type' (values contains region types - eg 'CNT2' which is 2-letter country codes)"
  })
  type?: string;

  @primitiveTrait({
    type: "string",
    name: "Region type",
    description:
      "If `type` has been specified as 'region', you can also manually specify the region type (eg SA2 for ABS Statistical Area 2)"
  })
  regionType?: string;
}
