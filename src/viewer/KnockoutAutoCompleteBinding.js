"use strict";

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');

var KnockoutAutoCompleteBinding = {
    register : function(knockout) {
        knockout.bindingHandlers.autoComplete = {
            'init': function(element, valueAccessor) {
                var validArguments = ['source','select','focus', 'render'];
                var widgetOptions = {};
                for (var i = 0; i < validArguments.length; i++) {
                    var arg = validArguments[i];
                    widgetOptions[arg] = valueAccessor()[arg];
                }
                $(element).autocomplete(widgetOptions).autocomplete( "instance" )._renderItem = widgetOptions['render'];
            },
            'update': function(element, valueAccessor) {
                var hideAutoComplete = valueAccessor()['hideMenu'];

                if(hideAutoComplete === false) {
                    $(element).autocomplete('close');
                }
            }
        };
    }
};

module.exports = KnockoutAutoCompleteBinding;