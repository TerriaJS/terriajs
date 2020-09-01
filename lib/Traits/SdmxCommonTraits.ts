import primitiveTrait from "./primitiveTrait";
import ModelTraits from "./ModelTraits";
import { DimensionOption, Dimension } from "../Models/SelectableDimensions";
import objectArrayTrait from "./objectArrayTrait";

export class DimensionOptionTraits extends ModelTraits
  implements DimensionOption {
  @primitiveTrait({
    type: "string",
    name: "ID",
    description: "Option ID"
  })
  id?: string;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Option name (human-readable)"
  })
  name?: string;
}

export class DimensionTraits extends ModelTraits implements Dimension {
  @primitiveTrait({
    type: "string",
    name: "ID",
    description: "Dimension ID"
  })
  id?: string;

  @primitiveTrait({
    type: "string",
    name: "Name",
    description: "Dimension name (human-readable)"
  })
  name?: string;

  @objectArrayTrait({
    type: DimensionOptionTraits,
    idProperty: "id",
    name: "Options",
    description: "Dimension options"
  })
  options?: DimensionOptionTraits[];

  @primitiveTrait({
    type: "string",
    name: "Selected ID",
    description: "Selected Option's ID"
  })
  selectedId?: string;

  @primitiveTrait({
    type: "boolean",
    name: "Allow undefined",
    description: "Allow dimension to be undefined"
  })
  allowUndefined?: boolean;

  @primitiveTrait({
    type: "boolean",
    name: "Disable dimension",
    description: "Hides dimension"
  })
  disable?: boolean;
}

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
