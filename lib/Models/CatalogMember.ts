'use strict';

declare var require: any;

const arraysAreEqual: <T>(left: T[], right: T[]) => boolean = require('../Core/arraysAreEqual');
const defaultValue: <T>(a: T, b: T) => T = require('terriajs-cesium/Source/Core/defaultValue');
const defined: (value: any) => boolean = require('terriajs-cesium/Source/Core/defined');
const freezeObject: any = require('terriajs-cesium/Source/Core/freezeObject');
const knockout: any = require('terriajs-cesium/Source/ThirdParty/knockout');
const runLater: any = require('../Core/runLater');
const serializeToJson: any = require('../Core/serializeToJson');
const updateFromJson: any = require('../Core/updateFromJson');
const when: any = require('terriajs-cesium/Source/ThirdParty/when');

/**
 * A member of a {@link CatalogGroup}.  A member may be a {@link CatalogItem} or a
 * {@link CatalogGroup}.
 */
abstract class CatalogMember {
    /**
     * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
     * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
     * @type {Object}
     */
    public static defaultUpdaters: Object = freezeObject({});

    /**
     * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
     * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
     * @type {Object}
     */
    public static defaultSerializers: Object = freezeObject({});

    /**
     * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogMember}-derived object
     * for a share link.
     * @type {String[]}
     */
    public static defaultPropertiesForSharing: string[] = freezeObject([
        'name'
    ]);

    /** A collection of static filters functions used during serialization */
    public static itemFilters = {
        /** Item filter that returns true if the item is a {@link CatalogItem} that is enabled, or another kind of {@link CatalogMember}. */
        enabled: function(item) {
            return !defined(item.isEnabled) || item.isEnabled;
        },
        /** Item filter that returns true if an item has no local data. */
        noLocalData: function(item) {
            return !defined(item.data);
        },
        /** Item filter that returns true if the item is user supplied */
        userSuppliedOnly: function(item) {
            return item.isUserSupplied;
        }
    };

    public static propertyFilters = {
        /**
         * Property filter that returns true if the property is in that item's {@link CatalogMember#propertiesForSharing} array.
         */
        sharedOnly: function(property, item) {
            return item.propertiesForSharing.indexOf(property) >= 0;
        }
    };

    /**
     * Gets or sets the name of the item.  This property is observable.
     * @type {String}
     */
    public name: string = 'Unnamed Item';

    /**
     * Gets or sets the description of the item.  This property is observable.
     * @type {String}
     */
    public description: string = '';

    /**
     * Gets or sets the array of section titles and contents for display in the layer info panel.
     * In future this may replace 'description' above - this list should not contain
     * sections named 'description' or 'Description' if the 'description' property
     * is also set as both will be displayed.
     * The object is of the form {name:string, content:string, confirmation: boolean, confirmText: string, width: number, height: number}.
     * Content will be rendered as Markdown with HTML.
     * This property is observable.
     * @type {Object[]}
     * @default []
     */
    public info: {name: string, content: string, confirmation?: boolean, confirmText?: string, width?: number, height?: number}[] = [];

    /**
     * Gets or sets the array of section titles definining the display order of info sections.  If this property
     * is not defined, {@link CatalogItemInfoViewModel.infoSectionOrder} is used.  This property is observable.
     * @type {String[]}
     */
    public infoSectionOrder: string[] = undefined;

    /**
     * Gets or sets a value indicating whether this member was supplied by the user rather than loaded from one of the
     * {@link Terria#initSources}.  User-supplied members must be serialized completely when, for example,
     * serializing enabled members for sharing.  This property is observable.
     * @type {Boolean}
     * @default true
     */
    public isUserSupplied: boolean = true;

    /**
     * Gets or sets a value indicating whether this item is kept above other non-promoted items.
     * This property is observable.
     * @type {Boolean}
     * @default false
     */
    public isPromoted: boolean = false;

    /**
     * Gets or sets a value indicating whether this item is hidden from the catalog.  This
     * property is observable.
     * @type {Boolean}
     * @default false
     */
    public isHidden: boolean = false;

    /**
     * A message object that is presented to the user when an item or group is initially clicked
     * The object is of the form {title:string, content:string, key: string}.
     * This property is observable.
     * @type {Object}
     */
    public initialMessage: {title: string, content: string, key?: string} = undefined;

    /**
     * Gets or sets the cache duration to use for proxied URLs for this catalog member.  If undefined, proxied URLs are effectively cachable
     * forever.  The duration is expressed as a Varnish-like duration string, such as '1d' (one day) or '10000s' (ten thousand seconds).
     * @type {String}
     */
    public cacheDuration: string = undefined;

    /**
     * Gets or sets whether or not this member should be forced to use a proxy.
     * This property is not observable.
     * @type {Boolean}
     */
    public forceProxy: boolean = false;

    /**
     * Gets or sets the dictionary of custom item properties. This property is observable.
     * @type {Object}
     */
    public customProperties: Object = {};

    /**
     * An optional unique id for this member, that is stable across renames and moves.
     * Use uniqueId to get the canonical unique id for this CatalogMember, which is present even if there is no id.
     * @type {String}
     */
    public id: string = undefined;

    /**
     * An array of all possible keys that can be used to match to this catalog member when specified in a share link -
     * used for maintaining backwards compatibility when adding or changing {@link CatalogMember#id}.
     *
     * @type {String[]}
     */
    public shareKeys: string[] = undefined;

    /**
     * The parent {@link CatalogGroup} of this member.
     *
     * @type {CatalogGroup}
     */
    public parent: any = undefined;

    /**
     * Gets or sets a value indicating whether this data source is currently loading.  This property is observable.
     * @type {Boolean}
     */
     public isLoading: boolean = false;

    /**
     * Whether this catalog member is waiting for a disclaimer to be accepted before showing itself.
     * @type {boolean}
     */
    public isWaitingForDisclaimer: boolean = false;

    private _terria: any;

    private _loadingPromise: any;

    private _lastLoadInfluencingValues: any;

    /**
     * Initializes a new instance.
     * @param {Terria} terria The Terria instance.
     */
    constructor(terria: any) {
        this._terria = terria;
        knockout.track(this, ['name', 'info', 'infoSectionOrder', 'description', 'isUserSupplied', 'isPromoted',
            'initialMessage', 'isHidden', 'cacheDuration', 'customProperties', 'isLoading', 'isWaitingForDisclaimer']);
    }

    /**
     * Gets the type of data item represented by this instance.
     * @type {String}
     */
    /*abstract*/ get type(): string {
        throw new DeveloperError('Types derived from CatalogMember must implement a "type" property.');
    }

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @type {String}
     */
    /*abstract*/ get typeName(): string {
        throw new DeveloperError('Types derived from CatalogMember must implement a "typeName" property.');
    }

    /**
     * Gets a value that tells the UI whether this is a group.
     * Groups, when clicked, expand to show their constituent items.
     * @memberOf CatalogMember.prototype
     * @type {Boolean}
     */
    get isGroup(): boolean {
        return false;
    }

    /**
     * Gets the Terria instance.
     * @memberOf CatalogMember.prototype
     * @type {Terria}
     */
    get terria(): any {
        return this._terria;
    }

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.  If part of the update happens asynchronously, the updater function should
     * return a Promise that resolves when it is complete.
     * @memberOf CatalogMember.prototype
     * @type {Object}
     */
    get updaters(): Object {
        return CatalogMember.defaultUpdaters;
    }

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CatalogMember.prototype
     * @type {Object}
     */
    get serializers(): Object {
        return CatalogMember.defaultSerializers;
    }

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson}
     * is called for a share link.
     * @memberOf CatalogMember.prototype
     * @type {String[]}
     */
    get propertiesForSharing(): string[] {
        return CatalogMember.defaultPropertiesForSharing;
    }

    /**
     * Tests whether a description is available, either in the 'description' property
     * or as a member of the 'info' array.
     * @memberOf CatalogMember.prototype
     * @type bool
     */
    get hasDescription(): boolean {
        return !!this.description ||
            (this.info &&
             this.info.some(function(i: {name: string, content: string}): boolean {
                return descriptionRegex.test(i.name);
            }));
    }

    /**
     * The canonical unique id for this CatalogMember. Will be the id property if one is present, otherwise it will fall
     * back to the uniqueId of this item's parent + this item's name. This means that if no id is set anywhere up the
     * tree, the uniqueId will be a complete path of this member's location.
     */
    get uniqueId(): string {
        if (this.id) {
            return this.id;
        }

        const parentKey = this.parent ? this.parent.uniqueId + '/' : '';

        return parentKey + this.name;
    }

    /**
     * All keys that have historically been used to resolve this member - the current uniqueId + past shareKeys.
     */
    get allShareKeys(): string[] {
        const allShareKeys = [this.uniqueId];

        return this.shareKeys ? allShareKeys.concat(this.shareKeys) : allShareKeys;
    }

    get needsDisclaimerShown(): boolean {
        return defined(this.initialMessage) && (!defined(this.initialMessage.key) ||
               !this.terria.getLocalProperty(this.initialMessage.key));
    }

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
    public updateFromJson(json: Object, options?: {onlyUpdateExistingItems?: boolean, isUserSupplied?: boolean}): any {
        if (defined(options) && defined(options.isUserSupplied)) {
            this.isUserSupplied = options.isUserSupplied;
        }

        return updateFromJson(this, json, options);
    }

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
    public serializeToJson(options?: {propertyFilter?: () => boolean, itemFilter?: () => boolean}): Object {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        const result = serializeToJson(this, options.propertyFilter, options);
        result.type = this.type;
        result.id = this.uniqueId;

        if (defined(this.parent)) {
            result.parents = getParentIds(this.parent).reverse();
        }

        return result;
    }

    /**
     * Finds an {@link CatalogMember#info} section by name.
     * @param {String} sectionName The name of the section to find.
     * @return {Object} The section, or undefined if no section with that name exists.
     */
    public findInfoSection(sectionName: string) {
        for (let i = 0; i < this.info.length; ++i) {
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
    public connectsWithRoot(): boolean {
        let item = this;
        while (item.parent) {
            item = item.parent;
        }
        return item === this.terria.catalog.group;
    }

    /**
     * "Enables" this catalog member in a way that makes sense for its implementation (e.g. isEnabled for items, isOpen for
     * groups, and all its parents and ancestors in the tree.
     */
    public abstract enableWithParents(): void;

    public waitForDisclaimerIfNeeded(): any {
        if (this.needsDisclaimerShown) {
            this.isWaitingForDisclaimer = true;
            const deferred = when.defer();
            this.terria.disclaimerListener(this, function() {
                this.isWaitingForDisclaimer = false;
                deferred.resolve();
            }.bind(this));
            return deferred.promise;
        } else {
            return when();
        }
    }

    public load(): any {
        if (defined(this._loadingPromise)) {
            // Load already in progress.
            return this._loadingPromise;
        }

        const loadInfluencingValues = [];
        if (defined(this._getValuesThatInfluenceLoad)) {
            loadInfluencingValues = this._getValuesThatInfluenceLoad();
        }

        if (arraysAreEqual(loadInfluencingValues, this._lastLoadInfluencingValues)) {
            // Already loaded, and nothing has changed to force a re-load.
            return undefined;
        }

        this.isLoading = true;

        const that = this;

        return runLater(function() {
            that._lastLoadInfluencingValues = [];
            if (defined(that._getValuesThatInfluenceLoad)) {
                that._lastLoadInfluencingValues = that._getValuesThatInfluenceLoad();
            }

            return that._load();
        }).then(function(result) {
            that._loadingPromise = undefined;
            that.isLoading = false;
            return result;
        }).otherwise(function(e) {
            that._lastLoadInfluencingValues = undefined;
            that._loadingPromise = undefined;
            that.isLoading = false;
            throw e; // keep throwing this so we can chain more otherwises.
        });
    };

    protected abstract _load(): any;

    protected abstract _getValuesThatInfluenceLoad(): any[];
}

const descriptionRegex = /description/i;

/**
 * Gets the ids of all parents of a catalog member, ordered from the closest descendant to the most distant. Ignores
 * the root.
 *
 * @param catalogMember The catalog member to get parent ids for.
 * @param parentIds A starting list of parent ids to add to (allows the function to work recursively).
 * @returns {String[]}
 */
function getParentIds(catalogMember: CatalogMember, parentIds?: string[]) {
    parentIds = defaultValue(parentIds, []);

    if (defined(catalogMember.parent)) {
        return getParentIds(catalogMember.parent, parentIds.concat([catalogMember.uniqueId]));
    }

    return parentIds;
}

export = CatalogMember;
