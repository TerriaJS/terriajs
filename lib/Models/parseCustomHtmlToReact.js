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

let processingInstructions;

function getProcessingInstructions() {
    if (!defined(processingInstructions)) {
        // Process custom nodes specially.
        processingInstructions = [];
        const customComponents = CustomComponents.values();
        for (let i = 0; i < customComponents.length; i++) {
            const customComponent = customComponents[i];
            processingInstructions.push({
                shouldProcessNode: node => (node.name === customComponent.name),
                processNode: customComponent.processNode
            });
            if (defined(customComponent.furtherProcessing)) {
                processingInstructions = processingInstructions.concat(customComponent.furtherProcessing);
            }
        }
        // Process all other nodes as normal.
        processingInstructions.push({
            shouldProcessNode: () => true,
            processNode: processNodeDefinitions.processDefaultNode
        });
    }
    return processingInstructions;
}

function parseCustomHtmlToReact(html) {
    return htmlToReactParser.parseWithInstructions(html, isValidNode, getProcessingInstructions());
}

module.exports = parseCustomHtmlToReact;
