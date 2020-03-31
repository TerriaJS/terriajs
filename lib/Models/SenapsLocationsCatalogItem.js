"use strict";

/*global require*/
var URI = require("urijs");
var defined = require("terriajs-cesium/Source/Core/defined").default;
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties")
  .default;
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");

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
 */
var SenapsLocationsCatalogItem = function(terria) {
  DataSourceCatalogItem.call(this, terria);

  /**
   * A string to filter locations using the id field,
   * locations matching the filter will be included.
   * @type {String}
   */
  this.idFilter = undefined;

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
  return [];
};

SenapsLocationsCatalogItem.prototype._load = function() {
  this._geoJsonItem = new GeoJsonCatalogItem(this.terria);
  this._geoJsonItem.clampToGround = true;
  this._geoJsonItem.style = this.style;
  const that = this;

  const cleanedUrl = cleanUrl(this.idFilter);

  return loadJson(proxyCatalogItemUrl(that, cleanedUrl, "0d")).then(function(
    json
  ) {
    const promises = [];
    for (var i = 0; i < json._embedded.locations.length; i++) {
      const location = json._embedded.locations[i];
      const locationId = location.id;
      const streamUrl = getStreamsUrl(locationId);
      promises.push(loadJson(proxyCatalogItemUrl(that, streamUrl, "0d")));
    }

    return Promise.all(promises).then(function(values) {
      values.forEach(function(j, i) {
        if (!j._embedded) {
          json._embedded.locations[i].streamIds = [];
        } else {
          json._embedded.locations[i].streamIds = j._embedded.streams.map(
            s => s.id
          );
        }
      });
      that._geoJsonItem.data = {
        type: "FeatureCollection",
        features: json._embedded.locations.map(function(site) {
          return {
            type: "Feature",
            properties: {
              id: site.id,
              description: site.description,
              endpoint: site._links.self.href,
              streamIds: site.streamIds,
              streamId: site.streamIds[0]
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

function cleanUrl(idFilter) {
  var uri = new URI("https://senaps.io/api/sensor/v2/locations");
  if (idFilter !== undefined) {
    uri.setSearch("id", `*${idFilter}*`);
  }
  uri.setSearch("count", 1000);
  uri.setSearch("expand", true);
  return uri.toString();
}

function getStreamsUrl(locationid) {
  var uri = new URI("https://senaps.io/api/sensor/v2/streams");
  uri.setSearch("id", "*SHT31DIS_ALL*");
  uri.setSearch("locationid", locationid);
  return uri.toString();
}

module.exports = SenapsLocationsCatalogItem;
