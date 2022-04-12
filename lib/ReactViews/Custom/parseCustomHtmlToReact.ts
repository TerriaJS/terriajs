"use strict";

import React, { ReactElement } from "react";
import styled from "styled-components";
import CustomComponent, {
  DomElement,
  ProcessNodeContext
} from "./CustomComponent";
const HtmlToReact = require("html-to-react");
const combine = require("terriajs-cesium/Source/Core/combine").default;
const defined = require("terriajs-cesium/Source/Core/defined").default;
const utils = require("html-to-react/lib/utils");
const Icon = require("../../Styled/Icon").default;
const { StyledIcon } = require("../../Styled/Icon");

const htmlToReactParser = new HtmlToReact.Parser({
  decodeEntities: true
});
const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions(React);

const isValidNode = function() {
  return true;
};

const shouldProcessEveryNodeExceptWhiteSpace = function(node: DomElement) {
  // Use this to avoid white space between table elements, eg.
  //     <table> <tbody> <tr>\n<td>x</td> <td>3</td> </tr> </tbody> </table>
  // being rendered as empty <span> elements, and causing React errors.
  return node.type !== "text" || node.data.trim();
};

let keyIndex = 0;

const ExternalLinkIcon = styled(StyledIcon).attrs({
  glyph: Icon.GLYPHS.externalLink,
  styledWidth: "10px",
  styledHeight: "10px",
  displayInline: true
})`
  margin-left: 5px;
  fill: currentColor;
`;

type ExternalLinkIconOptions = { disableExternalLinkIcon?: boolean };

function shouldAppendExternalLinkIcon(
  url: string | undefined,
  context: ExternalLinkIconOptions
) {
  if (!url) return false;
  const tmp = document.createElement("a");
  tmp.href = url;
  const isExternalLink = tmp.host !== window.location.host;
  return context.disableExternalLinkIcon !== true && isExternalLink;
}

/**
 * @private
 */
function getProcessingInstructions(context: ParseCustomHtmlToReactContext) {
  // Process custom nodes specially.
  const processingInstructions: {
    shouldProcessNode: (node: DomElement) => boolean;
    processNode: (
      node: DomElement,
      children: ReactElement[],
      index: number
    ) => void;
  }[] = [];
  const customComponents = CustomComponent.values;
  for (let i = 0; i < customComponents.length; i++) {
    const customComponent = customComponents[i];
    processingInstructions.push({
      shouldProcessNode: customComponent.shouldProcessNode.bind(
        customComponent,
        context
      ),
      processNode: customComponent.processNode.bind(customComponent, context)
    });
  }

  // Make sure any <a href> tags open in a new window
  processingInstructions.push({
    shouldProcessNode: (node: DomElement) => node.name === "a",
    processNode: function(node: DomElement, children, index) {
      // eslint-disable-line react/display-name
      const elementProps = {
        key: "anchor-" + keyIndex++,
        target: "_blank",
        rel: "noreferrer noopener"
      };
      node.attribs = combine(node.attribs, elementProps);

      if (shouldAppendExternalLinkIcon(node?.attribs?.href, context)) {
        const externalIcon = React.createElement(ExternalLinkIcon, {});
        children.push(externalIcon);
      }

      return utils.createElement(node, index, node.data, children);
    }
  });

  // Process all other nodes as normal.
  processingInstructions.push({
    shouldProcessNode: shouldProcessEveryNodeExceptWhiteSpace,
    processNode: processNodeDefinitions.processDefaultNode
  });
  return processingInstructions;
}

export type ParseCustomHtmlToReactContext = ProcessNodeContext &
  ExternalLinkIconOptions;

/**
 * Return html as a React Element.
 */
function parseCustomHtmlToReact(
  html: string,
  context?: ParseCustomHtmlToReactContext
) {
  if (!defined(html) || html.length === 0) {
    return html;
  }

  return htmlToReactParser.parseWithInstructions(
    html,
    isValidNode,
    getProcessingInstructions(context ?? {})
  );
}

export default parseCustomHtmlToReact;
