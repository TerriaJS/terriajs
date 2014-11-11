"use strict";

/*global require,ga,$*/
var BingMapsApi = require('../../third_party/cesium/Source/Core/BingMapsApi');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var Ellipsoid = require('../../third_party/cesium/Source/Core/Ellipsoid');
var jsonp = require('../../third_party/cesium/Source/Core/jsonp');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var Matrix4 = require('../../third_party/cesium/Source/Core/Matrix4');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var SceneMode = require('../../third_party/cesium/Source/Scene/SceneMode');
var when = require('../../third_party/cesium/Source/ThirdParty/when');
var createCommand = require('../../third_party/cesium/Source/Widgets/createCommand');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var corsProxy = require('../Core/corsProxy');
var runLater = require('../Core/runLater');


var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

/**
 * The view model for the {@link Geocoder} widget.
 * @alias SearchWidgetViewModel
 * @constructor
 *
 * @param {Scene} options.scene The Scene instance to use.
 * @param {String} [options.url='//dev.virtualearth.net'] The base URL of the Bing Maps API.
 * @param {String} [options.key] The Bing Maps key for your application, which can be
 *        created at {@link https://www.bingmapsportal.com}.
 *        If this parameter is not provided, {@link BingMapsApi.defaultKey} is used.
 *        If {@link BingMapsApi.defaultKey} is undefined as well, a message is
 *        written to the console reminding you that you must create and supply a Bing Maps
 *        key as soon as possible.  Please do not deploy an application that uses
 *        this widget without creating a separate key for your application.
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The Scene's primary ellipsoid.
 * @param {Number} [options.flightDuration=1500] The duration of the camera flight to an entered location, in milliseconds.
 */
var SearchWidgetViewModel = function (options) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(options) || !defined(options.viewer)) {
        throw new DeveloperError('options.scene is required.');
    }
    //>>includeEnd('debug');

    this._url = defaultValue(options.url, '//dev.virtualearth.net/');
    if (this._url.length > 0 && this._url[this._url.length - 1] !== '/') {
        this._url += '/';
    }

    this._key = BingMapsApi.getKey(options.key);
    this._viewer = options.viewer;
    this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
    this._flightDuration = defaultValue(options.flightDuration, 1500);
    this._searchText = '';
    this._searchProvider = 'bing'; //Default search provider
    this._isSearchInProgress = false;
    this._geocodeInProgress = undefined;
    this._resultsList = [];

    var that = this;
    this._searchCommand = createCommand(function () {
        that.getCurrentSearchProvider().searchCommand();
    });

    this.getCurrentSearchProvider = function() {
        var provider = null;
        for (var i = 0; i < that._searchProviders.length; i++) {
            var searchProvider = that._searchProviders[i];
            if (searchProvider.key === that._searchProvider) {
                provider = searchProvider;
                break;
            }
        }

        if(provider === null) {
            throw new DeveloperError('Specified search provider does not exist')
        }
        return provider;
    };

    that._searchProviders = [];
    var bingSearchProvider = {
        key: 'bing',
        alias: 'Bing',
        searchCommand: function () {
            if (that.isSearchInProgress) {
                cancelGeocode(that);
            } else {
                geocode(that);
            }
        },
        selectResult: function (resultItem) {

        },
        hasTypeAhead: false
    };
    that._searchProviders.push(bingSearchProvider);

    var gazetteerSearchProvider = {
        key: 'gazetteer',
        alias: 'Australian Places',
        searchCommand: function () {
            when(searchGazetteer(that), function (results) {
                gazetteerSearchProvider.selectResult(results[0]);
                that._searchText = results[0].name;
                that._resultsList = [];
            });
        },
        handleAutoComplete: function (query) {
            return searchGazetteer(that);
        },
        selectResult: function (resultItem) {
            //Server does not return information of a bounding box, just a location.
            //bboxSize is used to expand a point
            var bboxSize = 0.2;
            var locLat = resultItem.location.split(',')[0];
            var locLng = resultItem.location.split(',')[1];
            var south = parseFloat(locLat) + bboxSize / 2;
            var west = parseFloat(locLng) - bboxSize / 2;
            var north = parseFloat(locLat) - bboxSize / 2;
            var east = parseFloat(locLng) + bboxSize / 2;
            var rectangle = Rectangle.fromDegrees(west, south, east, north);
            var viewModel = that;

            if (viewModel._viewer.viewer) {
                // Cesium
                var camera = viewModel._viewer.scene.camera;
                var position = camera.getRectangleCameraCoordinates(rectangle);
                if (!defined(position)) {
                    // This can happen during a scene mode transition.
                    return;
                }

                var options = {
                    destination: position,
                    duration: viewModel._flightDuration / 1000.0,
                    complete: function () {
                        var screenSpaceCameraController = viewModel._viewer.scene.screenSpaceCameraController;
                        screenSpaceCameraController.ellipsoid = viewModel._ellipsoid;
                    },
                    endReferenceFrame: Matrix4.IDENTITY,
                    convert: false
                };

                var flight = CameraFlightPath.createTween(viewModel._viewer.scene, options);
                viewModel._viewer.scene.tweens.add(flight);
            } else {
                // Leaflet
                viewModel._viewer.map.fitBounds([
                    [south, west],
                    [north, east]
                ]);
            }
            viewModel._resultsList = [];
            viewModel.searchText = viewModel._searchText;
        },
        hasTypeAhead: true
    };

    that._searchProviders.push(gazetteerSearchProvider);

    knockout.track(this, ['_searchText', '_isSearchInProgress', '_searchProvider', '_resultsList']);

    /**
     * Gets a value indicating whether a search is currently in progress.  This property is observable.
     *
     * @type {Boolean}
     */
    this.isSearchInProgress = undefined;
    knockout.defineProperty(this, 'isSearchInProgress', {
        get: function () {
            return this._isSearchInProgress;
        }
    });

    /**
     * Gets or sets the text to search for.
     *
     * @type {String}
     */
    this.searchText = undefined;
    knockout.defineProperty(this, 'searchText', {
        get: function () {
            return this._searchText;
        },
        set: function (value) {
            //>>includeStart('debug', pragmas.debug);
            if (typeof value !== 'string') {
                throw new DeveloperError('value must be a valid string.');
            }
            //>>includeEnd('debug');
            this._searchText = value;
        }
    });

    knockout.defineProperty(this, 'searchProvider', {
        get: function () {
            return this._searchProvider;
        },
        set: function (value) {
            this._searchProvider = value;
        }
    });

    /**
     * Gets or sets the the duration of the camera flight in milliseconds.
     * A value of zero causes the camera to instantly switch to the geocoding location.
     *
     * @type {Number}
     * @default 1500
     */
    this.flightDuration = undefined;
    knockout.defineProperty(this, 'flightDuration', {
        get: function () {
            return this._flightDuration;
        },
        set: function (value) {
            //>>includeStart('debug', pragmas.debug);
            if (value < 0) {
                throw new DeveloperError('value must be positive.');
            }
            //>>includeEnd('debug');

            this._flightDuration = value;
        }
    });
    knockout.defineProperty(this,'selectSearchResults',{
        get: function () {
            return function (resultItem) {
                var provider = that.getCurrentSearchProvider();
                provider.selectResult(resultItem);
            }
        }
    });


    knockout.defineProperty(this,'autoCompleteResults', {
        get: function () {
            return function (request, response) {
                var provider = that.getCurrentSearchProvider();
                if(!provider.hasTypeAhead) {
                    return;
                }
                when(provider.handleAutoComplete(that.searchText), function(data) {
                    response(data);
                }, function (error) {
                    console.log('Error with autoComplete for search ' + provider.alias);
                    console.log(error);
                });
            }
        }
    });

    knockout.defineProperty(this,'focusAutoComplete', {
        get: function () {
            return function (event, ui) {
                that.searchText = ui.item.name;
                return false;
            };
        }
    });

    knockout.defineProperty(this, 'selectAutoComplete',{
        get: function () {
            return function (event, ui) {
                var provider = that.getCurrentSearchProvider();
                var resultItem = ui.item;
                provider.selectResult(resultItem);
                //Due to widget updating field, knockout overwrites value.
                //Below resets after knockout.
                runLater(function  () {
                    that.searchText = ui.item.name;
                });
            }
        }
    });

    knockout.defineProperty(this, 'renderAutoComplete', {
       get: function () {
        return function( ul, item ) {
            if(item.state_id) {
                return $( "<li>" )
                    .append( "<a>" + item.name + " - " + item.state_id + "</a>" )
                    .appendTo( ul );
            }
            return $( "<li>" )
                .append( "<a>" + item.name + "</a>" )
                .appendTo( ul );
        };
       }
    });

};

defineProperties(SearchWidgetViewModel.prototype, {
    /**
     * Gets the Bing maps url.
     * @memberof SearchWidgetViewModel.prototype
     *
     * @type {String}
     */
    url: {
        get: function () {
            return this._url;
        }
    },

    /**
     * Gets the Bing maps key.
     * @memberof SearchWidgetViewModel.prototype
     *
     * @type {String}
     */
    key: {
        get: function () {
            return this._key;
        }
    },

    /**
     * Gets the scene to control.
     * @memberof SearchWidgetViewModel.prototype
     *
     * @type {Scene}
     */
    viewer: {
        get: function () {
            return this._viewer;
        }
    },

    /**
     * Gets the ellipsoid to be viewed.
     * @memberof SearchWidgetViewModel.prototype
     *
     * @type {Ellipsoid}
     */
    ellipsoid: {
        get: function () {
            return this._ellipsoid;
        }
    },

    /**
     * Gets the Command that is executed when the button is clicked.
     * @memberof SearchWidgetViewModel.prototype
     *
     * @type {Command}
     */
    search: {
        get: function () {
            return this._searchCommand;
        }
    },

    resultsList: {
        get: function () {
            return this._resultsList;
        }
    },
    displayResults: {
        get: function () {
            return this._resultsList.length > 0;
        }
    }
});

function searchGazetteer(viewModel, selectFirst) {
    var query = viewModel.searchText;

    if (/^\s*$/.test(query)) {
        //whitespace string
        return;
    }

    ga('send', 'event', 'search', 'start', query);

    viewModel._isSearchInProgress = true;
    var url = 'http://www.ga.gov.au/gazetteer-search/select/?q=name:*' + query + '*';
    url = corsProxy.getURL(url);
    var deferred = when.defer();
    when(loadXML(url), function (solarQueryResponse) {
        var json = $.xml2json(solarQueryResponse);
        if (defined(json.result) && json.result.numFound > 0) {
            viewModel._resultsList = _parseSolrResults(json.result.doc, ['name', 'location', 'state_id']);
        } else {
            viewModel._resultsList = [{name:'No results...',numFound:0}];
        }
        viewModel._isSearchInProgress = false;

        deferred.resolve(viewModel._resultsList);
    }, function (error) {
        viewModel._resultsList = [];
        viewModel._resultsList.push({name: 'There was a problem with search...'})
        deferred.reject(error);
    });
    return deferred.promise;
}

/**
 * Parses the xml2json result from a Solr query into an object with properties of interest
 *
 * Solr returns a very generic document making it ugly to parse.
 * valueTypes is defaulted as just containing 'str' as this is the default Solr schema.
 */
function _parseSolrResults(docs, keysOfInterest, valueTypes) {
    var results = [];
    if(docs == null) {
        return results;
    }
    valueTypes = valueTypes || ['str'];
    for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];
        for (var valueTypesIndex = 0; valueTypesIndex < valueTypes.length; valueTypesIndex++) {
            var valueType = valueTypes[valueTypesIndex];
            if (!defined(valueType)) {
                continue;
            }
            var resultObj = {};
            var validResult = false;
            for (var k = 0; k < keysOfInterest.length; k++) {
                var key = keysOfInterest[k];
                for (var j = 0; j < doc[valueType].length > 0; j++) {
                    var singleResult = doc[valueType][j];
                    if (singleResult.name === key) {
                        validResult = true;
                        resultObj[key] = singleResult.text;
                    }
                }
            }
            if (validResult) {
                results.push(resultObj);
            }
        }
    }
    return results;
}

function geocode(viewModel) {
    var query = viewModel.searchText;

    if (/^\s*$/.test(query)) {
        //whitespace string
        return;
    }

    ga('send', 'event', 'search', 'start', query);

    viewModel._isSearchInProgress = true;
    viewModel._searchText = 'Searching...'
    var longitudeDegrees;
    var latitudeDegrees;

    if (viewModel._viewer.scene) {
        var cameraPosition = viewModel._viewer.scene.camera.positionWC;
        var cameraPositionCartographic = Ellipsoid.WGS84.cartesianToCartographic(cameraPosition);
        longitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.longitude);
        latitudeDegrees = CesiumMath.toDegrees(cameraPositionCartographic.latitude);
    } else {
        var center = viewModel._viewer.map.getCenter();
        longitudeDegrees = center.lng;
        latitudeDegrees = center.lat;
    }

    var promise = jsonp(viewModel._url + 'REST/v1/Locations?culture=en-AU&userLocation=' + latitudeDegrees + ',' + longitudeDegrees , {
        parameters : {
            query : query,
            key : viewModel._key
        },
        callbackParameterName: 'jsonp'
    });

    var geocodeInProgress = viewModel._geocodeInProgress = when(promise, function (result) {
        if (geocodeInProgress.cancel) {
            return;
        }
        viewModel._isSearchInProgress = false;
        viewModel._searchText = query;
        if (result.resourceSets.length === 0) {
            viewModel.searchText = viewModel._searchText + ' (not found)';
            return;
        }

        var resourceSet = result.resourceSets[0];
        if (resourceSet.resources.length === 0) {
            viewModel.searchText = viewModel._searchText + ' (not found)';
            return;
        }

        var resource = resourceSet.resources[0];

        // Prefer the resource that is in Australia, if any.
        for (var i = 0; i < resourceSet.resources.length; ++i) {
            resource = resourceSet.resources[i];
            if (defined(resource.address) && resource.address.countryRegion === 'Australia') {
                resource = resourceSet.resources[i];
                break;
            }
        }
        viewModel._searchText = resource.name;
        var bbox = resource.bbox;
        var south = bbox[0];
        var west = bbox[1];
        var north = bbox[2];
        var east = bbox[3];
        var rectangle = Rectangle.fromDegrees(west, south, east, north);

        if (viewModel._viewer.viewer) {
            // Cesium
            var camera = viewModel._viewer.scene.camera;
            var position = camera.getRectangleCameraCoordinates(rectangle);
            if (!defined(position)) {
                // This can happen during a scene mode transition.
                return;
            }

            var options = {
                destination: position,
                duration: viewModel._flightDuration / 1000.0,
                complete: function () {
                    var screenSpaceCameraController = viewModel._viewer.scene.screenSpaceCameraController;
                    screenSpaceCameraController.ellipsoid = viewModel._ellipsoid;
                },
                endReferenceFrame: Matrix4.IDENTITY,
                convert: false
            };

            var flight = CameraFlightPath.createTween(viewModel._viewer.scene, options);
            viewModel._viewer.scene.tweens.add(flight);
        } else {
            // Leaflet
            viewModel._viewer.map.fitBounds([
                [south, west],
                [north, east]
            ]);
        }
    }, function () {
        if (geocodeInProgress.cancel) {
            return;
        }

        viewModel._isSearchInProgress = false;
        viewModel.searchText = viewModel._searchText + ' (error)';
    });
}

function cancelGeocode(viewModel) {
    ga('send', 'event', 'search', 'cancel');

    viewModel._isSearchInProgress = false;
    if (defined(viewModel._geocodeInProgress)) {
        viewModel._geocodeInProgress.cancel = true;
        viewModel._geocodeInProgress = undefined;
    }
}

function cancelGazetteer(viewModel) {
    ga('send', 'event', 'search', 'cancel');

    viewModel._isSearchInProgress = false;
    viewModel._resultsList = [];
}

module.exports = SearchWidgetViewModel;
