'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var entities = require('entities');
var MarkdownIt = require('markdown-it');
var DOMPurify = require('dompurify');

// Markdown-it html-escapes attributes for some reason, so <a href="foo&bar"> turns into
// <a href="foo&amp;bar">, breaking links.
// In the old Knockout-bsaed UI we used Sanitize-Caja which would undo this automatically.
// This hook does the same in DOMPurify.
DOMPurify.addHook('uponSanitizeAttribute', function(node, data) {
    data.attrValue = entities.decodeHTML(data.attrValue);
});

var md = new MarkdownIt({
    html: true,
    linkify: true
});

var htmlRegex = /^\s*<[^>]+>/;

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
    // If the text looks like html, don't try to interpret it as Markdown because
    // we'll probably break it in the process.
    var unsafeHtml;
    if (htmlRegex.test(markdownString)) {
        unsafeHtml = markdownString;
    } else {
        // Note this would wrap non-standard tags such as <collapsible>hi</collapsible> in a <p></p>, which is bad.
        unsafeHtml = md.render(markdownString);
    }
    if (allowUnsafeHtml) {
        return unsafeHtml;
    } else {
        return DOMPurify.sanitize(unsafeHtml, options);
    }
}

module.exports = markdownToHtml;
