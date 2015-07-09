'use strict';

/*global require*/

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

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
         throw new DeveloperError('terria is required');
    }

    this._terria = terria;

    /**
     * Gets or sets the name of the item.  This property is observable.
     * @type {String}
     */
    this.name = 'Unnamed Item';

    /**
     * Gets or sets the description of the item.  This property is observable.
     * @type {String}
     */
    this.description = '';

    /**
    * Gets or sets the array of section titles and contents for display in the layer info panel.
    * In future this may replace 'description' above - this list should not contain
    * sections named 'description' or 'Description' if the 'description' property
    * is also set as both will be displayed.  
    * The object is of the form {name:string, content:string}.
    * Content will be rendered as Markdown with HTML.
    * This property is observable.
    * @type {Array}
    * @default []
    */
    this.info = [];

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
     * The object is of the form {title:string, content:string, key: string}.
     * This property is observable.
     * @type {Object}
     */
    this.initialMessage = undefined;

    /**
     * Gets or sets whether initialMessage has been displayed.
     * This property is not observable.
     * @type {Boolean}
     */
    this.initialMessageViewed = false;

    knockout.track(this, ['name', 'info', 'description', 'isUserSupplied', 'isPromoted', 'initialMessage', 'isHidden']);
};

var descriptionRegex = /description/i;

defineProperties(CatalogMember.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf CatalogMember.prototype
     * @type {String}
     */
    type : {
        get : function() {
            throw new DeveloperError('Types derived from CatalogMember must implement a "type" property.');
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf CatalogMember.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            throw new DeveloperError('Types derived from CatalogMember must implement a "typeName" property.');
        }
    },

    /**
      * Gets the Terria instance.
     * @memberOf CatalogMember.prototype
     * @type {Terria}
     */
    terria : {
        get : function() {
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
    updaters : {
        get : function() {
            return CatalogMember.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CatalogMember.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return CatalogMember.defaultSerializers;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf CatalogMember.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return CatalogMember.defaultPropertiesForSharing;
        }
    },

    /**
    * Tests whether a description is available, either in the 'description' property
    * or as a member of the 'info' array.
    * @memberOf CatalogMember.prototype
    * @type bool
    */
    hasDescription : {
        get : function() {
            return this.description ||
                (this.info &&
                 this.info.some(function(i){
                    return descriptionRegex.test(i.name);
                }));
        }
    }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
CatalogMember.defaultUpdaters = {
};

freezeObject(CatalogMember.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CatalogMember.defaultSerializers = {
};

freezeObject(CatalogMember.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogMember}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
CatalogMember.defaultPropertiesForSharing = [
    'name'
];

freezeObject(CatalogMember.defaultPropertiesForSharing);

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

    var promises = [];

    for (var propertyName in this) {
        if (this.hasOwnProperty(propertyName) && defined(json[propertyName]) && propertyName.length > 0 && propertyName[0] !== '_') {
            if (this.updaters && this.updaters[propertyName]) {
                promises.push(this.updaters[propertyName](this, json, propertyName, options));
            } else {
                this[propertyName] = json[propertyName];
            }
        }
    }

    return when.all(promises);
};

/**
 * Serializes the data item to JSON.
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Boolean} [options.enabledItemsOnly=false] true if only enabled data items (and their groups) should be serialized,
 *                  or false if all data items should be serialized.
 * @param {CatalogMember[]} [options.itemsSkippedBecauseTheyAreNotEnabled] An array that, if provided, is populated on return with
 *        all of the data items that were not serialized because they were not enabled.  The array will be empty if
 *        options.enabledItemsOnly is false.
 * @param {Boolean} [options.skipItemsWithLocalData=false] true if items with a serializable 'data' property should be skipped entirely.
 *                  This is useful to avoid creating a JSON data structure with potentially very large embedded data.
 * @param {CatalogMember[]} [options.itemsSkippedBecauseTheyHaveLocalData] An array that, if provided, is populated on return
 *        with all of the data items that were not serialized because they have a serializable 'data' property.  The array will be empty
 *        if options.skipItemsWithLocalData is false.
 * @param {Boolean} [options.serializeForSharing=false] true to only serialize properties that are typically necessary for sharing this member
 *                                                      with other users, such as {@link CatalogGroup#isOpen}, {@link CatalogItem#isEnabled},
 *                                                      {@link CatalogItem#isLegendVisible}, and {@link ImageryLayerCatalogItem#opacity},
 *                                                      rather than serializing all properties needed to completely recreate the catalog.  The set of properties
 *                                                      that is serialized when this property is true is given by each model's
 *                                                      {@link CatalogMember#propertiesForSharing} property.
 * @param {Boolean} [options.userSuppliedOnly=false] true to only serialize catalog members (and their containing groups) that have been identified as having been
 *                  supplied by the user ({@link CatalogMember#isUserSupplied} is true); false to serialize all catalog members.
 * @return {Object} The serialized JSON object-literal.
 */
CatalogMember.prototype.serializeToJson = function(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    var enabledItemsOnly = defaultValue(options.enabledItemsOnly, false);

    if (defaultValue(options.userSuppliedOnly, false) && !this.isUserSupplied) {
        return undefined;
    }

    if (enabledItemsOnly && this.isEnabled === false) {
        if (defined(options.itemsSkippedBecauseTheyAreNotEnabled)) {
            options.itemsSkippedBecauseTheyAreNotEnabled.push(this);
        }
        return undefined;
    }

    if (defaultValue(options.skipItemsWithLocalData, false) && defined(this.data)) {
        if (defined(options.itemsSkippedBecauseTheyHaveLocalData)) {
            options.itemsSkippedBecauseTheyHaveLocalData.push(this);
        }
        return undefined;
    }

    var result = {};

    var filterFunction = function() { return true; };
    if (options.serializeForSharing) {
        var that = this;
        filterFunction = function(propertyName) {
            return that.propertiesForSharing.indexOf(propertyName) >= 0;
        };
    } else {
        result.type = this.type;
    }

    var promises = [];

    for (var propertyName in this) {
        if (this.hasOwnProperty(propertyName) && propertyName.length > 0 && propertyName[0] !== '_' && filterFunction(propertyName)) {
            if (this.serializers && this.serializers[propertyName]) {
                promises.push(this.serializers[propertyName](this, result, propertyName, options));
            } else {
                result[propertyName] = this[propertyName];
            }
        }
    }

    // Only serialize a group if the group has items in it.
    if (enabledItemsOnly && defined(this.items) && (!defined(result.items) || result.items.length === 0)) {
        return undefined;
    }

    return result;
};

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

module.exports = CatalogMember;
