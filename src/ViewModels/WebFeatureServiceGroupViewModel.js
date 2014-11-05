'use strict';

/*global require,URI,$*/

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var combine = require('../../third_party/cesium/Source/Core/combine');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var ImageryLayer = require('../../third_party/cesium/Source/Scene/ImageryLayer');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var WebMercatorTilingScheme = require('../../third_party/cesium/Source/Core/WebMercatorTilingScheme');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var corsProxy = require('../Core/corsProxy');
var ViewModelError = require('./ViewModelError');
var CatalogGroupViewModel = require('./CatalogGroupViewModel');
var inherit = require('../Core/inherit');
var PopupMessage = require('../viewer/PopupMessage');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');
var runLater = require('../Core/runLater');
var unionRectangles = require('../Map/unionRectangles');
var WebFeatureServiceItemViewModel = require('./WebFeatureServiceItemViewModel');

/**
 * A {@link CatalogGroupViewModel} representing a collection of feature types from a Web Feature Service (WFS) server.
 *
 * @alias WebFeatureServiceGroupViewModel
 * @constructor
 * @extends CatalogGroupViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 */
var WebFeatureServiceGroupViewModel = function(application) {
    CatalogGroupViewModel.call(this, application, 'wfs-getCapabilities');

    this._loadedUrl = undefined;

    /**
     * Gets or sets the URL of the WFS server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets a description of the custodian of the data sources in this group.
     * This property is an HTML string that must be sanitized before display to the user.
     * This property is observable.
     * @type {String}
     */
    this.dataCustodian = undefined;

    knockout.track(this, ['url', 'dataCustodian']);
};

inherit(CatalogGroupViewModel, WebFeatureServiceGroupViewModel);

defineProperties(WebFeatureServiceGroupViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf WebFeatureServiceGroupViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wfs-getCapabilities';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Feature Service (WFS)'.
     * @memberOf WebFeatureServiceGroupViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Feature Service (WFS) Group';
        }
    }
});

/**
 * Loads the items in this group by invoking the GetCapabilities service on the WFS server.
 * Each layer in the response becomes an item in the group.  The {@link CatalogGroupViewModel#isLoading} flag will
 * be set while the load is in progress.
 */
WebFeatureServiceGroupViewModel.prototype.load = function() {
    if (this.url === this._loadedUrl || this.isLoading) {
        return;
    }

    this.isLoading = true;

    var that = this;
    runLater(function() {
        that._loadedUrl = that.url;
        getCapabilities(that).always(function() {
            that.isLoading = false;
        });
    });
};

function getCapabilities(viewModel) {
    var url = cleanAndProxyUrl(viewModel.application, viewModel.url) + '?service=WFS&version=1.1.0&request=GetCapabilities';

    return when(loadXML(url), function(xml) {
        var json = $.xml2json(xml);

        var supportsJsonGetFeature = false;

        if (defined(json.OperationsMetadata)) {
            var getFeatureOperation = findElementByName(json.OperationsMetadata.Operation, 'GetFeature');
            if (defined(getFeatureOperation)) {
                var outputFormatParameter = findElementByName(getFeatureOperation.Parameter, 'outputFormat');
                if (defined(outputFormatParameter) && defined(outputFormatParameter.Value)) {
                    supportsJsonGetFeature = outputFormatParameter.Value.indexOf('json') >= 0 ||
                                             outputFormatParameter.Value.indexOf('JSON') >= 0 ||
                                             outputFormatParameter.Value.indexOf('application/json') >= 0;
                }
            }
        }

        var dataCustodian = viewModel.dataCustodian;
        if (!defined(dataCustodian) && defined(json.ServiceProvider) && defined(json.ServiceProvider.ProviderName)) {
            dataCustodian = json.ServiceProvider.ProviderName;

            if (defined(json.ServiceProvider.ProviderSite) && defined(json.ServiceProvider.ProviderSite.href)) {
                dataCustodian = '[' + dataCustodian + '](' + json.ServiceProvider.ProviderSite.href + ')';
            }

            if (defined(json.ServiceProvider.ServiceContact) && defined(json.ServiceProvider.ServiceContact.Address) && defined(json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress)) {
                dataCustodian += '<br/>';
                dataCustodian += '[' + json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress + '](mailto:' + json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress + ')<br/>'; 
            }
        }

        if (defined(json.FeatureTypeList)) {
            addFeatureTypes(viewModel, json.FeatureTypeList.FeatureType, viewModel.items, undefined, supportsJsonGetFeature, dataCustodian);
        }
    }, function(e) {
        viewModel.application.error.raiseEvent(new ViewModelError({
            title: 'Group is not available',
            message: '\
An error occurred while invoking GetCapabilities on the WFS server.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the National \
Map team by emailing <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by \
National Map itself.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.</p>'
        }));

        viewModel.isOpen = false;
        viewModel._loadedUrl = undefined;
    });
}

function findElementByName(list, name) {
    if (!defined(list)) {
        return undefined;
    }

    for (var i = 0; i < list.length; ++i) {
        if (list[i].name === name) {
            return list[i];
        }
    }

    return undefined;
}

function cleanAndProxyUrl(application, url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');

    var cleanedUrl = uri.toString();
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(cleanedUrl)) {
        cleanedUrl = application.corsProxy.getURL(cleanedUrl, '1d');
    }

    return cleanedUrl;
}

function addFeatureTypes(viewModel, featureTypes, items, parent, supportsJsonGetFeature, dataCustodian) {
    if (!(featureTypes instanceof Array)) {
        featureTypes = [featureTypes];
    }

    for (var i = 0; i < featureTypes.length; ++i) {
        var featureType = featureTypes[i];
        items.push(createWfsDataSource(viewModel, featureType, supportsJsonGetFeature, dataCustodian));
    }
}

function createWfsDataSource(viewModel, featureType, supportsJsonGetFeature, dataCustodian) {
    var result = new WebFeatureServiceItemViewModel(viewModel.application);

    result.name = featureType.Title;
    result.description = defined(featureType.Abstract) && featureType.Abstract.length > 0 ? featureType.Abstract : viewModel.description;
    result.dataCustodian = dataCustodian;
    result.url = viewModel.url;
    result.typeNames = featureType.Name;

    result.description = '';

    var viewModelHasDescription = defined(viewModel.description) && viewModel.description.length > 0;
    var layerHasAbstract = defined(featureType.Abstract) && featureType.Abstract.length > 0;

    if (viewModelHasDescription) {
        result.description += viewModel.description;
    }

    if (viewModelHasDescription && layerHasAbstract) {
        result.description += '<br/>';
    }

    if (layerHasAbstract) {
        result.description += featureType.Abstract;
    }

    result.requestGeoJson = supportsJsonGetFeature;
    result.requestGml = true;

    var boundingBoxes = featureType.WGS84BoundingBox;

    var rectangle;
    if (boundingBoxes instanceof Array) {
        rectangle = wgs84BoundingBoxToRectangle(boundingBoxes[0]);
        for (var i = 1; i < boundingBoxes.length; ++i) {
            rectangle = unionRectangles(rectangle, wgs84BoundingBoxToRectangle(boundingBoxes[i]));
        }
    } else if (defined(boundingBoxes)) {
        rectangle = wgs84BoundingBoxToRectangle(boundingBoxes);
    } else {
        rectangle = Rectangle.MAX_VALUE;
    }

    result.rectangle = rectangle;

    return result;
}

function wgs84BoundingBoxToRectangle(boundingBox) {
    if (!defined(boundingBox)) {
        return Rectangle.MAX_VALUE;
    }

    var lowerCorner = boundingBox.LowerCorner;
    var upperCorner = boundingBox.UpperCorner;
    if (!defined(lowerCorner) || !defined(upperCorner)) {
        return Rectangle.MAX_VALUE;
    }

    var lowerCoordinates = lowerCorner.split(' ');
    var upperCoordinates = upperCorner.split(' ');
    if (lowerCoordinates.length !== 2 || upperCoordinates.length !== 2) {
        return Rectangle.MAX_VALUE;
    }

    return Rectangle.fromDegrees(lowerCoordinates[0], lowerCoordinates[1], upperCoordinates[0], upperCoordinates[1]);
}


module.exports = WebFeatureServiceGroupViewModel;
