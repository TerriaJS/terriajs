"use strict";

/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var DataSourceCatalogItem = require("./DataSourceCatalogItem");
var Metadata = require("./Metadata");
var TerriaError = require("../Core/TerriaError");
var inherit = require("../Core/inherit");
var promiseFunctionToExplicitDeferred = require("../Core/promiseFunctionToExplicitDeferred");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var readJson = require("../Core/readJson");
var i18next = require("i18next").default;

/**
 * A {@link CatalogItem} representing Cesium Language (CZML) data.
 *
 * @alias CzmlCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the CZML data.
 */
var CzmlCatalogItem = function(terria, url) {
  DataSourceCatalogItem.call(this, terria);

  this._dataSource = undefined;

  this.url = url;

  /**
   * Gets or sets the CZML data, represented as a binary Blob, JSON object or array literal, or a Promise for one of those things.
   * If this property is set, {@link CatalogItem#url} is ignored.
   * This property is observable.
   * @type {Blob|Object|Promise|Array}
   */
  this.data = undefined;

  /**
   * Gets or sets the URL from which the {@link CzmlCatalogItem#data} was obtained.  This will be used
   * to resolve any resources linked in the CZML file, if any.
   * @type {String}
   */
  this.dataSourceUrl = undefined;

  knockout.track(this, ["data", "dataSourceUrl"]);
};

inherit(DataSourceCatalogItem, CzmlCatalogItem);

Object.defineProperties(CzmlCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf CzmlCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "czml";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'Cesium Language (CZML)'.
   * @memberOf CzmlCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.czml.name");
    }
  },

  /**
   * Gets the metadata associated with this data source and the server that provided it, if applicable.
   * @memberOf CzmlCatalogItem.prototype
   * @type {Metadata}
   */
  metadata: {
    get: function() {
      var result = new Metadata();
      result.isLoading = false;
      result.dataSourceErrorMessage = i18next.t(
        "models.czml.dataSourceErrorMessage"
      );
      result.serviceErrorMessage = i18next.t("models.czml.serviceErrorMessage");
      return result;
    }
  },
  /**
   * Gets the data source associated with this catalog item.
   * @memberOf CzmlCatalogItem.prototype
   * @type {DataSource}
   */
  dataSource: {
    get: function() {
      return this._dataSource;
    }
  }
});

CzmlCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.data];
};

CzmlCatalogItem.prototype._load = function() {
  var codeSplitDeferred = when.defer();

  var that = this;
  require.ensure(
    "terriajs-cesium/Source/DataSources/CzmlDataSource",
    function() {
      var CzmlDataSource = require("terriajs-cesium/Source/DataSources/CzmlDataSource")
        .default;

      promiseFunctionToExplicitDeferred(codeSplitDeferred, function() {
        // If there is an existing data source, remove it first.
        var reAdd = false;
        if (defined(that._dataSource)) {
          reAdd = that.terria.dataSources.remove(that._dataSource, true);
        }

        var dataSource = new CzmlDataSource();
        that._dataSource = dataSource;

        if (reAdd) {
          that.terria.dataSources.add(that._dataSource);
        }

        if (defined(that.data)) {
          return when(that.data, function(data) {
            if (typeof Blob !== "undefined" && data instanceof Blob) {
              return readJson(data)
                .then(function(data) {
                  return dataSource
                    .load(
                      data,
                      proxyCatalogItemUrl(that, that.dataSourceUrl, "1d")
                    )
                    .then(function() {
                      doneLoading(that);
                    });
                })
                .otherwise(function() {
                  errorLoading(that);
                });
            } else if (data instanceof String || typeof data === "string") {
              return dataSource
                .load(
                  JSON.parse(data),
                  proxyCatalogItemUrl(that, that.dataSourceUrl, "1d")
                )
                .then(function() {
                  doneLoading(that);
                });
            } else {
              return dataSource
                .load(data, proxyCatalogItemUrl(that, that.dataSourceUrl, "1d"))
                .then(function() {
                  doneLoading(that);
                });
            }
          }).otherwise(function() {
            errorLoading(that);
          });
        } else {
          return dataSource
            .load(proxyCatalogItemUrl(that, that.url, "1d"))
            .then(function() {
              doneLoading(that);
            })
            .otherwise(function() {
              errorLoading(that);
            });
        }
      });
    },
    "Cesium-DataSources"
  );

  return codeSplitDeferred.promise;
};

function doneLoading(czmlItem) {
  czmlItem.clock = czmlItem._dataSource.clock;
  czmlItem.terria.currentViewer.notifyRepaintRequired();
}

function errorLoading(czmlItem) {
  var terria = czmlItem.terria;
  throw new TerriaError({
    sender: czmlItem,
    title: i18next.t("models.czml.errorLoadingTitle"),
    message: i18next.t("models.czml.errorLoadingMessage", {
      appName: terria.appName,
      email:
        '<a href="mailto:' +
        terria.supportEmail +
        '">' +
        terria.supportEmail +
        "</a>."
    })
  });
}

module.exports = CzmlCatalogItem;
