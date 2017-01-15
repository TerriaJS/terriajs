'use strict';

/*global require*/
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var SvgPathBindingHandler = require('terriajs-cesium/Source/Widgets/SvgPathBindingHandler');

var KnockoutMarkdownBinding = require('./KnockoutMarkdownBinding');
var KnockoutHammerBinding = require('./KnockoutHammerBinding');

deprecationWarning('registerKnockoutBindings', 'registerKnockoutBindings has been deprecated and will be removed in a future release.  It is not needed for the new React-based user interface.');

var registerKnockoutBindings = function() {
    SvgPathBindingHandler.register(knockout);
    KnockoutMarkdownBinding.register(knockout);
    KnockoutHammerBinding.register(knockout);

    knockout.bindingHandlers.embeddedComponent = {
        init : function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var component = knockout.unwrap(valueAccessor());
            component.show(element);
            return { controlsDescendantBindings: true };
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        }
    };
};

module.exports = registerKnockoutBindings;
