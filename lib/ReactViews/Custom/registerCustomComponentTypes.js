"use strict";

/* global require */

import ChartCustomComponent from "./ChartCustomComponent";
import CollapsibleCustomComponent from "./CollapsibleCustomComponent";
import CustomComponent from "./CustomComponent";

/**
 * Registers custom component types.
 *
 * Here we define the following:
 *   * `<chart>` - {@link ChartCustomComponent}
 *   * `<collapsible>` - {@link CollapsibleCustomComponent}
 *
 * You can define your own by adding additional calls to
 * {@CustomComponent.register} here or in separate source file executed
 * at startup.
 */
const registerCustomComponentTypes = function(terria) {
  CustomComponent.register(new ChartCustomComponent());
  CustomComponent.register(new CollapsibleCustomComponent());
};

export default registerCustomComponentTypes;
