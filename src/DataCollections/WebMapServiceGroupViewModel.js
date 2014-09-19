'use strict';

/*global require,L,URI,$*/

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var combine = require('../../third_party/cesium/Source/Core/combine');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var ImageryLayer = require('../../third_party/cesium/Source/Scene/ImageryLayer');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var WebMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/WebMapServiceImageryProvider');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var corsProxy = require('../corsProxy');
var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');
var inherit = require('../inherit');
var PopupMessage = require('../viewer/PopupMessage');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');
var WebMapServiceDataSourceViewModel = require('./WebMapServiceDataSourceViewModel');

/**
 * A {@link GeoDataGroupViewModel} representing a collection of layers from a Web Map Service (WMS) server.
 *
 * @alias WebMapServiceGroupViewModel
 * @constructor
 * @extends GeoDataGroupViewModel
 */
var WebMapServiceGroupViewModel = function() {
    GeoDataGroupViewModel.call(this, 'wms-getCapabilities');

    this._needsLoad = true;
    this._imageryLayer = undefined;

    /**
     * Gets or sets the URL of the WMS server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    knockout.track(this, ['url']);

    var that = this;
    knockout.getObservable(this, 'isOpen').subscribe(function(newValue) {
        if (that._needsLoad === false || newValue === false) {
            return;
        }

        that._needsLoad = false;
        that.isLoading = true;
        getCapabilities(that).always(function() {
            that.isLoading = false;
        });
    });
};

WebMapServiceGroupViewModel.prototype = inherit(GeoDataGroupViewModel.prototype);

/**
 * Updates the WMS group from a JSON object-literal description of it.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 */
 WebMapServiceGroupViewModel.prototype.updateFromJson = function(json) {
    this.name = defaultValue(json.name, 'Unnamed WMS Server');
    this.description = defaultValue(json.description, '');
    this.url = defaultValue(json.url, '');
};

function getCapabilities(viewModel) {
    var url = cleanUrl(viewModel.url) + '?service=WMS&request=GetCapabilities';

    return when(loadXML(url), function(xml) {
        var json = $.xml2json(xml);
        addLayersRecursively(viewModel, json.Capability.Layer, viewModel.items);
    }, function(e) {
        // TODO: view models should not create UI elements directly like this.
        var message =new PopupMessage({
            container: document.body,
            title: 'Group is not available',
            message: 'An error occurred while invoking GetCapabilities on the WMS server.  This may indicate that group you opened is temporarily unavailable ' +
                     'or that there is a problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by ' +
                     'sending an email to <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.'
        });
        viewModel.isOpen = false;
        viewModel._needsLoad = true;
    });
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function addLayersRecursively(viewModel, layers, items, parent) {
    if (!(layers instanceof Array)) {
        layers = [layers];
    }

    for (var i = 0; i < layers.length; ++i) {
        var layer = layers[i];

        // Record this layer's parent, so we can walk up the layer hierarchy looking for inherited properties.
        layer.parent = parent;

        if (defined(layer.Layer)) {
            // WMS 1.1.1 spec section 7.1.4.5.2 says any layer with a Name property can be used
            // in the 'layers' parameter of a GetMap request.  This is true in 1.0.0 and 1.3.0 as well.
            if (defined(layer.Name) && layer.Name.length > 0) {
                items.push(createWmsDataSource(viewModel, layer));
            }
            addLayersRecursively(viewModel, layer.Layer, items);
        }
        else {
            items.push(createWmsDataSource(viewModel, layer));
        }
    }
}

function createWmsDataSource(viewModel, layer) {
    var result = new WebMapServiceDataSourceViewModel();

    result.name = layer.Title;
    result.description = defined(layer.Abstract) && layer.Abstract.length > 0 ? layer.Abstract : viewModel.description;
    result.url = viewModel.url;
    result.layers = layer.Name;

    var supportsGetFeatureInfo = defaultValue(getInheritableProperty(layer, 'queryable'), false);
    result.getFeatureInfoAsGeoJson = supportsGetFeatureInfo;
    result.getFeatureInfoAsXml = supportsGetFeatureInfo;

    var egbb = getInheritableProperty(layer, 'EX_GeographicBoundingBox'); // required in WMS 1.3.0
    if (defined(egbb)) {
        result.rectangle = Rectangle.fromDegrees(egbb.westBoundLongitude, egbb.southBoundLatitude, egbb.eastBoundLongitude, egbb.northBoundLatitude);
    } else {
        var llbb = getInheritableProperty(layer, 'LatLonBoundingBox'); // required in WMS 1.0.0 through 1.1.1
        if (defined(llbb)) {
            result.rectangle = Rectangle.fromDegrees(llbb.minx, llbb.miny, llbb.maxx, llbb.maxy);
        }
    }

    return result;
}

function getInheritableProperty(layer, name) {
    while (defined(layer)) {
        if (defined(layer[name])) {
            return layer[name];
        }
        layer = layer.parent;
    }

    return undefined;
}

module.exports = WebMapServiceGroupViewModel;

