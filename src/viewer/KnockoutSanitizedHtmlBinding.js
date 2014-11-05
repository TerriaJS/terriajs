"use strict";

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');

var KnockoutSanitizedHtmlBinding = {
    register : function(knockout) {
        knockout.bindingHandlers.sanitizedHtml= {
            'init': function() {
                // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
                return { 'controlsDescendantBindings': true };
            },
            'update': function (element, valueAccessor) {
                knockout.utils.setHtml(element, sanitize(knockout.unwrap(valueAccessor())));
            }
        };
    }
};

// TODO: use a proper HTML sanitizer instead of this hackery.
function sanitize(html) {
    // Escape HTML
    var div = document.createElement('div');
    
    if (defined(div.textContent)) {
        div.textContent = html;
    } else {
        div.innerText = html;
    }

    // Replace Markdown style links (such as: [Link Text](http://link.url.com) ) with actual links.
    var escaped = div.innerHTML;
    var fixedLinks = escaped.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, function(match, name, href) {
        return '<a href="' + href + '" target="_blank">' + name + '</a>';
    });

    // Replace '<br/>' with actual an <br/> tag.
    return fixedLinks.replace(/&lt;br\/&gt;/g, '<br/>');
}

module.exports = KnockoutSanitizedHtmlBinding;