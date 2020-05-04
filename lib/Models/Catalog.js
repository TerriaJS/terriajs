"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var CsvCatalogItem = require("./CsvCatalogItem");
var CatalogGroup = require("./CatalogGroup");
var USER_ADDED_CATEGORY_NAME = require("../Core/addedByUser")
  .USER_ADDED_CATEGORY_NAME;
var CHART_DATA_CATEGORY_NAME = require("../Core/addedForCharts")
  .CHART_DATA_CATEGORY_NAME;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var i18next = require("i18next").default;

/**
 * The view model for the data catalog.
 *
 * @param {Terria} terria The Terria instance.
 *
 * @alias Catalog
 * @constructor
 */
var Catalog = function(terria) {
  if (!defined(terria)) {
    throw new DeveloperError("terria is required");
  }

  this._terria = terria;
  this._shareKeyIndex = {};

  this._group = new CatalogGroup(terria);
  this._group.name = "Root Group";
  this._group.preserveOrder = true;

  /**
   * Gets or sets a flag indicating whether the catalog is currently loading.
   * @type {Boolean}
   */
  this.isLoading = false;

  this._chartableItems = [];

  knockout.track(this, ["isLoading", "_chartableItems"]);

  knockout.defineProperty(this, "userAddedDataGroup", {
    get: this.upsertCatalogGroup.bind(
      this,
      CatalogGroup,
      USER_ADDED_CATEGORY_NAME,
      i18next.t("models.catalog.userAddedDataGroup")
    )
  });

  knockout.defineProperty(this, "chartDataGroup", {
    get: this.upsertCatalogGroup.bind(
      this,
      CatalogGroup,
      CHART_DATA_CATEGORY_NAME,
      i18next.t("models.catalog.chartDataGroup")
    )
  });

  /**
   * Array of the items that should be shown as a chart.
   */
  knockout.defineProperty(this, "chartableItems", {
    get: function() {
      return this._chartableItems;
    }
  });
};

Object.defineProperties(Catalog.prototype, {
  /**
   * Gets the Terria instance.
   * @memberOf Catalog.prototype
   * @type {Terria}
   */
  terria: {
    get: function() {
      return this._terria;
    }
  },

  /**
   * Gets the catalog's top-level group.
   * @memberOf Catalog.prototype
   * @type {CatalogGroup}
   */
  group: {
    get: function() {
      return this._group;
    }
  },

  /**
   * A flat index of all catalog member in this catalog by their share keys. Because items can have multiple share keys
   * to preserve backwards compatibility, multiple entries in this index will lead to the same catalog member.
   *
   * @type {Object}
   */
  shareKeyIndex: {
    get: function() {
      return this._shareKeyIndex;
    }
  }
});

/**
 * Updates the catalog from a JSON object-literal description of the available collections.
 * Existing collections with the same name as a collection in the JSON description are
 * updated.  If the description contains a collection with a name that does not yet exist,
 * it is created.  Because parts of the update may happen asynchronously, this method
 * returns at Promise that will resolve when the update is completely done.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 * @param {Object} [options] Object with the following properties:
 * @param {Boolean} [options.onlyUpdateExistingItems] true to only update existing items and never create new ones, or false is new items
 *                                                    may be created by this update.
 * @param {Boolean} [options.isUserSupplied] If specified, sets the {@link CatalogMember#isUserSupplied} property of updated catalog members
 *                                           to the given value.  If not specified, the property is left unchanged.
 * @returns {Promise} A promise that resolves when the update is complete.
 */
Catalog.prototype.updateFromJson = function(json, options) {
  var that = this;
  options = defaultValue(options, {});

  return CatalogGroup.updateItems(json, options, this.group).then(function() {
    that.terria.nowViewing.sortByNowViewingIndices();
  });
};

/**
 * Serializes the catalog to JSON.
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Function} [options.propertyFilter] Filter function that will be executed to determine whether a property
 *          should be serialized.
 * @param {Function} [options.itemFilter] Filter function that will be executed for each item in a group to determine
 *          whether that item should be serialized.
 * @return {Object} The serialized JSON object-literal.
 */
Catalog.prototype.serializeToJson = function(options) {
  this.terria.nowViewing.recordNowViewingIndices();

  return this.group.serializeToJson(options).items;
};

/**
 * Resolves items in the catalog based on the share keys provided, and updates them with the passed info and
 * enables them along with all their ancestors in the catalog hierarchy. This is asynchronous as it may involve a number
 * of CatalogItem#load calls.
 *
 * Note that because of the lazily-loaded nature of the catalog, items within it may not be resolvable by shareKey until
 * their parents have loaded. As a result this loads sharedObjects in serial from left to right. If a catalog member is the
 * child of an asynchronously-loaded catalog group (like a ckan or socrata group), then that group's shareKey precede the
 * child member.
 *
 * @param {Object} sharedObjects A flat map of string-based share keys with data to update on the resolved object. It is
 *      possible to pass an empty object if nothing needs updating.
 * @returns {Promise} A promise that will resolve when all the items have been loaded and enabled.
 */
Catalog.prototype.updateByShareKeys = function(sharedObjects) {
  const that = this;

  return Object.keys(sharedObjects)
    .reduce(
      function(aggregatedPromise, shareKey) {
        var itemJson = sharedObjects[shareKey];

        return aggregatedPromise
          .then(this._loadInSerial.bind(this, itemJson.parents || []))
          .then(this._updateAndEnable.bind(this, shareKey, itemJson));
      }.bind(this),
      when()
    )
    .then(() => {
      that.terria.nowViewing.sortByNowViewingIndices();
    });
};

/**
 * Calls {@link CatalogMember#load} on a number of catalog members, identified by their share key, one after the other
 * from left to right. Doing this in serial is important because sometimes calling load() on a catalog group will
 * reveal more catalog items under it, which will be added to the catalog's shareKeyIndex - if these were done in
 * parallel, share keys towards the right of the array would not able to be resolved at all.
 *
 * @param shareKeys An array of catalog member share keys to use for resolving catalog members from the catalog
 * @returns {Promise} A promise that will be resolved when all the catalog members have either loaded or failed to load.
 * @private
 */
Catalog.prototype._loadInSerial = function(shareKeys) {
  return shareKeys.reduce(
    function(aggregatedPromise, shareKey) {
      return aggregatedPromise.then(
        function() {
          if (this.shareKeyIndex[shareKey]) {
            return this.shareKeyIndex[shareKey].load();
          }
        }.bind(this)
      );
    }.bind(this),
    when()
  );
};

/**
 * Finds the an item in the catalog with the passed shareKey, updates it with the passed itemJson, THEN calls load on
 * the item, THEN enables it and all its parents. If no item for the passed shareKey can be found, logs a warning but
 * proceeds without an exception.
 *
 * @returns {Promise} A promise that will be resolved when all of this is done.
 * @private
 */
Catalog.prototype._updateAndEnable = function(shareKey, itemJson) {
  var existingMember = this.shareKeyIndex[shareKey];
  if (existingMember) {
    // Update THEN load is the expected behaviour for some catalog items (e.g. CSV) - if these operations aren't
    // executed in this order then bugs happen in auto-generated legends.

    return existingMember
      .updateFromJson(itemJson)
      .then(existingMember.load.bind(existingMember))
      .then(existingMember.enableWithParents.bind(existingMember));
  } else if (
    itemJson.isCsvForCharting === true &&
    (defined(itemJson.url) || defined(itemJson.dataUrl))
  ) {
    return CsvCatalogItem.regenerateChartItem(itemJson, this.terria);
  } else {
    console.warn(
      "Share link has a catalog member with shareKey " +
        shareKey +
        " but could not find " +
        "this in the catalog"
    );
  }
};

/**
 * If a catalog group exists with this name, update it, otherwise create it.
 * @param  {Function} CatalogGroupConstructor The constructor function for the catalog group (typically CatalogGroup).
 * @param  {String} name        The catalog group's name.
 * @param  {String} description The catalog group's description.
 * @return {CatalogGroup}       The new or updated catalog group.
 */
Catalog.prototype.upsertCatalogGroup = function(
  CatalogGroupConstructor,
  name,
  description
) {
  var group;
  var groups = this.group.items;
  for (var i = 0; i < groups.length; ++i) {
    group = groups[i];
    if (group.name === name) {
      return group;
    }
  }
  group = new CatalogGroupConstructor(this.terria);
  group.name = name;
  group.description = description;
  group.isUserSupplied = true;
  this.group.add(group);
  return group;
};

Catalog.prototype.addChartableItem = function(item) {
  if (this._chartableItems.indexOf(item) === -1) {
    this._chartableItems.push(item);
  }
};

Catalog.prototype.removeChartableItem = function(item) {
  const index = this._chartableItems.indexOf(item);
  if (index >= 0) {
    this._chartableItems.splice(index, 1);
  }
};

module.exports = Catalog;
