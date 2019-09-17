import { DomElement } from "domhandler";
import React, { ReactElement } from "react";
import Collapsible from "./Collapsible/Collapsible";
import CustomComponent, { ProcessNodeContext } from "./CustomComponent";

/**
 * A `<collapsible>` custom component, which displays a collapsible section
 * around its child components. It has the following attributes:
 *
 *   * `title` - (Required) The title of the section.
 *   * `open` - (Optional) True if the section is initially open.
 */
export default class CollapsibleCustomComponent extends CustomComponent {
  get name(): string {
    return "collapsible";
  }

  get attributes(): string[] {
    return ["title", "open"];
  }

  processNode(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[]
  ): ReactElement {
    const title =
      node.attribs && node.attribs.title ? node.attribs.title : "Collapsible";
    const startsOpen = node.attribs ? Boolean(node.attribs.open) : false;

    return React.createElement(
      Collapsible,
      {
        key: title,
        displayName: title,
        title: title,
        startsOpen: startsOpen
      },
      children
    );
  }
}
