import { Dimension, DimensionOption } from "../Models/SelectableDimensions";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import ModelTraits from "./ModelTraits";
import objectArrayTrait from "./objectArrayTrait";
import primitiveTrait from "./primitiveTrait";
import UrlTraits from "./UrlTraits";

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

export class ReplaceStringTraits extends ModelTraits {
  @primitiveTrait({
    type: "string",
    name: "Find",
    description: "String to find"
  })
  find?: string;

  @primitiveTrait({
    type: "string",
    name: "Replace",
    description: "String to replace with"
  })
  replace?: string;
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

export type ModelOverrideType =
  | "region"
  | "region-type"
  | "unit-measure"
  | "unit-multiplier"
  | "frequency";

/**
 * Notes on region mapping:
 * RegionType is determined by sdmxJsonDataflowStratum.column in this order:
 * - `modelOverrideTraits.regionType`
 * - if `modelOverrideTraits.type === 'region'` and there exists another modelOverrideTraits with `type === 'region-type'` in the datastructure, then region-type will be set from its corresponding dimension
 * - the dimension id
 * - the codelist name
 * - the codelist id (the actual string, not URN form)
 * - the concept name
 * - the concept id (the actual string, not URN form)
 *
 * Then regionTypeReplacements are applied (which can replace regionType with a different regionType - using [{find:string, replace:string}] pattern)
 */
export class ModelOverrideTraits extends DimensionTraits {
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
    description: `Override concept/dimension type - Possible values are:
      - 'region': values contain region codes used for region mapping - eg Country code)
      - 'region-type': values contains region types - eg 'CNT2' which is 2-letter country codes)
      - 'unit-measure': values should be used to describe primary-measure (eg in chart title)
      - 'unit-multiplier': multiply primary-measure value by atrtibute values
      - 'frequency': value used to determine time period frequency (ie. yearly, monthly...)`
  })
  type?: ModelOverrideType;

  @primitiveTrait({
    type: "string",
    name: "Region type",
    description:
      "If `type` has been specified as 'region', you can also manually specify the region type (eg SA2 for ABS Statistical Area 2)"
  })
  regionType?: string;

  @objectArrayTrait({
    type: ReplaceStringTraits,
    idProperty: "index",
    name: "Region type",
    description:
      "If `type` has been specified as 'region' and this dataflow contains multiple regionTypes - you can add a map to correct automatically detected region types. For example: setting `regionTypeReplacements = [{find: 'SA1_2016', replace: 'SA1_2011'}]` will replace `regionType` with `SA1_2011` if it was `SA1_2016`"
  })
  regionTypeReplacements?: ReplaceStringTraits[];
}

export default class SdmxCommonTraits extends mixTraits(
  UrlTraits,
  CatalogMemberTraits,
  GroupTraits
) {
  @objectArrayTrait({
    type: ModelOverrideTraits,
    idProperty: "id",
    name: "Concept overrides",
    description:
      "This provides ability to override Dataflow dimensions by concept or codelist ID (full URN). For example, setting a default value for a given concept. Codelist overrides take priority over concept overrides. TODO add example"
  })
  modelOverrides?: ModelOverrideTraits[];
}
