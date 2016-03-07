"use strict";

/*global require*/
var markdownToHtml = require('./markdownToHtml');

var htmlTagRegex = /<html(.|\s)*>(.|\s)*<\/html>/im;

var KnockoutMarkdownBinding = {
    allowUnsafeHtml : false,

    register : function(knockout) {
        var that = this;

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
                    html = markdownToHtml(rawText, that.allowUnsafeHtml);
                }

                var nodes = knockout.utils.parseHtmlFragment(html);
                element.className = element.className + ' markdown';

                for (var i = 0; i < nodes.length; ++i) {
                    var node = nodes[i];
                    setAnchorTargets(node);
                    element.appendChild(node);
                }
            }
        };
    }
};

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


module.exports = KnockoutMarkdownBinding;
