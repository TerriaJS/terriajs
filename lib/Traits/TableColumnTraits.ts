import ModelTraits from "./ModelTraits";
import primitiveTrait from "./primitiveTrait";
import primitiveArrayTrait from "./primitiveArrayTrait";
import anyTrait from "./anyTrait";
import { JsonObject } from "../Core/Json";
import TableColumnType from "../Table/TableColumnType";

export default class TableColumnTraits extends ModelTraits {
  @primitiveTrait({
    name: "Name",
    description: "The name of the column.",
    type: "string"
  })
  name?: string;

  @primitiveTrait({
    name: "Title",
    description: "The displayed title of the column.",
    type: "string"
  })
  title?: string;

  @primitiveTrait({
    name: "Type",
    description:
      "The type of the column. If not specified, the type is guessed from " +
      "the column's name and values. Valid types are:\n\n" +
      Object.keys(TableColumnType)
        .map(type => `  * \`${type}\``)
        .join("\n"),
    type: "string"
  })
  type?: string;

  @primitiveTrait({
    name: "Region Type",
    description:
      "The type of region referenced by the values in this column. If " +
      "`Type` is not defined and this value can be resolved, the column " +
      "`Type` will be `region`.",
    type: "string"
  })
  regionType?: string;

  @primitiveTrait({
    name: "Region Type Disambiguation Column",
    description:
      "The name of the column to use to disambiguate region matches in " +
      "this column.",
    type: "string"
  })
  regionDisambiguationColumn?: string;

  @primitiveArrayTrait({
    name: "Values to Replace with Zero",
    description: "Values of the column to replace with 0.0, such as `-`.",
    type: "string"
  })
  replaceWithZeroValues?: string[];

  @primitiveArrayTrait({
    name: "Values to Replace with Null",
    description: "Values of the column to replace with null, such as `NA`.",
    type: "string"
  })
  replaceWithNullValues?: string[];

  @anyTrait({
    name: "Format",
    description:
      "The formatting options to pass to `toLocaleString` when formatting the values " +
      "of this column for the legend and feature information panels. See:\n" +
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString"
  })
  format?: JsonObject;
}
