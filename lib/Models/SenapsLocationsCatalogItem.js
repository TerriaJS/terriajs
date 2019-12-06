"use strict";

/*global require*/
var URI = require("urijs");
var defined = require("terriajs-cesium/Source/Core/defined").default;
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties")
  .default;

var inherit = require("../Core/inherit");
var DataSourceCatalogItem = require("./DataSourceCatalogItem");
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var loadJson = require("../Core/loadJson");

/**
 * A {@link DataSourceCatalogItem} representing Senaps locations data.
 *
 * @alias SenapsLocationsCatalogItem
 * @constructor
 * @extends DataSourceCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the GeoJSON data.
 */
var SenapsLocationsCatalogItem = function(terria, url) {
  DataSourceCatalogItem.call(this, terria);

  /**
   * The url of the senaps locations, must include the apikey param
   * eg https://senaps.io/api/sensor/v2/locations?apikey=1234
   * @type {String}
   */
  this.url = url;

  /**
   * A regex string to filter locations using the id field,
   * locations matching the filter will be included.
   * @type {String}
   */
  this.idRegexFilter = undefined;

  /**
   * Gets or sets an object of style information which will be used instead of the default, but won't override
   * styles set on individual GeoJSON features. Styles follow the SimpleStyle spec: https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
   * `marker-opacity` and numeric values for `marker-size` are also supported.
   * @type {Object}
   */
  this.style = undefined;

  this._geoJsonItem = undefined;
};

inherit(DataSourceCatalogItem, SenapsLocationsCatalogItem);

defineProperties(SenapsLocationsCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf SenapsLocationsCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "senaps-locations";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'Senaps'.
   * @memberOf SenapsLocationsCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "Senaps Locations";
    }
  },

  /**
   * Gets the data source associated with this catalog item.
   * @memberOf SenapsLocationsCatalogItem.prototype
   * @type {DataSource}
   */
  dataSource: {
    get: function() {
      return this._geoJsonItem._dataSource;
    }
  }
});

SenapsLocationsCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url];
};

SenapsLocationsCatalogItem.prototype._load = function() {
  this._geoJsonItem = new GeoJsonCatalogItem(this.terria);
  this._geoJsonItem.clampToGround = true;
  this._geoJsonItem.style = this.style;
  const that = this;

  const cleanedUrl = cleanUrl(this.url);

  return loadJson(cleanedUrl).then(function(json) {
    if (defined(that.idRegexFilter)) {
      var patt = new RegExp(that.idRegexFilter);
      json._embedded.locations = json._embedded.locations.filter(function(
        site
      ) {
        return patt.test(site.id);
      });
    }
    that._geoJsonItem.data = {
      type: "FeatureCollection",
      features: json._embedded.locations.map(function(site) {
        return {
          type: "Feature",
          properties: {
            id: site.id,
            description: site.description,
            endpoint: site._links.self.href
          },
          geometry: site.geojson
        };
      })
    };
    that.featureInfoTemplate = defined(that.featureInfoTemplate)
      ? that.featureInfoTemplate
      : `
       <h4>{{description}}</h4>
       <p>id: {{id}}</p>
       <p>{{endpoint}}</p>
    `;
    return that._geoJsonItem.load();
  });
};

SenapsLocationsCatalogItem.prototype._enable = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._enable();
  }
};

SenapsLocationsCatalogItem.prototype._disable = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._disable();
  }
};

SenapsLocationsCatalogItem.prototype._show = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._show();
  }
};

SenapsLocationsCatalogItem.prototype._hide = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._hide();
  }
};

SenapsLocationsCatalogItem.prototype.showOnSeparateMap = function(globeOrMap) {
  if (defined(this._geoJsonItem)) {
    return this._geoJsonItem.showOnSeparateMap(globeOrMap);
  }
};

function cleanUrl(url) {
  var uri = new URI(url);
  uri.setSearch("count", 1000);
  uri.setSearch("expand", true);
  return uri.toString();
}

module.exports = SenapsLocationsCatalogItem;
