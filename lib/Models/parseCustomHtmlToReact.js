'use strict';

const React = require('react');
const HtmlToReact = require('html-to-react');

const defined = require('terriajs-cesium/Source/Core/defined');

const CustomComponents = require('./CustomComponents');


const htmlToReactParser = new HtmlToReact.Parser(React);
const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions(React);

const isValidNode = function() {
    return true;
};


function getProcessingInstructions(catalogItem, feature) {

    function boundProcessor(processor) {
        return {
            shouldProcessNode: processor.shouldProcessNode,
            processNode: processor.processNode.bind(null, catalogItem, feature)
        };
    }

    // Process custom nodes specially.
    let processingInstructions = [];
    const customComponents = CustomComponents.values();
    for (let i = 0; i < customComponents.length; i++) {
        const customComponent = customComponents[i];
        processingInstructions.push({
            shouldProcessNode: node => (node.name === customComponent.name),
            processNode: customComponent.processNode.bind(null, catalogItem, feature)
        });
        const processors = customComponent.furtherProcessing;
        if (defined(processors)) {
            processingInstructions = processingInstructions.concat(
                processors.map(boundProcessor)
            );
        }
    }
    // Process all other nodes as normal.
    processingInstructions.push({
        shouldProcessNode: () => true,
        processNode: processNodeDefinitions.processDefaultNode
    });
    return processingInstructions;
}

function parseCustomHtmlToReact(html, catalogItem, feature) {
    return htmlToReactParser.parseWithInstructions(html, isValidNode, getProcessingInstructions(catalogItem, feature));
}

module.exports = parseCustomHtmlToReact;
