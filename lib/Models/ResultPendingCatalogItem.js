"use strict";

/*global require*/
var CatalogItem = require("./CatalogItem");

var inherit = require("../Core/inherit");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var i18next = require("i18next").default;

/**
 * A catalog item used to represent an in-progress asynchronous function in the Now Viewing.
 *
 * @alias ResultPendingCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The terria instance.
 */
var ResultPendingCatalogItem = function(terria) {
  CatalogItem.call(this, terria);

  this.loadPromise = undefined;
  this.loadingMessage = undefined;

  knockout.track(this, ["loadingMessage"]);
};

inherit(CatalogItem, ResultPendingCatalogItem);

Object.defineProperties(ResultPendingCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf ResultPendingCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "result-pending";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'CSV'.
   * @memberOf ResultPendingCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.resultPending.name");
    }
  }
});

ResultPendingCatalogItem.prototype._load = function() {
  return this.loadPromise;
};

/**
 * Cancels the asynchronous process.
 */
ResultPendingCatalogItem.prototype.cancel = function() {};

ResultPendingCatalogItem.prototype._enable = function() {};

ResultPendingCatalogItem.prototype._disable = function() {};

ResultPendingCatalogItem.prototype._show = function() {};

ResultPendingCatalogItem.prototype._hide = function() {};

module.exports = ResultPendingCatalogItem;
