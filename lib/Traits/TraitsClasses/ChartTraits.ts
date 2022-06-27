import { ChartItemType } from "../../ModelMixins/ChartableMixin";
import Glyphs, { GlyphStyle } from "../../ReactViews/Custom/Chart/Glyphs";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import MappableTraits from "./MappableTraits";

const availableChartGlyphStyles = Object.keys(Glyphs).join(", ");

export default class ChartTraits extends mixTraits(MappableTraits) {
  @primitiveTrait({
    type: "string",
    name: "Chart type",
    description:
      "Type determines how the data availibility will be plotted on chart. eg: momentLines, momentPoints"
  })
  chartType?: ChartItemType;

  // This trait proabably doesn't belong here and should instead be on a new
  //  trait class ChartTraits, however there are complexities to changing
  //  chart-related traits, mixins and interfaces to support this change.
  @primitiveTrait({
    type: "string",
    name: "Chart Disclaimer",
    description: "A HTML string to show above the chart as a disclaimer"
  })
  chartDisclaimer?: string;

  @primitiveTrait({
    type: "string",
    name: "Chart color",
    description:
      "The color to use when the data set is displayed on the chart. The value can be any html color string, eg: 'cyan' or '#00ffff' or 'rgba(0, 255, 255, 1)' for the color cyan."
  })
  chartColor?: string;

  @primitiveTrait({
    type: "string",
    name: "Chart glyph style",
    description: `The glyph style to use for points plotted on the chart. Allowed values include ${availableChartGlyphStyles}. Default is "circle".`
  })
  chartGlyphStyle?: GlyphStyle;
}
