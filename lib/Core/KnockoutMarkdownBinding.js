"use strict";

/*global require*/
var MarkdownIt = require('markdown-it');
var sanitizeCaja = require('sanitize-caja/sanitizer-bundle');

var htmlTagRegex = /<html(.|\s)*>(.|\s)*<\/html>/im;

var KnockoutMarkdownBinding = {
    register : function(knockout) {
        knockout.bindingHandlers.markdown = {
            'init': function() {
                // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
                return { 'controlsDescendantBindings': true };
            },
            'update': function (element, valueAccessor) {
                // Remove existing children of this element.
                while (element.firstChild) {
                    knockout.removeNode(element.firstChild);
                }

                var rawText = knockout.unwrap(valueAccessor());

                // If the text contains an <html> tag, don't try to interpret it as Markdown because
                // we'll probably break it in the process.
                var html;
                if (htmlTagRegex.test(rawText)) {
                    html = rawText;
                } else {
                    html = markdownToHtml(rawText);
                }

                var nodes = knockout.utils.parseHtmlFragment(html, element);

                for (var i = 0; i < nodes.length; ++i) {
                    var node = nodes[i];
                    setAnchorTargets(node);
                    element.appendChild(node);
                }
            }
        };
    }
};

var md = new MarkdownIt({
    html: true,
    linkify: true
});

function markdownToHtml(markdownString) {
    var unsafeHtml = md.render(markdownString);
    return sanitizeCaja(unsafeHtml, cleanUrl, cleanId);
}

function setAnchorTargets(element) {
    if (element instanceof HTMLAnchorElement) {
        element.target = '_blank';
    }

    if (element.childNodes && element.childNodes.length > 0) {
        for (var i = 0; i < element.childNodes.length; ++i) {
            setAnchorTargets(element.childNodes[i]);
        }
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

module.exports = KnockoutMarkdownBinding;