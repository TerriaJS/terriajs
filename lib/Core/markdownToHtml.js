"use strict";

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var MarkdownIt = require('markdown-it');
var sanitizeCaja = require('sanitize-caja/sanitizer-bundle');

var md = new MarkdownIt({
    html: true,
    linkify: true
});

function markdownToHtml(markdownString, allowUnsafeHtml) {
    if (!defined(markdownString)) {
        return undefined;
    }

    var unsafeHtml = md.render(markdownString);
    if (allowUnsafeHtml) {
        return unsafeHtml;
    } else {
        return sanitizeCaja(unsafeHtml, cleanUrl, cleanId);
    }
}

// From https://github.com/mapbox/sanitize-caja/blob/v0.1.3/index.js
// Modified to allow relative URLs.
//
// https://bugzilla.mozilla.org/show_bug.cgi?id=255107
function cleanUrl(url) {
    if (/^https?/.test(url.getScheme())) { return url.toString(); }
    if (/^mailto?/.test(url.getScheme())) { return url.toString(); }
    if (!url.getScheme() && !url.getDomain()) { return url.toString(); }
    if ('data' === url.getScheme() && /^image/.test(url.getPath())) {
        return url.toString();
    }
}

function cleanId(id) { return id; }

module.exports = markdownToHtml;
