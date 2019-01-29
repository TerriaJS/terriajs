'use strict';

const React = require('react');
const HtmlToReact = require('html-to-react');
const combine = require('terriajs-cesium/Source/Core/combine');
const defined = require('terriajs-cesium/Source/Core/defined');
const utils = require('html-to-react/lib/utils');

const CustomComponents = require('./CustomComponents');

const htmlToReactParser = new HtmlToReact.Parser({
    decodeEntities: true
});
const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions(React);

const isValidNode = function() {
    return true;
};

const shouldProcessEveryNodeExceptWhiteSpace = function(node) {
    // Use this to avoid white space between table elements, eg.
    //     <table> <tbody> <tr>\n<td>x</td> <td>3</td> </tr> </tbody> </table>
    // being rendered as empty <span> elements, and causing React errors.
    return node.type !== 'text' || node.data.trim();
};

let keyIndex = 0;

/**
 * @private
 */
function getProcessingInstructions(context) {

    /**
     * @private
     */
    function boundProcessor(processor) {
        return {
            shouldProcessNode: processor.shouldProcessNode,
            processNode: processor.processNode.bind(null, context)
        };
    }

    // Process custom nodes specially.
    let processingInstructions = [];
    const customComponents = CustomComponents.values();
    for (let i = 0; i < customComponents.length; i++) {
        const customComponent = customComponents[i];
        processingInstructions.push({
            shouldProcessNode: node => (node.name === customComponent.name),
            processNode: customComponent.processNode.bind(null, context)
        });
        const processors = customComponent.furtherProcessing;
        if (defined(processors)) {
            processingInstructions = processingInstructions.concat(
                processors.map(boundProcessor)
            );
        }
    }

    // Make sure any <a href> tags open in a new window
    processingInstructions.push({
        shouldProcessNode: node => node.name === 'a',
        processNode: function(node, children, index) { // eslint-disable-line react/display-name
            const elementProps = {
                key: 'anchor-' + (keyIndex++),
                target: '_blank',
                rel: 'noreferrer noopener'
            };
          node.attribs = combine(node.attribs, elementProps);
          return utils.createElement(node,index, node.data, children);
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
    return htmlToReactParser.parseWithInstructions(html, isValidNode, getProcessingInstructions(context || {}));
}

module.exports = parseCustomHtmlToReact;
