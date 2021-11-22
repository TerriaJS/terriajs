"use strict";

const React = require("react");
const HtmlToReact = require("html-to-react");
const combine = require("terriajs-cesium/Source/Core/combine").default;
const defined = require("terriajs-cesium/Source/Core/defined").default;
const utils = require("html-to-react/lib/utils");

import CustomComponent from "./CustomComponent";

const htmlToReactParser = new HtmlToReact.Parser({
  decodeEntities: true
});
const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions(React);

const externalLinkIconHtmlInput = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.60001 7.80001C9.60001 7.46864 9.86864 7.20001 10.2 7.20001C10.5314 7.20001 10.8 7.46864 10.8 7.80001V10.2C10.8 10.5314 10.5314 10.8 10.2 10.8H1.80001C1.46864 10.8 1.20001 10.5314 1.20001 10.2V1.80001C1.20001 1.46864 1.46864 1.20001 1.80001 1.20001H4.20001C4.53138 1.20001 4.80001 1.46864 4.80001 1.80001C4.80001 2.13138 4.53138 2.40001 4.20001 2.40001H2.40001V9.60001H9.60001V7.80001ZM8.67957 2.40001H7.20001C6.86864 2.40001 6.60001 2.13138 6.60001 1.80001C6.60001 1.46864 6.86864 1.20001 7.20001 1.20001H10.1281H10.2C10.5314 1.20001 10.8 1.46864 10.8 1.80001V4.80001C10.8 5.13138 10.5314 5.40001 10.2 5.40001C9.86864 5.40001 9.60001 5.13138 9.60001 4.80001V3.17663L6.42428 6.35237C6.18996 6.58668 5.81006 6.58668 5.57575 6.35237C5.34143 6.11805 5.34143 5.73815 5.57575 5.50384L8.67957 2.40001Z" fill="currentColor"/>external link</svg>`;
const externalLinkIconReact = htmlToReactParser.parse(
  externalLinkIconHtmlInput
);

const isValidNode = function() {
  return true;
};

const shouldProcessEveryNodeExceptWhiteSpace = function(node) {
  // Use this to avoid white space between table elements, eg.
  //     <table> <tbody> <tr>\n<td>x</td> <td>3</td> </tr> </tbody> </table>
  // being rendered as empty <span> elements, and causing React errors.
  return node.type !== "text" || node.data.trim();
};

let keyIndex = 0;
const isExternalLink = url => {
  const tmp = document.createElement("a");
  tmp.href = url;
  return tmp.host !== window.location.host;
};

/**
 * @private
 */
function getProcessingInstructions(context) {
  // Process custom nodes specially.
  const processingInstructions = [];
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
    shouldProcessNode: node => node.name === "a",
    processNode: function(node, children, index) {
      // eslint-disable-line react/display-name
      const elementProps = {
        key: "anchor-" + keyIndex++,
        target: "_blank",
        rel: "noreferrer noopener"
      };
      node.attribs = combine(node.attribs, elementProps);

      if (isExternalLink(node.attribs.href)) {
        children.push(externalLinkIconReact);
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

/**
 * Return html as a React Element.
 * @param  {String} html
 * @param  {Object} [context] Provide any further information that custom components need to know here, eg. which feature and catalogItem they come from.
 * @return {ReactElement}
 */
function parseCustomHtmlToReact(html, context) {
  if (!defined(html) || html.length === 0) {
    return html;
  }
  return htmlToReactParser.parseWithInstructions(
    html,
    isValidNode,
    getProcessingInstructions(context || {})
  );
}

export default parseCustomHtmlToReact;
