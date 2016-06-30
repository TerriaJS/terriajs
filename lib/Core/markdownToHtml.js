'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var MarkdownIt = require('markdown-it');
var DOMPurify = require('dompurify');

var md = new MarkdownIt({
    html: true,
    linkify: true
});

var htmlTagRegex = /<html(.|\s)*>(.|\s)*<\/html>/im;

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
    // If the text contains an <html> tag, don't try to interpret it as Markdown because
    // we'll probably break it in the process.
    var unsafeHtml;
    if (htmlTagRegex.test(markdownString)) {
        unsafeHtml = markdownString;
    } else {
        unsafeHtml = md.render(markdownString);
    }
    if (allowUnsafeHtml) {
        return unsafeHtml;
    } else {
        return DOMPurify.sanitize(unsafeHtml, options);
    }
}

module.exports = markdownToHtml;
