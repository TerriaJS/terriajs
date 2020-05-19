"use strict";

/*global require*/

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var combine = require("terriajs-cesium/Source/Core/combine").default;

var combineFilters = require("../Core/combineFilters");
var createCatalogMemberFromType = require("./createCatalogMemberFromType");
var CatalogMember = require("./CatalogMember");
var inherit = require("../Core/inherit");
var raiseErrorOnRejectedPromise = require("./raiseErrorOnRejectedPromise");
var i18next = require("i18next").default;

/**
 * A group of data items and other groups in the {@link Catalog}.  A group can contain
 * {@link CatalogMember|CatalogMembers} or other
 * {@link CatalogGroup|CatalogGroups}.
 *
 * @alias CatalogGroup
 * @constructor
 * @extends CatalogMember
 *
 * @param {Terria} terria The Terria instance.
 */
var CatalogGroup = function(terria) {
  CatalogMember.call(this, terria);

  this._lastLoadInfluencingValues = undefined;

  /**
   * Gets or sets a value indicating whether the group is currently expanded and showing
   * its children.  This property is observable.
   * @type {Boolean}
   */
  this.isOpen = false;

  /**
   * Gets the collection of items in this group.  This property is observable.
   * @type {CatalogMember[]}
   */
  this.items = [];

  /**
   * Gets or sets flag to prevent items in group being sorted. Subgroups will still sort unless their own preserveOrder flag is set.  The value
   * of this property only has an effect during {@CatalogGroup#load} and {@CatalogItem#updateFromJson}.
   */
  this.preserveOrder = false;

  /**
   * Gets or sets the function to be used when sorting the group's items.
   * This function takes two {@link CatalogItem} parameters and should return a negative,
   * zero, or positive value depending on the order in which they should be sorted.
   * @type {function}
   */
  this.sortFunction = function(itemA, itemB) {
    if (itemA.isPromoted && !itemB.isPromoted) {
      return -1;
    } else if (!itemA.isPromoted && itemB.isPromoted) {
      return 1;
    } else {
      var aNameSortKey = itemA.nameSortKey;
      var bNameSortKey = itemB.nameSortKey;

      for (var i = 0; i < aNameSortKey.length && i < bNameSortKey.length; ++i) {
        if (aNameSortKey[i] < bNameSortKey[i]) {
          return -1;
        } else if (aNameSortKey[i] > bNameSortKey[i]) {
          return 1;
        }
      }

      if (aNameSortKey.length === bNameSortKey.length) {
        return 0;
      } else {
        return aNameSortKey.length > bNameSortKey.length ? 1 : -1;
      }
    }
  };

  knockout.track(this, ["isOpen", "items"]);

  var that = this;

  // knockout.defineProperty(this, 'isAnyEnabled', {
  //     // Defining this knockout computed property makes it easy to track changes to the isEnabled properties on the items
  //     get : function() {
  //         var isAnyEnabled = false;
  //         for (var i = that.items.length - 1; i >= 0; i--) {
  //             isAnyEnabled = that.items[i].isEnabled || isAnyEnabled;  // order is important so knockout watches every item
  //         }
  //         return isAnyEnabled;
  //     }
  // });

  knockout.getObservable(this, "isOpen").subscribe(function(newValue) {
    // Load this group's items (if we haven't already) when it is opened.
    if (newValue) {
      raiseErrorOnRejectedPromise(
        that.terria,
        when.all([that.waitForDisclaimerIfNeeded(), that.load()])
      );
    }
  });

  knockout.getObservable(this, "isLoading").subscribe(function(newValue) {
    // Call load() again immediately after finishing loading, if the group is still open.  Normally this will do nothing,
    // but if the URL has changed since we started, it will kick off loading the new URL.
    // If this spins you into a stack overflow, verify that your derived-class load method only
    // loads when it actually needs to do so!
    if (newValue === false && that.isOpen) {
      raiseErrorOnRejectedPromise(that.terria, that.load());
    }
  });

  this._setupItemListeners();
};

inherit(CatalogMember, CatalogGroup);

Object.defineProperties(CatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf CatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "group";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
   * @memberOf CatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.catalog.group");
    }
  },

  /**
   * Gets a value that tells the UI whether this is a group.
   * Groups, when clicked, expand to show their constituent items.
   * @memberOf CatalogGroup.prototype
   * @type {Boolean}
   */
  isGroup: {
    get: function() {
      return true;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf CatalogGroup.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return CatalogGroup.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf CatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return CatalogGroup.defaultSerializers;
    }
  },

  /**
   * Gets the set of names of the properties to be serialized for this object for a share link.
   * @memberOf CatalogGroup.prototype
   * @type {String[]}
   */
  propertiesForSharing: {
    get: function() {
      return CatalogGroup.defaultPropertiesForSharing;
    }
  }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
CatalogGroup.defaultUpdaters = clone(CatalogMember.defaultUpdaters);

CatalogGroup.defaultUpdaters.items = function(
  catalogGroup,
  json,
  propertyName,
  options
) {
  // Let the group finish loading first.  Otherwise, these changes could get clobbered by the load.
  return when(catalogGroup.load(), function() {
    return CatalogGroup.updateItems(json.items, options, catalogGroup);
  });
};

CatalogGroup.defaultUpdaters.isLoading = function(
  catalogGroup,
  json,
  propertyName
) {};

Object.freeze(CatalogGroup.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if neccesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CatalogGroup.defaultSerializers = clone(CatalogMember.defaultSerializers);

CatalogGroup.defaultSerializers.items = function(
  catalogGroup,
  json,
  propertyName,
  options
) {
  json.items = catalogGroup.items
    .filter(function(item) {
      return !defined(options.itemFilter) || options.itemFilter(item);
    })
    .map(function(item) {
      return item.serializeToJson(options);
    })
    .filter(function(serializedItem) {
      return defined(serializedItem);
    });
};

/**
 * Call {@link CatalogGroup#defaultSerializers#items}, filtering out non-shareable properties and non-enabled items.
 * This is used when serializing a number of kinds of item groups where most details can be fetched from a URL and hence
 * there's no need to serialize anything that can't be changed by the user.
 */
CatalogGroup.enabledShareableItemsSerializer = function(
  catalogGroup,
  json,
  propertyName,
  options
) {
  return CatalogGroup.defaultSerializers.items(
    catalogGroup,
    json,
    propertyName,
    combine(
      {
        propertyFilter: combineFilters([
          options.propertyFilter,
          CatalogMember.propertyFilters.sharedOnly
        ]),
        itemFilter: combineFilters([
          options.itemFilter,
          CatalogMember.itemFilters.enabled
        ])
      },
      options
    )
  );
};

CatalogGroup.defaultSerializers.isLoading = function(
  catalogGroup,
  json,
  propertyName,
  options
) {};

Object.freeze(CatalogGroup.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object
 * for a share link.
 * @type {String[]}
 */
CatalogGroup.defaultPropertiesForSharing = clone(
  CatalogMember.defaultPropertiesForSharing
);
CatalogGroup.defaultPropertiesForSharing.push("items");
CatalogGroup.defaultPropertiesForSharing.push("isOpen");

Object.freeze(CatalogGroup.defaultPropertiesForSharing);

CatalogGroup.prototype._setupItemListeners = function() {
  var itemsChangeListeners = {
    added: function(item) {
      item.parent = this;

      // Only index this in catalog if it's actually connected to catalog, otherwise we get situations where an
      // item is added to the index before its actually built up a correct path to use as a default id.
      if (item.connectsWithRoot()) {
        indexWithDescendants([item], this.terria.catalog.shareKeyIndex);
      }
    }.bind(this),
    deleted: function(item) {
      if (item.connectsWithRoot()) {
        deIndexWithDescendants([item], this.terria.catalog.shareKeyIndex);
      }

      item.parent = undefined;
    }.bind(this)
  };

  knockout.getObservable(this, "items").subscribe(
    function(changes) {
      changes.forEach(function(change) {
        if (!defined(change.moved)) {
          itemsChangeListeners[change.status](change.value);
        }
      });
    },
    null,
    "arrayChange"
  );
};

var NUMBER_AT_END_OF_KEY_REGEX = /\((\d+)\)$/;

/**
 * Adds all passed items to the passed index, and all the children of those items recursively.
 * @private
 * @param {CatalogMember[]} items
 * @param {Object} index
 */
function indexWithDescendants(items, index) {
  items.forEach(function(item) {
    item.allShareKeys.forEach(function(key) {
      var insertionKey = key;

      if (index[insertionKey]) {
        insertionKey = generateUniqueKey(index, key);

        if (item.uniqueId === key) {
          // If this duplicate was the item's main key that will be used for sharing it in general, set this
          // to the new key. This means that sharing the item will still work most of the time.
          item.id = insertionKey;
        }

        console.warn(
          "Duplicate shareKey: " +
            key +
            ". Inserting new item under " +
            insertionKey
        );
      }

      index[insertionKey] = item;
    }, this);

    if (defined(item.items)) {
      indexWithDescendants(item.items, index);
    }
  });
}

/**
 * Generates a unique key from a non-unique one by adding a number after it. If the key already has a number added,
 * it will increment that number.
 * @private
 * @param index An index to check for uniqueness.
 * @param initialKey The key to start from.
 * @returns {String} A new, unique key.
 */
function generateUniqueKey(index, initialKey) {
  var currentCandidate = initialKey;

  var counter = 0;
  while (index[currentCandidate]) {
    var numberAtEndOfKeyMatches = currentCandidate.match(
      NUMBER_AT_END_OF_KEY_REGEX
    );
    if (numberAtEndOfKeyMatches !== null) {
      var nextNumber = parseInt(numberAtEndOfKeyMatches[1], 10) + 1;

      currentCandidate = currentCandidate.replace(
        NUMBER_AT_END_OF_KEY_REGEX,
        "(" + nextNumber + ")"
      );
    } else {
      currentCandidate += " (1)";
    }

    // This loop should always find something eventually, but because it's a bit dangerous looping endlessly...
    counter++;
    if (counter >= 100000) {
      throw new DeveloperError(
        "Was not able to find a unique key for " +
          initialKey +
          " after 100000 iterations." +
          " This is probably because the regex for matching keys was somehow unable to work for that key."
      );
    }
  }

  return currentCandidate;
}

/**
 * Removes all passed items to the passed index, and all the children of those items recursively.
 *
 * @param {CatalogMember[]} items
 * @param {Object} index
 */
function deIndexWithDescendants(items, index) {
  items.forEach(function(item) {
    item.allShareKeys.forEach(function(key) {
      index[key] = undefined;
    }, this);

    if (defined(item.items)) {
      deIndexWithDescendants(item.items, index);
    }
  });
}

/**
 * Loads the contents of this group, if the contents are not already loaded.  It is safe to
 * call this method multiple times.  The {@link CatalogGroup#isLoading} flag will be set while the load is in progress.
 * Derived classes should implement {@link CatalogGroup#_load} to perform the actual loading for the group.
 * Derived classes may optionally implement {@link CatalogGroup#_getValuesThatInfluenceLoad} to provide an array containing
 * the current value of all properties that influence this group's load process.  Each time that {@link CatalogGroup#load}
 * is invoked, these values are checked against the list of values returned last time, and {@link CatalogGroup#_load} is
 * invoked again if they are different.  If {@link CatalogGroup#_getValuesThatInfluenceLoad} is undefined or returns an
 * empty array, {@link CatalogGroup#_load} will only be invoked once, no matter how many times
 * {@link CatalogGroup#load} is invoked.
 *
 * @returns {Promise} A promise that resolves when the load is complete, or undefined if the group is already loaded.
 *
 */
CatalogGroup.prototype.load = function() {
  var parentPromise = CatalogMember.prototype.load.call(this);

  if (parentPromise) {
    return parentPromise
      .then(
        function() {
          this.sortItems(true);
        }.bind(this)
      )
      .otherwise(
        function(e) {
          this.isOpen = false;
          throw e; // keep throwing this so we can chain more otherwises.
        }.bind(this)
      );
  }
};

/**
 * When implemented in a derived class, this method loads the group.  The base class implementation does nothing.
 * This method should not be called directly; call {@link CatalogGroup#load} instead.
 * @return {Promise} A promise that resolves when the load is complete.
 * @protected
 */
CatalogGroup.prototype._load = function() {
  return when();
};

var emptyArray = Object.freeze([]);

/**
 * When implemented in a derived class, gets an array containing the current value of all properties that
 * influence this group's load process.  See {@link CatalogGroup#load} for more information on when and
 * how this is used.  The base class implementation returns an empty array.
 * @return {Array} The array of values that influence the load process.
 * @protected
 */
CatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return emptyArray;
};

/**
 * Adds an item or group to this group.
 *
 * @param {CatalogMember} item The item to add.
 */
CatalogGroup.prototype.add = function(item) {
  this.items.push(item);
};

/**
 * Removes an item or group from this group.
 *
 * @param {CatalogMember} item The item to remove.
 */
CatalogGroup.prototype.remove = function(item) {
  this.items.remove(item); // available for knockout observable arrays.
};

/**
 * Toggles the {@link CatalogGroup#isOpen} property of this group.  If it is open, calling this method
 * will close it.  If it is closed, calling this method will open it.
 */
CatalogGroup.prototype.toggleOpen = function() {
  this.isOpen = !this.isOpen;
};

/**
 * Finds the first item in this group that has the given name.  The search is case-sensitive.
 *
 * Instead of using this function, consider using {@link Catalog#shareKeyIndex} to look the item up, as this works in
 * constant time and allows lookups to continue working for items that have been renamed or moved as long as they have
 * a stable shareKey set. This function is retained mainly for backwards-compatibility with existing share links that
 * used names for matching.
 *
 * @param {String} name The name of the item to find.
 * @return {CatalogMember} The first item with the given name, or undefined if no item with that name exists.
 */
CatalogGroup.prototype.findFirstItemByName = function(name) {
  for (var i = 0; i < this.items.length; ++i) {
    if (this.items[i].name === name) {
      return this.items[i];
    }
  }

  return undefined;
};

/**
 * Sorts the items in this group.
 *
 * @param {Boolean} [sortRecursively=false] true to sort the items in sub-groups as well; false to sort only the items in this group.
 */
CatalogGroup.prototype.sortItems = function(sortRecursively) {
  // Allow a group to be non-sorted, while still containing sorted groups.
  if (this.preserveOrder) {
    // Bubble promoted items to the top without changing their relative order.
    var promoted = this.items.filter(function(item) {
      return item.isPromoted;
    });
    var nonPromoted = this.items.filter(function(item) {
      return !item.isPromoted;
    });

    if (promoted.length > 0 && nonPromoted.length > 0) {
      this.items = promoted.concat(nonPromoted);
    }
  } else {
    this.items.sort(this.sortFunction);
  }

  if (defaultValue(sortRecursively, false)) {
    for (var i = 0; i < this.items.length; ++i) {
      var item = this.items[i];
      if (defined(item.sortItems)) {
        item.sortItems(sortRecursively);
      }
    }
  }
};

CatalogGroup.prototype.enableWithParents = function() {
  this.isOpen = true;

  if (this.parent) {
    this.parent.enableWithParents();
  }
};

/**
 * Reads an array of catalog members in JSON format (as objects, not strings) and transforms them into actual Terria
 * models (i.e. {@link CatalogMember} instances), and adds them to the {@link CatalogMember#items} property of the
 * supplied catalogGroup, or updates only the existing items in the catalogGroup.
 *
 * @param {Object} itemsJson The items as simple JSON data. The JSON should be in the form of an object literal, not a
 *                 string.
 * @param {Object} [options] Object with the following properties:
 * @param {Boolean} [options.onlyUpdateExistingItems] true to only update existing items and never create new ones, or false is new items
 *                                                    may be created by this update.
 * @param {Boolean} [options.isUserSupplied] If specified, sets the {@link CatalogMember#isUserSupplied} property of updated catalog members
 *                                           to the given value.  If not specified, the property is left unchanged.
 * @param {CatalogGroup} catalogGroup The catalogGroup to update.
 *
 * @returns {Promise} A promise that resolves when the update is complete.
 */
CatalogGroup.updateItems = function(itemsJson, options, catalogGroup) {
  if (!(itemsJson instanceof Array)) {
    throw new DeveloperError(
      "JSON catalog description must be an array of groups."
    );
  }

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  var onlyUpdateExistingItems = defaultValue(
    options.onlyUpdateExistingItems,
    false
  );

  var promises = [];

  for (var itemIndex = 0; itemIndex < itemsJson.length; ++itemIndex) {
    var itemJson = itemsJson[itemIndex];

    if (!defined(itemJson.name) && !defined(itemJson.id)) {
      throw new RuntimeError(i18next.t("models.catalog.idForMatchingError"));
    }

    var itemObject;
    if (itemJson.id) {
      itemObject = catalogGroup.terria.catalog.shareKeyIndex[itemJson.id];
    } else if (itemJson.name) {
      itemObject = catalogGroup.findFirstItemByName(itemJson.name);
    }

    var updating = defined(itemObject);

    if (!updating) {
      // Skip this item entirely if we're not allowed to create it.
      if (onlyUpdateExistingItems) {
        continue;
      }

      if (!defined(itemJson.name)) {
        throw new RuntimeError(
          i18next.t("models.catalog.catalogMemberMustHaveName")
        );
      }

      if (!defined(itemJson.type)) {
        throw new RuntimeError(
          i18next.t("models.catalog.catalogMemberMustHaveType")
        );
      }

      itemObject = createCatalogMemberFromType(
        itemJson.type,
        catalogGroup.terria
      );
    }

    promises.push(itemObject.updateFromJson(itemJson, options));

    if (!updating) {
      catalogGroup.add(itemObject);
    }
  }

  catalogGroup.sortItems();

  return when.all(promises);
};

module.exports = CatalogGroup;
