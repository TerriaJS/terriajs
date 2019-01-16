'use strict';

const React = require('react');
const HtmlToReact = require('html-to-react');
const combine = require('terriajs-cesium/Source/Core/combine');
const defined = require('terriajs-cesium/Source/Core/defined');
const camelCaseAttrMap = require('html-to-react/lib/camel-case-attribute-names');
const fromPairs = require('lodash.frompairs');
const map = require('lodash.map');

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
function createStyleJsonFromString(styleString) {
    const toCamelCase = (str) => str.replace(/(?:^\w|[A-Z]|\b\w)/g, (ltr, idx) => idx === 0 ? ltr.toLowerCase() : ltr.toUpperCase()).replace(/\s+/g, '');
    if (!styleString) {
        return {};
    }
    const styles = styleString.split(';');
    let singleStyle;
    let key;
    let value;
    const jsonStyles = {};
    for (let i = 0; i < styles.length; i++) {
        singleStyle = styles[i].split(':');
        key = toCamelCase(singleStyle[0]);
        value = singleStyle[1];
        if (key.length > 0 && value.length > 0) {
            jsonStyles[key] = value;
        }
    }
    return jsonStyles;
}

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
        processNode: function(node, children) { // eslint-disable-line react/display-name
            let elementProps = {
                key: 'anchor-' + (keyIndex++),
                target: '_blank',
                rel: 'noreferrer noopener'
            };

            // Process attributes
            if (Object.keys(node.attribs).length !== 0) {
                elementProps = combine(elementProps, fromPairs(map(node.attribs, function (value, key) {
                    if (key === 'style') {
                        value = createStyleJsonFromString(node.attribs.style);
                    } else if (key === 'class') {
                        key = 'className';
                    } else if (camelCaseAttrMap[key]) {
                        key = camelCaseAttrMap[key];
                    }
                    return [key, value || key,];
                })));
            }

            return React.createElement('a', elementProps, node.data, children);
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
