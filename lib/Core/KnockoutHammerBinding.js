"use strict";

/*global require*/
var Hammer = require('hammerjs');

var KnockoutHammerBinding = {
    register : function(knockout) {
        knockout.bindingHandlers.swipeLeft = {
            init : function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var f = knockout.unwrap(valueAccessor());
                new Hammer(element).on('swipeleft', function(e) {
                    var viewModel = bindingContext.$data;
                    f.apply(viewModel, arguments);
                });
            }
        };

        knockout.bindingHandlers.swipeRight = {
            init : function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var f = knockout.unwrap(valueAccessor());
                new Hammer(element).on('swiperight', function(e) {
                    var viewModel = bindingContext.$data;
                    f.apply(viewModel, arguments);
                });
            }
        };
    }
};

module.exports = KnockoutHammerBinding;