"use strict";

import CollapsibleCustomComponent from "./CollapsibleCustomComponent";
import CustomComponent from "./CustomComponent";
import SOSChartCustomComponent from "./SOSChartCustomComponent";
import CsvChartCustomComponent from "./CsvChartCustomComponent";
import TerriaTooltipCustomComponent from "./TerriaTooltip";

/**
 * Registers custom component types.
 *
 * You can define your own by adding additional calls to
 * {@CustomComponent.register} here or in separate source file executed
 * at startup.
 */
const registerCustomComponentTypes = function(terria) {
  CustomComponent.register(new CsvChartCustomComponent());
  CustomComponent.register(new SOSChartCustomComponent());
  CustomComponent.register(new CollapsibleCustomComponent());
  CustomComponent.register(new TerriaTooltipCustomComponent());
};

export default registerCustomComponentTypes;
