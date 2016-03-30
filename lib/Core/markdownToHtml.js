'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
//var MarkdownIt = require('markdown-it');
const MarkdownIt = () => {};
var DOMPurify = require('dompurify');

var md = new MarkdownIt({
    html: true,
    linkify: true
});

/**
 * Convert a String in markdown format (which includes html) into html format.
 * @param  {String} markdownString String in markdown format.
 * @param  {Boolean} allowUnsafeHtml Pass true to allow unsafe html. Defaults to false.
 * @param  {Object} [options] Options to pass to DOMPurify, eg. {ADD_TAGS: ['ying', 'yang']} (https://github.com/cure53/DOMPurify).
 * @return {String} HTML-formatted string.
 */
function markdownToHtml(markdownString, allowUnsafeHtml, options) {
    if (!defined(markdownString) || markdownString.length === 0) {
        return markdownString;
    }

    var unsafeHtml = md.render(markdownString);
    if (allowUnsafeHtml) {
        return unsafeHtml;
    } else {
        return DOMPurify.sanitize(unsafeHtml, options);
    }
}

module.exports = markdownToHtml;
