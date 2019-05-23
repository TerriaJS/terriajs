'use strict';

/*global require*/
var URI = require('urijs');
var Mustache = require('mustache');

var combine = require('terriajs-cesium/Source/Core/combine');
var clone = require('terriajs-cesium/Source/Core/clone');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('../Core/loadJson');
var loadXML = require('../Core/loadXML');

var GeoJsonCatalogItem = require('./GeoJsonCatalogItem');
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var gmlToGeoJson = require('../Map/gmlToGeoJson');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var TerriaError = require('../Core/TerriaError');
var xml2json = require('../ThirdParty/xml2json');

/**
 * A {@link CatalogItem} representing a layer from a Web Feature Service (WFS) server.
 *
 * @alias WebFeatureServiceCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var WebFeatureServiceCatalogItem = function(terria) {
     CatalogItem.call(this, terria);

    this._dataUrl = undefined;
    this._dataUrlType = undefined;
    this._metadataUrl = undefined;
    this._geoJsonItem = undefined;

    /**
     * Gets or sets the WFS feature type names.
     * @type {String}
     */
    this.typeNames = '';

    /**
     * Gets or sets a value indicating whether we should request GeoJSON from the WFS server.  If this property
     * and {@link WebFeatureServiceCatalogItem#requestGeoJson} are both true, we'll request GeoJSON first and
     * only fall back on trying GML if the GeoJSON request fails.
     * @type {Boolean}
     * @default true
     */
    this.requestGeoJson = true;

    /**
     * Gets or sets a value indicating whether we should request GML from the WFS server.  If this property
     * and {@link WebFeatureServiceCatalogItem#requestGeoJson} are both true, we'll request GeoJSON first and
     * only fall back on trying GML if the GeoJSON request fails.
     * @type {Boolean}
     * @default true
     */
    this.requestGml = true;

    /**
     * Gets or sets the additional parameters to pass to the WFS server when requesting geometry.
     * All parameter names must be entered in lowercase in order to be consistent with references in TerrisJS code.
     * @type {Object}
     */
    this.parameters = {};

    knockout.track(this, ['_dataUrl', '_dataUrlType', '_metadataUrl', 'typeNames', 'requestGeoJson', 'requestGml']);

    // dataUrl, metadataUrl, and legendUrl are derived from url if not explicitly specified.
    overrideProperty(this, 'dataUrl', {
        get : function() {
            var url = this._dataUrl;
            if (!defined(url)) {
                url = this.url;
            }

            if (this.dataUrlType === 'wfs') {
                url = new URI(cleanUrl(url))
                    .setQuery(combine({
                        'service': 'WFS',
                        'version': '1.1.0',
                        'request': 'GetFeature',
                        'typeName': this.typeNames,
                        'srsName': 'EPSG:4326',
                        'maxFeatures': '1000'
                    }, this.parameters))
                    .toString();
            }

            return url;
        },
        set : function(value) {
            this._dataUrl = value;
        }
    });

    overrideProperty(this, 'dataUrlType', {
        get : function() {
            if (defined(this._dataUrlType)) {
                return this._dataUrlType;
            } else {
                return 'wfs';
            }
        },
        set : function(value) {
            this._dataUrlType = value;
        }
    });

    overrideProperty(this, 'metadataUrl', {
        get : function() {
            if (defined(this._metadataUrl)) {
                return this._metadataUrl;
            }

            return new URI(cleanUrl(this.url))
                .setQuery(combine({
                    service: 'WFS',
                    version: '1.1.0',
                    request: 'GetCapabilities'
                    }, this.parameters))
                .toString();
        },
        set : function(value) {
            this._metadataUrl = value;
        }
    });
};

WebFeatureServiceCatalogItem.getFeatureByLikeQuery = require('./WebFeatureServiceFilterLikeTemplate.xml');
inherit(CatalogItem, WebFeatureServiceCatalogItem);

defineProperties(WebFeatureServiceCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf WebFeatureServiceCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wfs';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Web Feature Service (WFS)'.
     * @memberOf WebFeatureServiceCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Feature Service (WFS)';
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf WebFeatureServiceCatalogItem.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return WebFeatureServiceCatalogItem.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object literal,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf WebFeatureServiceCatalogItem.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return WebFeatureServiceCatalogItem.defaultSerializers;
        }
    },
    /**
     * Gets the data source associated with this catalog item.
     * @memberOf WebFeatureServiceCatalogItem.prototype
     * @type {DataSource}
     */
    dataSource : {
        get : function() {
            return defined(this._geoJsonItem) ? this._geoJsonItem.dataSource : undefined;
        }
    }
});

WebFeatureServiceCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);
freezeObject(WebFeatureServiceCatalogItem.defaultUpdaters);

WebFeatureServiceCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

// Serialize the underlying properties instead of the public views of them.
WebFeatureServiceCatalogItem.defaultSerializers.dataUrl = function(wfsItem, json, propertyName) {
    json.dataUrl = wfsItem._dataUrl;
};
WebFeatureServiceCatalogItem.defaultSerializers.dataUrlType = function(wfsItem, json, propertyName) {
    json.dataUrlType = wfsItem._dataUrlType;
};
WebFeatureServiceCatalogItem.defaultSerializers.metadataUrl = function(wfsItem, json, propertyName) {
    json.metadataUrl = wfsItem._metadataUrl;
};
freezeObject(WebFeatureServiceCatalogItem.defaultSerializers);

WebFeatureServiceCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.typeNames, this.requestGeoJson, this.requestGml, this.parameters];
};

WebFeatureServiceCatalogItem.prototype._load = function() {
    this._geoJsonItem = new GeoJsonCatalogItem(this.terria);

    var promise;
    if (this.requestGeoJson) {
        promise = loadGeoJson(this);
    } else if (this.requestGml) {
        promise = loadGml(this);
    } else {
        return;
    }

    this._geoJsonItem.data = promise;

    var that = this;
    return that._geoJsonItem.load().then(function() {
        that.rectangle = that._geoJsonItem.rectangle;
    });
};

WebFeatureServiceCatalogItem.prototype._enable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._enable();
    }
};

WebFeatureServiceCatalogItem.prototype._disable = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._disable();
    }
};

WebFeatureServiceCatalogItem.prototype._show = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._show();
    }
};

WebFeatureServiceCatalogItem.prototype._hide = function() {
    if (defined(this._geoJsonItem)) {
        this._geoJsonItem._hide();
    }
};

WebFeatureServiceCatalogItem.prototype.showOnSeparateMap = function(globeOrMap) {
    if (defined(this._geoJsonItem)) {
        return this._geoJsonItem.showOnSeparateMap(globeOrMap);
    }
};

WebFeatureServiceCatalogItem.prototype.getDescribeFeatureType = function() {
    this.describeFeatureUrl = buildDescribeFeatureTypeUrl(this);
    const that = this;

    return new Promise(function(resolve, reject) {
        loadDescribeFeature(that)
        .then(function(response) {
            that.describeFeatureInfo = response;
            that.fields = response.complexType.complexContent.extension.sequence.element.map(field => {
                return field.name;
            });
            resolve();
        })
        .otherwise(function (err) {
            reject();
        });
    });
};

WebFeatureServiceCatalogItem.prototype.searchDataForMatchingFeatures = function(searchText, regex) {
    const that = this;
    return new Promise(function(resolve, reject) {
        
        // When we're searching a WFS which has been added directly as a catalog item
        if (defined(that.parent) && defined(that._geoJsonItem.data)) {
            that.fields = Object.keys(that._geoJsonItem.data.features[0].properties);
            resolve(searchGeoJson(that, regex));

        } else {

            // When we're searching a WFS linked to a WMS for the first time
            if (!defined(that.fields) ) {
                that.getDescribeFeatureType()
                .then(function () {
                    prepareForSearch(that, searchText)
                    .then(function() {
                        resolve(searchGeoJson(that, regex));
                    })
                    .catch(function () {
                        resolve([]);
                    });
                });
            } else {
                // If we're searching a WFS linked to a WMS subsequent times
                prepareForSearch(that, searchText)
                .then(function() {
                    resolve(searchGeoJson(that, regex));
                })
                .catch(function () {
                    resolve([]);
                });
            }
        }
    });
};

function createLikeFilterTemplate (fields, query) {
    return Mustache.render(WebFeatureServiceCatalogItem.getFeatureByLikeQuery, {
        fields: fields,
        query: query
    });
}

function prepareForSearch (wfsItem, searchText) {
    wfsItem.updateFromJson({
        parameters: {
            filter: createLikeFilterTemplate(wfsItem.fields, searchText)
        }
    });
    return new Promise(function(resolve, reject) {
        wfsItem.load()
        .then(function () {
            resolve();
        })
        .otherwise(function (err) {
            resolve();
        });
    });  }

function searchGeoJson(wfsItem, regex) {
    if (!defined(wfsItem._geoJsonItem.data) && wfsItem._geoJsonItem.data.features.length === 0) return [];
    const matches = [];
    wfsItem._geoJsonItem.data.features.forEach(f => {
        for (var ii = 0; ii < wfsItem.fields.length; ii++) {
            if (regex.test(f.properties[wfsItem.fields[ii]])) {
                matches.push({
                    matchType: 'WFS',
                    workbenchItem: wfsItem,
                    feature: f,
                    matchFieldText: f.properties[wfsItem.fields[ii]]
                });
                break;
            }
        }
    });
    return matches;
}

function loadGeoJson(wfsItem) {
    var promise = loadJson(buildGeoJsonUrl(wfsItem)).then(function(json) {
        return json;
    });

    if (wfsItem.requestGml) {
        promise = promise.otherwise(function() {
            return loadGml(wfsItem);
        });
    }

    return promise;
}

function loadGml(wfsItem) {
    return loadXML(buildGmlUrl(wfsItem)).then(function(xml) {
        return gmlToGeoJson(xml);
    });
}

function buildGeoJsonUrl(wfsItem) {
    var url = cleanAndProxyUrl(wfsItem, wfsItem.url);
    return new URI(url)
        .setQuery(combine({
            service: 'WFS',
            request: 'GetFeature',
            typeName: wfsItem.typeNames,
            version: '1.1.0',
            outputFormat: 'JSON',
            srsName: 'EPSG:4326'
            }, wfsItem.parameters))
        .toString();
}

function buildGmlUrl(wfsItem) {
    var url = cleanAndProxyUrl(wfsItem, wfsItem.url);
    return new URI(url)
        .setQuery(combine({
        service: 'WFS',
        request: 'GetFeature',
        typeName: wfsItem.typeNames,
        version: '1.1.0',
        srsName: 'EPSG:4326'
        }, wfsItem.parameters))
        .toString();
}

function loadDescribeFeature(wfsItem) {
    return loadXML(wfsItem.describeFeatureUrl)
    .then(function(xml) {
        return xml2json(xml);
    })
    .otherwise(function(err) {
        wfsItem.terria.error.raiseEvent(new TerriaError({
            title: 'DescribeFeatureType error',
            message: err
            }));
        });
}

function buildDescribeFeatureTypeUrl(wfsItem) {
    var url = cleanAndProxyUrl(wfsItem, wfsItem.url);
    return new URI(url)
        .setQuery(combine({
        service: 'WFS',
        request: 'DescribeFeatureType',
        typeName: wfsItem.typeNames,
        version: '1.1.0',
        srsName: 'EPSG:4326'
        }, wfsItem.parameters))
        .toString();
}

function cleanAndProxyUrl(catalogItem, url) {
    return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

module.exports = WebFeatureServiceCatalogItem;
