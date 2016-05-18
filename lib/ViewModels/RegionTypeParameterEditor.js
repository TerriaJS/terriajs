'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadView = require('../Core/loadView');

var RegionTypeParameterEditor = function(options) {
    this.catalogFunction = options.catalogFunction;
    this.parameter = options.parameter;

    var parameterValues = options.parameterValues;

    this.regionProviders = [];
    knockout.track(this, ['regionProviders']);

    knockout.defineProperty(this, 'value', {
        get: function() {
            return parameterValues[this.parameter.id];
        },
        set: function(value) {
            parameterValues[this.parameter.id] = value;
        }
    });

    var that = this;
    this.parameter.getAllRegionTypes().then(function(regionProviders) {
        that.regionProviders = regionProviders;

        // If no region type is selected yet, find some region mapped data and select its region type.
        if (!defined(that.value)) {
            var nowViewingItems = that.catalogFunction.terria.nowViewing.items;
            for (var i = 0; i < nowViewingItems.length; ++i) {
                var item = nowViewingItems[i];
                if (defined(item.regionMapping) && defined(item.regionMapping.regionDetails) && item.regionMapping.regionDetails.length > 0) {
                    that.value = item.regionMapping.regionDetails[0].regionProvider;
                    break;
                }
            }
        }
    });
};

RegionTypeParameterEditor.prototype.show = function(container) {
    loadView(require('../Views/RegionTypeParameterEditor.html'), container, this);
};

module.exports = RegionTypeParameterEditor;
