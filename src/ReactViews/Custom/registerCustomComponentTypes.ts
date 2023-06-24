"use strict";

import ApiTableChartCustomComponent from "./ApiTableCustomComponent";
import CollapsibleCustomComponent from "./CollapsibleCustomComponent";
import CsvChartCustomComponent from "./CsvChartCustomComponent";
import CustomComponent from "./CustomComponent";
import FeedbackLinkCustomComponent from "./FeedbackLinkCustomComponent";
import SOSChartCustomComponent from "./SOSChartCustomComponent";
import TerriaTooltipCustomComponent from "./TerriaTooltip";

/**
 * Registers custom component types.
 *
 * You can define your own by adding additional calls to
 * {@CustomComponent.register} here or in separate source file executed
 * at startup.
 */
export default function registerCustomComponentTypes() {
  CustomComponent.register(new CsvChartCustomComponent());
  CustomComponent.register(new SOSChartCustomComponent());
  CustomComponent.register(new ApiTableChartCustomComponent());
  CustomComponent.register(new CollapsibleCustomComponent());
  CustomComponent.register(new FeedbackLinkCustomComponent());
  CustomComponent.register(new TerriaTooltipCustomComponent());
}
