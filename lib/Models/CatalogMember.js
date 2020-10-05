"use strict";

/*global require*/

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var serializeToJson = require("../Core/serializeToJson");
var updateFromJson = require("../Core/updateFromJson");
var runLater = require("../Core/runLater");
var arraysAreEqual = require("../Core/arraysAreEqual");
var i18next = require("i18next").default;

/**
 * A member of a {@link CatalogGroup}.  A member may be a {@link CatalogItem} or a
 * {@link CatalogGroup}.
 *
 * @alias CatalogMember
 * @constructor
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var CatalogMember = function(terria) {
  if (!defined(terria)) {
    throw new DeveloperError("terria is required");
  }

  this._terria = terria;

  /**
   * Gets or sets the name of the item.  This property is observable.
   * @type {String}
   */
  this.name = i18next.t("models.catalog.name");

  /**
   * Gets or sets the description of the item.  This property is observable.
   * @type {String}
   */
  this.description = "";

  /**
   * Gets or sets the array of section titles and contents for display in the layer info panel.
   * In future this may replace 'description' above - this list should not contain
   * sections named 'description' or 'Description' if the 'description' property
   * is also set as both will be displayed.
   * The object is of the form {name:string, content:string}.
   * Content will be rendered as Markdown with HTML.
   * This property is observable.
   * @type {Object[]}
   * @default []
   */
  this.info = [];

  /**
   * Gets or sets the array of section titles definining the display order of info sections.  If this property
   * is not defined, {@link DataPreviewSections}'s DEFAULT_SECTION_ORDER is used.  This property is observable.
   * @type {String[]}
   */
  this.infoSectionOrder = undefined;

  /**
   * Gets or sets a value indicating whether this member was supplied by the user rather than loaded from one of the
   * {@link Terria#initSources}.  User-supplied members must be serialized completely when, for example,
   * serializing enabled members for sharing.  This property is observable.
   * @type {Boolean}
   * @default true
   */
  this.isUserSupplied = true;

  /**
   * Gets or sets a value indicating whether this item is kept above other non-promoted items.
   * This property is observable.
   * @type {Boolean}
   * @default false
   */
  this.isPromoted = false;

  /**
   * Gets or sets a value indicating whether this item is hidden from the catalog.  This
   * property is observable.
   * @type {Boolean}
   * @default false
   */
  this.isHidden = false;

  /**
   * A message object that is presented to the user when an item or group is initially clicked
   * The object is of the form {title:string, content:string, key: string, confirmation: boolean, confirmText: string, width: number, height: number}.
   * This property is observable.
   * @type {Object}
   */
  this.initialMessage = undefined;

  /**
   * Gets or sets the cache duration to use for proxied URLs for this catalog member.  If undefined, proxied URLs are effectively cachable
   * forever.  The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds).
   * @type {String}
   */
  this.cacheDuration = undefined;

  /**
   * Gets or sets whether or not this member should be forced to use a proxy.
   * This property is not observable.
   * @type {Boolean}
   */
  this.forceProxy = false;

  /**
   * Gets or sets the dictionary of custom item properties. This property is observable.
   * @type {Object}
   */
  this.customProperties = {};

  /**
   * An optional unique id for this member, that is stable across renames and moves.
   * Use uniqueId to get the canonical unique id for this CatalogMember, which is present even if there is no id.
   * @type {String}
   */
  this.id = undefined;

  /**
   * An array of all possible keys that can be used to match to this catalog member when specified in a share link -
   * used for maintaining backwards compatibility when adding or changing {@link CatalogMember#id}.
   *
   * @type {String[]}
   */
  this.shareKeys = undefined;

  /**
   * The parent {@link CatalogGroup} of this member.
   *
   * @type {CatalogGroup}
   */
  this.parent = undefined;

  /**
   * A short report to show on the now viewing tab.  This property is observable.
   * @type {String}
   */
  this.shortReport = undefined;

  /**
   * The list of collapsible sections of the short report.  Each element of the array is an object literal
   * with a `name` and `content` property.
   * @type {ShortReportSection[]}
   */
  this.shortReportSections = [];

  /*
   * Gets or sets a value indicating whether this data source is currently loading.  This property is observable.
   * @type {Boolean}
   */
  this.isLoading = false;

  /**
   * Whether this catalog member is waiting for a disclaimer to be accepted before showing itself.
   *
   * @type {boolean}
   */
  this.isWaitingForDisclaimer = false;

  /**
   * Indicates that the source of this data should be hidden from the UI (obviously this isn't super-secure as you
   * can just look at the network requests).
   *
   * @type {boolean}
   */
  this.hideSource = false;

  // The names of items in the {@link CatalogMember#info} array that contain details of the source of this
  // CatalogMember's data. This should be overridden by children of this class.
  this._sourceInfoItemNames = [];

  this._nameInCatalog = undefined;

  this._loadingPromise = undefined;

  /** Lookup table for _sourceInfoItemNames, access through {@link CatalogMember#_infoItemsWithSourceInfoLookup} */
  this._memoizedInfoItemsSourceLookup = undefined;

  knockout.track(this, [
    "name",
    "info",
    "infoSectionOrder",
    "description",
    "isUserSupplied",
    "isPromoted",
    "initialMessage",
    "isHidden",
    "cacheDuration",
    "customProperties",
    "shortReport",
    "shortReportSections",
    "isLoading",
    "isWaitingForDisclaimer",
    "_nameInCatalog"
  ]);

  knockout.defineProperty(this, "nameSortKey", {
    get: function() {
      var parts = this.nameInCatalog.split(/(\d+)/);
      return parts.map(function(part) {
        var parsed = parseInt(part, 10);
        if (parsed === parsed) {
          return parsed;
        } else {
          return part.trim().toLowerCase();
        }
      });
    }
  });

  /**
   * Gets or sets the name of this catalog member in the catalog. By default this is just `name`, but can be overridden.
   * @member {String} nameInCatalog
   * @memberOf CatalogMember.prototype
   */
  knockout.defineProperty(this, "nameInCatalog", {
    get: function() {
      return defaultValue(this._nameInCatalog, this.name);
    },
    set: function(value) {
      this._nameInCatalog = value;
    }
  });
};

var descriptionRegex = /description/i;

Object.defineProperties(CatalogMember.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf CatalogMember.prototype
   * @type {String}
   */
  type: {
    get: function() {
      throw new DeveloperError(
        'Types derived from CatalogMember must implement a "type" property.'
      );
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
   * @memberOf CatalogMember.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      throw new DeveloperError(
        'Types derived from CatalogMember must implement a "typeName" property.'
      );
    }
  },

  /**
   * Gets a value that tells the UI whether this is a group.
   * Groups, when clicked, expand to show their constituent items.
   * @memberOf CatalogMember.prototype
   * @type {Boolean}
   */
  isGroup: {
    get: function() {
      return false;
    }
  },

  /**
   * Gets the Terria instance.
   * @memberOf CatalogMember.prototype
   * @type {Terria}
   */
  terria: {
    get: function() {
      return this._terria;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.  If part of the update happens asynchronously, the updater function should
   * return a Promise that resolves when it is complete.
   * @memberOf CatalogMember.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return CatalogMember.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf CatalogMember.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return CatalogMember.defaultSerializers;
    }
  },

  /**
   * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson}
   * is called for a share link.
   * @memberOf CatalogMember.prototype
   * @type {String[]}
   */
  propertiesForSharing: {
    get: function() {
      return CatalogMember.defaultPropertiesForSharing;
    }
  },

  /**
   * Tests whether a description is available, either in the 'description' property
   * or as a member of the 'info' array.
   * @memberOf CatalogMember.prototype
   * @type {Boolean}
   */
  hasDescription: {
    get: function() {
      return (
        this.description ||
        (this.info &&
          this.info.some(function(i) {
            return descriptionRegex.test(i.name);
          }))
      );
    }
  },

  /**
   * The canonical unique id for this CatalogMember. Will be the id property if one is present, otherwise it will fall
   * back to the uniqueId of this item's parent + this item's name. This means that if no id is set anywhere up the
   * tree, the uniqueId will be a complete path of this member's location.
   * @memberOf  CatalogMember.prototype
   * @type {String}
   */
  uniqueId: {
    get: function() {
      if (this.id) {
        return this.id;
      }

      var parentKey = this.parent ? this.parent.uniqueId + "/" : "";

      return parentKey + this.name;
    }
  },

  /**
   * The complete path of this member's location.
   * @memberOf  CatalogMember.prototype
   * @type {String}
   */
  path: {
    get: function() {
      var parentPath = this.parent ? this.parent.path + "/" : "";

      return parentPath + this.name;
    }
  },

  /**
   * All keys that have historically been used to resolve this member - the current uniqueId + past shareKeys.
   */
  allShareKeys: {
    get: function() {
      var allShareKeys = [this.uniqueId];

      return this.shareKeys
        ? allShareKeys.concat(this.shareKeys)
        : allShareKeys;
    }
  },

  needsDisclaimerShown: {
    get: function() {
      return (
        defined(this.initialMessage) &&
        (!defined(this.initialMessage.key) ||
          !this.terria.getLocalProperty(this.initialMessage.key))
      );
    }
  },

  /**
   * A filtered view of {@link CatalogMember#info} that excludes info items that divulge details about the data's
   * source, as determined by {@link CatalogMember#__sourceInfoItemNames}.
   */
  infoWithoutSources: {
    get: function() {
      return defaultValue(this.info, []).filter(
        function(infoItem) {
          return !defined(this._infoItemsWithSourceInfoLookup[infoItem.name]);
        }.bind(this)
      );
    }
  },

  /**
   * Returns a lookup of _sourceInfoItemNames as a map of names to a true value. Memoizes after being called for the
   * first time.
   *
   * @private
   */
  _infoItemsWithSourceInfoLookup: {
    get: function() {
      if (!defined(this._memoizedInfoItemsSourceLookup)) {
        this._memoizedInfoItemsSourceLookup = this._sourceInfoItemNames.reduce(
          function(lookupSoFar, name) {
            lookupSoFar[name] = true;
            return lookupSoFar;
          },
          {}
        );
      }

      return this._memoizedInfoItemsSourceLookup;
    }
  }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
CatalogMember.defaultUpdaters = {
  nameSortKey: function() {},
  info: function(catalogItem, json, propertyName) {
    if (defined(json.info)) {
      json.info.forEach(function(infoItem) {
        var existingItem = catalogItem.info.filter(
          item => item.name === infoItem.name
        )[0];
        if (defined(existingItem)) {
          var index = catalogItem.info.indexOf(existingItem);
          catalogItem.info.splice(index, 1, infoItem);
        } else {
          catalogItem.info.push(infoItem);
        }
      });
    }
  }
};

Object.freeze(CatalogMember.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CatalogMember.defaultSerializers = {
  nameSortKey: function() {}
};

Object.freeze(CatalogMember.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogMember}-derived object
 * for a share link.
 * @type {String[]}
 */
CatalogMember.defaultPropertiesForSharing = ["name"];

Object.freeze(CatalogMember.defaultPropertiesForSharing);

/**
 * Updates the catalog member from a JSON object-literal description of it.
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
CatalogMember.prototype.updateFromJson = function(json, options) {
  if (defined(options) && defined(options.isUserSupplied)) {
    this.isUserSupplied = options.isUserSupplied;
  }

  var updatePromise = updateFromJson(this, json, options);

  // Updating from JSON may trigger a load (e.g. if isEnabled is set to true).  So if this catalog item
  // is now loading, wait on the load promise as well, which we can get by calling load.
  if (this.isLoading) {
    return when.all([updatePromise, this.load()]);
  } else {
    return updatePromise;
  }
};

/**
 * Serializes the data item to JSON.
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Function} [options.propertyFilter] Filter function that will be executed to determine whether a property
 *          should be serialized.
 * @param {Function} [options.itemFilter] Filter function that will be executed for each item in a group to determine
 *          whether that item should be serialized.
 * @return {Object} The serialized JSON object-literal.
 */
CatalogMember.prototype.serializeToJson = function(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  var result = serializeToJson(this, options.propertyFilter, options);
  result.type = this.type;
  result.id = this.uniqueId;

  if (defined(this.parent)) {
    result.parents = getParentIds(this.parent).reverse();
  }

  return result;
};

/**
 * Gets the ids of all parents of a catalog member, ordered from the closest descendant to the most distant. Ignores
 * the root.
 * @private
 * @param catalogMember The catalog member to get parent ids for.
 * @param parentIds A starting list of parent ids to add to (allows the function to work recursively).
 * @returns {String[]}
 */
function getParentIds(catalogMember, parentIds) {
  parentIds = defaultValue(parentIds, []);

  if (defined(catalogMember.parent)) {
    return getParentIds(
      catalogMember.parent,
      parentIds.concat([catalogMember.uniqueId])
    );
  }

  return parentIds;
}

/**
 * Finds an {@link CatalogMember#info} section by name.
 * @param {String} sectionName The name of the section to find.
 * @return {Object} The section, or undefined if no section with that name exists.
 */
CatalogMember.prototype.findInfoSection = function(sectionName) {
  for (var i = 0; i < this.info.length; ++i) {
    if (this.info[i].name === sectionName) {
      return this.info[i];
    }
  }
  return undefined;
};

/**
 * Goes up the hierarchy and determines if this CatalogMember is connected with the root in terria.catalog, or whether it's
 * part of a disconnected sub-tree.
 */
CatalogMember.prototype.connectsWithRoot = function() {
  var item = this;
  while (item.parent) {
    item = item.parent;
  }
  return item === this.terria.catalog.group;
};

/**
 * "Enables" this catalog member in a way that makes sense for its implementation (e.g. isEnabled for items, isOpen for
 * groups, and all its parents and ancestors in the tree.
 */
CatalogMember.prototype.enableWithParents = function() {
  throw new DeveloperError(
    'Types derived from CatalogMember must implement a "enableWithParents" function.'
  );
};

CatalogMember.prototype.waitForDisclaimerIfNeeded = function() {
  if (this.needsDisclaimerShown) {
    this.isWaitingForDisclaimer = true;
    var deferred = when.defer();
    this.terria.disclaimerListener(
      this,
      function() {
        this.isWaitingForDisclaimer = false;
        deferred.resolve();
      }.bind(this)
    );
    return deferred.promise;
  } else {
    return when();
  }
};

CatalogMember.prototype.load = function() {
  if (defined(this._loadingPromise)) {
    // Load already in progress.
    return this._loadingPromise;
  }

  var loadInfluencingValues = [];
  if (defined(this._getValuesThatInfluenceLoad)) {
    loadInfluencingValues = this._getValuesThatInfluenceLoad();
  }

  if (arraysAreEqual(loadInfluencingValues, this._lastLoadInfluencingValues)) {
    // Already loaded, and nothing has changed to force a re-load.
    return undefined;
  }

  this.isLoading = true;

  var that = this;

  this._loadingPromise = runLater(function() {
    that._lastLoadInfluencingValues = [];
    if (defined(that._getValuesThatInfluenceLoad)) {
      that._lastLoadInfluencingValues = that._getValuesThatInfluenceLoad();
    }

    return that._load();
  })
    .then(function(result) {
      that._loadingPromise = undefined;
      that.isLoading = false;
      return result;
    })
    .otherwise(function(e) {
      that._lastLoadInfluencingValues = undefined;
      that._loadingPromise = undefined;
      that.isLoading = false;
      throw e; // keep throwing this so we can chain more otherwises.
    });

  return this._loadingPromise;
};

/** A collection of static filters functions used during serialization */
CatalogMember.itemFilters = {
  /** Item filter that returns true if the item is user supplied */
  userSuppliedOnly: function(item) {
    return item.isUserSupplied;
  },
  /** Item filter that returns true if the item is a {@link CatalogItem} that is enabled, or another kind of {@link CatalogMember}. */
  enabled: function(item) {
    return !defined(item.isEnabled) || item.isEnabled;
  },
  /** Item filter that returns true if an item has no local data. */
  noLocalData: function(item) {
    return !defined(item.data);
  },
  /** Item filter that returns true if the item item was generated for csv charting. */
  isCsvForCharting: function(item) {
    return item.isCsvForCharting;
  }
};

CatalogMember.propertyFilters = {
  /**
   * Property filter that returns true if the property is in that item's {@link CatalogMember#propertiesForSharing} array.
   */
  sharedOnly: function(property, item) {
    return item.propertiesForSharing.indexOf(property) >= 0;
  }
};

module.exports = CatalogMember;
