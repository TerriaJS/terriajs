import ModelTraits from "../../ModelTraits";
import primitiveTrait from "../../Decorators/primitiveTrait";

export default class TablePointSizeStyleTraits extends ModelTraits {
  @primitiveTrait({
    name: "Point Size Column",
    description:
      "The column to use to size points. This column must be of type `scalar`",
    type: "string"
  })
  pointSizeColumn?: string;

  @primitiveTrait({
    name: "Null Size",
    description:
      "The point size, in pixels, to use when the column has no value.",
    type: "number"
  })
  nullSize: number = 9;

  @primitiveTrait({
    name: "Size Factor",
    description:
      "The size, in pixels, of the point is:\n" +
      "  `Normalized Value * Size Factor + Size Offset`\n" +
      "where the Normalized Value is a value in the range 0 to 1 with " +
      "0 representing the lowest value in the column and 1 representing " +
      "the highest.",
    type: "number"
  })
  sizeFactor: number = 14;

  @primitiveTrait({
    name: "Size Offset",
    description:
      "The size, in pixels, of the point is:\n" +
      "  `Normalized Value * Size Factor + Size Offset`\n" +
      "where the Normalized Value is a value in the range 0 to 1 with " +
      "0 representing the lowest value in the column and 1 representing " +
      "the highest.",
    type: "number"
  })
  sizeOffset: number = 10;
}
