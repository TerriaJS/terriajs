"use strict";

/*global require*/
var clone = require("terriajs-cesium/Source/Core/clone").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var inherit = require("../Core/inherit");
var overrideProperty = require("../Core/overrideProperty");

var CatalogItem = require("./CatalogItem");
var createCatalogMemberFromType = require("./createCatalogMemberFromType");
var i18next = require("i18next").default;

/**
 * A {@link CatalogItem} composed of multiple other catalog items.  When this item is enabled or shown, the composed items are
 * enabled or shown as well.  Other properties, including {@link CatalogItem#rectangle},
 * {@link CatalogItem#clock}, and {@link CatalogItem#legendUrls}, are not composed in any way, so you should manually set those
 * properties on this object as appropriate.
 *
 * @alias CompositeCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {CatalogItem[]} [items] The items to compose.
 */
var CompositeCatalogItem = function(terria, items) {
  CatalogItem.call(this, terria);

  this.items = defined(items) ? items.slice() : [];

  knockout.track(this, ["items"]);

  overrideProperty(this, "legendUrls", {
    get: function() {
      if (!defined(this._legendUrls) || this._legendUrls.length === 0) {
        this._legendUrls = [];
        for (var i = 0; i < this.items.length; ++i) {
          if (this.items[i].legendUrls) {
            this._legendUrls = this._legendUrls.concat(
              this.items[i].legendUrls
            );
          }
        }
      }
      return this._legendUrls;
    }
  });

  knockout.getObservable(this, "items").subscribe(function() {
    for (var i = 0; i < this.items.length; ++i) {
      this.items[i].showInNowViewingWhenEnabled = false;
    }
  }, this);
};

inherit(CatalogItem, CompositeCatalogItem);

Object.defineProperties(CompositeCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf CompositeCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "composite";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
   * @memberOf CompositeCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "Composite";
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf CompositeCatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return CompositeCatalogItem.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf CompositeCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return CompositeCatalogItem.defaultSerializers;
    }
  },

  /**
   * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
   * for a share link.
   * @memberOf CompositeCatalogItem.prototype
   * @type {String[]}
   */
  propertiesForSharing: {
    get: function() {
      return CompositeCatalogItem.defaultPropertiesForSharing;
    }
  },

  /**
   * Gets a value indicating whether this data source, when enabled, can be reordered with respect to other data sources.
   * Data sources that cannot be reordered are typically displayed above reorderable data sources.
   * @memberOf CsvCatalogItem.prototype
   * @type {Boolean}
   */
  supportsReordering: {
    get: function() {
      // we will use the heuristic that the composite supports reordering only
      // if all its subitems do
      var result = true;
      for (var itemIndex = 0; itemIndex < this.items.length; ++itemIndex) {
        var item = this.items[itemIndex];
        result = result && item.supportsReordering;
      }
      return result;
    }
  }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
// Adapted from CatalogGroup
CompositeCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

CompositeCatalogItem.defaultUpdaters.items = function(
  compositeCatalogItem,
  json,
  propertyName,
  options
) {
  // Let the item finish loading first.  Otherwise, these changes could get clobbered by the load.
  return when(compositeCatalogItem.load(), function() {
    var promises = [];
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    var items = json.items;
    for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
      var item = items[itemIndex];
      if (!defined(item.type)) {
        throw new RuntimeError(i18next.t("models.catalog.mustHaveType"));
      }
      if (item.type === "composite") {
        throw new RuntimeError(i18next.t("models.catalog.compositesError"));
      }
      var existingItem = createCatalogMemberFromType(
        item.type,
        compositeCatalogItem.terria
      );
      compositeCatalogItem.add(existingItem);
      promises.push(existingItem.updateFromJson(item, options));
    }

    return when.all(promises);
  });
};

CompositeCatalogItem.defaultUpdaters.isLoading = function(
  compositeCatalogItem,
  json,
  propertyName
) {};

Object.freeze(CompositeCatalogItem.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CompositeCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

CompositeCatalogItem.defaultSerializers.items = function(
  compositeCatalogItem,
  json,
  propertyName,
  options
) {
  var items = (json.items = []);

  for (var i = 0; i < compositeCatalogItem.items.length; ++i) {
    var item = compositeCatalogItem.items[i].serializeToJson(options);
    if (defined(item)) {
      items.push(item);
    }
  }
};

CompositeCatalogItem.defaultSerializers.isLoading = function(
  compositeCatalogItem,
  json,
  propertyName,
  options
) {};

Object.freeze(CompositeCatalogItem.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object
 * for a share link.
 * @type {String[]}
 */
CompositeCatalogItem.defaultPropertiesForSharing = clone(
  CatalogItem.defaultPropertiesForSharing
);
CompositeCatalogItem.defaultPropertiesForSharing.push("items");

Object.freeze(CompositeCatalogItem.defaultPropertiesForSharing);

//

CompositeCatalogItem.prototype._load = function() {
  return when.all(
    this.items.map(function(item) {
      return item.load();
    })
  );
};

CompositeCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  var result = [];

  for (var i = 0; i < this.items.length; ++i) {
    result.push.apply(result, this.items[i]._getValuesThatInfluenceLoad());
  }

  return result;
};

CompositeCatalogItem.prototype._enable = function() {
  var i;
  try {
    for (i = 0; i < this.items.length; ++i) {
      this.items[i]._enable();
    }
  } catch (e) {
    for (var j = 0; j < i; ++j) {
      this.items[j]._disable();
    }
    this.isEnabled = false;
    throw e;
  }
};

CompositeCatalogItem.prototype._disable = function() {
  for (var i = 0; i < this.items.length; ++i) {
    this.items[i]._disable();
  }
};

CompositeCatalogItem.prototype._show = function() {
  var i;
  try {
    for (i = 0; i < this.items.length; ++i) {
      this.items[i]._show();
    }
  } catch (e) {
    for (var j = 0; j < i; ++j) {
      this.items[j]._hide();
    }
    this.isShown = false;
    throw e;
  }
};

CompositeCatalogItem.prototype._hide = function() {
  for (var i = 0; i < this.items.length; ++i) {
    this.items[i]._hide();
  }
};

/**
 * Adds an item or group to this composite.
 *
 * @param {CatalogMember} item The item to add.
 */
CompositeCatalogItem.prototype.add = function(item) {
  this.items.push(item);
};

module.exports = CompositeCatalogItem;
