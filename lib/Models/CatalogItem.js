"use strict";

/*global require*/

var CatalogMember = require("./CatalogMember");
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var clone = require("terriajs-cesium/Source/Core/clone").default;
var createCatalogMemberFromType = require("./createCatalogMemberFromType");
var Credit = require("terriajs-cesium/Source/Core/Credit").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var inherit = require("../Core/inherit");
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var LegendUrl = require("../Map/LegendUrl");
var Metadata = require("./Metadata");
var raiseErrorOnRejectedPromise = require("./raiseErrorOnRejectedPromise");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var i18next = require("i18next").default;

/**
 * A data item in a {@link CatalogGroup}.
 *
 * @alias CatalogItem
 * @constructor
 * @extends CatalogMember
 * @abstract
 *
 * @param {Terria} terria The Terria instance.
 */
var CatalogItem = function(terria) {
  CatalogMember.call(this, terria);

  this._enabledDate = undefined;
  this._shownDate = undefined;
  this._loadForEnablePromise = undefined;
  this._lastLoadInfluencingValues = undefined;

  // The catalog item to show in the Now Viewing when this item is enabled, instead of this item.
  // If undefined, this item itself is shown.
  this.nowViewingCatalogItem = undefined;

  // The catalog item that created this one.  Usually this is undefined, but may be defined if
  // the {@see CatalogItem} in the catalog acts like a factory to produce a different catalog item for the
  // {@see NowViewing}, rather than being added to the {@see NowViewing} itself.  In that scenario, this
  // property on the item in the now viewing would be a reference to the item in the catalog.
  // @type {CatalogItem}
  this.creatorCatalogItem = undefined;

  /**
   * The index of the item in the Now Viewing list.  Setting this property does not automatically change the order.
   * This property is used intenally to save/restore the Now Viewing order and is not intended for general use.
   * @private
   * @type {Number}
   */
  this.nowViewingIndex = undefined;

  /**
   * Gets or sets the geographic rectangle (extent or bounding box) containing this data item.  This property is observable.
   * @type {Rectangle}
   */
  this.rectangle = undefined;

  /**
   * Gets or sets the URL of this data.  This property is observable.
   * @type {String}
   */
  this.url = undefined;

  /**
   * Gets or sets a description of the custodian of this data item.
   * This property is an HTML string that must be sanitized before display to the user.
   * This property is observable.
   * @type {String}
   */
  this.dataCustodian = undefined;

  /**
   * Gets or sets an attribution displayed on the map when this catalog item is enabled.
   * This property is observable.
   * @type {Credit}
   */
  this.attribution = undefined;

  /**
   * Gets or sets the URL from which this data item's metadata description can be retrieved, or undefined if
   * metadata is not available for this data item.  The format of the metadata depends on the type of data item.
   * For example, Web Map Service (WMS) data items provide their metadata via their GetCapabilities document.
   * This property is observable.
   * @type {String}
   */
  this.metadataUrl = undefined;

  /**
   * Gets or sets a value indicating whether this data item is enabled.  An enabled data item appears in the
   * "Now Viewing" pane, but is not necessarily shown on the map.  This property is observable.
   * @type {Boolean}
   */
  this.isEnabled = false;

  /**
   * Gets or sets a value indicating whether this data item is currently shown on the map.  In order to be shown,
   * the item must also be enabled.  This property is observable.
   * @type {Boolean}
   */
  this.isShown = false;

  /**
   * Gets or sets a value indicating whether the legend for this data item is currently visible.
   * This property is observable.
   * @type {Boolean}
   */
  this.isLegendVisible = true;

  /**
   * Gets or sets a flag which determines whether the legend comes before (false) or after (true) the display variable choice.
   * Default false.
   * @type {Boolean}
   */
  this.displayChoicesBeforeLegend = false;

  /**
   * Gets or sets the clock parameters for this data item.  If this property is undefined, this data item
   * does not have any time-varying data.  This property is observable.
   * @type {DataSourceClock}
   */
  this.clock = undefined;

  /**
   * Gets or sets a value indicating whether this data source is currently loading.  This property is observable.
   * @type {Boolean}
   */
  this.isLoading = false;

  /*
   * Gets or sets a value indicating whether this data source can be enabled via a checkbox in the Data Catalog Tab.
   * This property is observable.
   * @type {Boolean}
   */
  this.isEnableable = true;

  /**
   * Gets or sets a value indicating whether this data source can be shown on the map (as opposed to a time-series dataset,
   * for instance, which can only be shown in a chart).
   * This property is observable.
   * @type {Boolean}
   */
  this.isMappable = true;

  /**
   * Gets or sets a value indicating whether this data source should show an info icon. This property is observable.
   * @type {Boolean}
   */
  this.showsInfo = true;

  /**
   * Gets or sets a message to show when this item is enabled for the first time in order to call attention to the Now Viewing panel.
   * @type {String}
   */
  this.nowViewingMessage = undefined;

  /**
   * Gets or sets a template to display message in a info box.
   * May be a string or an object with template, name and/or partials properties.
   * @type {String|Object}
   */
  this.featureInfoTemplate = undefined;

  /**
   * The maximum number of features whose information can be shown at one time in the Feature Info Panel, from this item.
   * Defaults to terria.configParameters.defaultMaximumShownFeatureInfos
   * @type {Number}
   */
  this.maximumShownFeatureInfos =
    terria.configParameters.defaultMaximumShownFeatureInfos;

  /**
   * Gets or sets a value indicating whether the map will automatically zoom to this catalog item when it is enabled.
   *
   * Note that within a single init source:
   *
   * * Catalog items with both `isEnabled` and `zoomOnEnable` set to true will override the top-level `initialCamera` property.
   * * If multiple catalog items have both `isEnabled` and `zoomOnEnable` set to true, it is undefined which one will affect the camera.
   *
   * In the case of multiple init sources, however, the camera will reflect whatever happens in the _last_ init source, whether
   * it is a result of a `zoomOnEnable` or an `initialCamera`,
   * @type {Boolean}
   * @default false
   */
  this.zoomOnEnable = false;

  /**
   * Options for formatting current time and timeline tic labels. Options are:
   *    currentTime   // Current time in time slider will be shown in this format. For example "mmmm yyyy" for Jan 2016.
   *    timelineTic   // Timeline tics will have this label. For example "yyyy" will cause each tic to be labelled with the year.
   * @type {Object}
   */
  this.dateFormat = {};

  /**
   * Gets or sets a flag indicating whether imagery should be displayed using this item's own clock (currentTime, multiplier),
   * or, if false, the terria clock (whose current time is shown in the timeline UI). Default false.
   * This property is observable.
   * @type {Boolean}
   */
  this.useOwnClock = false;

  /**
   * Gets or sets a flag indicating whether the preview on the Add Data panel should be disabled. This is useful when
   * the preview will be very slow to load.
   */
  this.disablePreview = false;

  // _currentTime is effectively a view of clock.currentTime. It is defined as a separate state (mirror state) so that
  // it can be an independent knockout observable with all of the machinary that implies for free, without tracking a sub
  // property of a cesium primitive (namely clock.currentTime) which seems kind of nasty.
  this._currentTime = undefined;
  this._legendUrl = undefined;
  this._legendUrls = undefined;
  this._dataUrl = undefined;
  this._dataUrlType = undefined;

  knockout.track(this, [
    "rectangle",
    "dataCustodian",
    "attribution",
    "metadataUrl",
    "isEnabled",
    "isShown",
    "isLegendVisible",
    "clock",
    "_currentTime",
    "isLoading",
    "isMappable",
    "nowViewingMessage",
    "zoomOnEnable",
    "isEnableable",
    "showsInfo",
    "nowViewingMessage",
    "url",
    "_legendUrl",
    "_legendUrls",
    "_dataUrl",
    "_dataUrlType",
    "nowViewingCatalogItem",
    "useOwnClock",
    "disablePreview"
  ]);

  var evaluatingLegendUrl = false;

  /**
   * Gets or sets the URLs of the legends to show when this catalog item is enabled.
   * @member {LegendUrl} legendUrls
   * @memberOf CatalogItem.prototype
   */
  knockout.defineProperty(this, "legendUrls", {
    get: function() {
      if (!defined(this._legendUrls) || this._legendUrls.length === 0) {
        var legendUrl = evaluatingLegendUrl ? undefined : this.legendUrl;
        if (
          defined(legendUrl) &&
          defined(legendUrl.url) &&
          legendUrl.url.length > 0
        ) {
          return [legendUrl];
        }
      }
      return this._legendUrls;
    },
    set: function(value) {
      this._legendUrls = value;
      this._legendUrl = undefined;
    }
  });

  /**
   * Gets or sets the URL of the legend to show when this catalog item is enabled.  If there is more than one
   * legend URL, this property returns the first one.
   * @member {LegendUrl} legendUrl
   * @memberOf CatalogItem.prototype
   */
  knockout.defineProperty(this, "legendUrl", {
    get: function() {
      evaluatingLegendUrl = true;
      try {
        if (defined(this._legendUrl)) {
          return this._legendUrl;
        } else {
          var legendUrls = this.legendUrls;
          if (defined(legendUrls)) {
            return this.legendUrls[0];
          }
          return undefined;
        }
      } finally {
        evaluatingLegendUrl = false;
      }
    },
    set: function(value) {
      this._legendUrl = value;
      this._legendUrls = undefined;
    }
  });

  /**
   * Gets or sets the URL from which this data item's raw data can be retrieved, or undefined if raw data for
   * this data item is not available.  This property is observable.
   * @member {String} dataUrl
   * @memberOf CatalogItem.prototype
   */
  knockout.defineProperty(this, "dataUrl", {
    get: function() {
      // dataUrl is derived from url if not explicitly specified.
      if (defined(this._dataUrl)) {
        return this._dataUrl;
      }

      return this.url;
    },
    set: function(value) {
      this._dataUrl = value;
    }
  });

  /**
   * Gets or sets the type of the {@link CatalogItem#dataUrl}, or undefined if raw data for this data
   * source is not available.  This property is observable.
   * Valid values are:
   *  * `direct` - A direct link to the data.
   *  * `wfs` - A Web Feature Service (WFS) base URL.  If {@link CatalogItem#dataUrl} is not
   *            specified, the base URL will be this data item's URL.
   *  * `wfs-complete` - A complete, ready-to-use link to download features from a WFS server.
   *  * `none` - There is no data link.
   * @member {String} dataUrlType
   * @memberOf CatalogItem.prototype
   */
  knockout.defineProperty(this, "dataUrlType", {
    get: function() {
      if (defined(this._dataUrlType)) {
        return this._dataUrlType;
      } else {
        return "direct";
      }
    },
    set: function(value) {
      this._dataUrlType = value;
    }
  });

  /**
   * Gets / sets the CatalogItems current time.
   *
   * This property is an observable version of clock.currentTime, they will always have the same value.
   *
   * When setting the currentTime through this property the correct clock (terria.clock or this.clock) is updated
   * depending on whether .useOwnClock is true or false so that the catalog items state will reflect the new time
   * correctly.
   *
   * The get component of this property is effectively an interface adapter for clock.definitionChanged which changes
   * the structure from an Event when the current time changes to a knockout property which can be observed.
   *
   * @member {JulianDate} currentTime
   * @memberOf CatalogItem.prototype
   */
  knockout.defineProperty(this, "currentTime", {
    get: function() {
      return this._currentTime;
    },
    set: function(value) {
      // Note: We don't explicitly need to set this._currentTime since our other machinery regarding updating
      // this._currentTime should take care of this.
      if (this.useOwnClock) {
        updateCurrentTime(this, value);
      } else {
        this.terria.clock.currentTime = JulianDate.clone(value);
        this.terria.clock.tick();
      }

      if (this._currentChartData) {
        const index = this.intervals.indexOf(value);
        this.selectedIndex = index;
        this._currentChartData.selectedIndex = index;
        if (this._currentChartData.renderer)
          this._currentChartData.renderer.highlightMoment(index);
      }
    }
  });

  /**
   * Gets the CatalogItems current time as the discrete time that the CatalogItem has information for.
   * Returns undefined if the clock is beyond the range of the intervals specified by the layer.
   * Returns undefined if it is not possible to query the time (i.e. the item doesn't have a clock, availableDates or
   * intervals).
   *
   * See also clampedDiscreteTime if you want the discrete time that is clamped to the first / last value if the current
   * time is beyond the range of the intervals specified by the item.
   *
   * @member {Date} discreteTime
   * @memberOf CatalogItem.prototype
   */
  knockout.defineProperty(this, "discreteTime", {
    get: function() {
      return timeAtIndex(this, getCurrentIndex(this));
    }
  });

  /**
   * Gets the CatalogItems current time as the discrete time that the CatalogItem has information for.
   * Returns the nearest time in-range if the clock is beyond the range of the intervals specified by the layer.
   * Returns undefined if it is not possible to query the time (i.e. the item doesn't have a clock, availableDates or
   * intervals).
   *
   * See also discreteTime if you want the discrete time that is undefined if the current time is beyond the range of
   * the intervals specified by the item.
   *
   * @member {Date} clampedDiscreteTime
   * @memberOf CatalogItem.prototype
   */
  knockout.defineProperty(this, "clampedDiscreteTime", {
    get: function() {
      if (defined(this.discreteTime)) {
        return this.discreteTime;
      }

      if (!hasValidCurrentTimeAndIntervals(this)) {
        return undefined;
      }

      if (timeIsBeforeStart(this, this.currentTime)) {
        return timeAtIndex(this, 0);
      }

      if (timeIsAfterStop(this, this.currentTime)) {
        return timeAtIndex(this, this.intervals.length - 1);
      }

      return undefined;
    }
  });

  // A property which defines when we are using the terria clock.
  // We define this as a knockout property so that we can watch for changes to the propery triggered by observables
  // that it depends on and update the subscription (watcher) on the terria.clock when the state changes.
  knockout.defineProperty(this, "_mirroringTerriaClock", {
    get: function() {
      return this.isEnabled && !this.useOwnClock && defined(this.clock);
    }
  });

  // A property which defines when the clock is defined.
  // We define this as a knockout property so that we can watch for all changes to the propery including when
  // .clock is overriden from derrived classes (and not just base CatalogItem.clock).
  knockout.defineProperty(this, "_clockDefined", {
    get: function() {
      return defined(this.clock);
    }
  });

  knockout.getObservable(this, "_clockDefined").subscribe(function(newValue) {
    clockChanged(this);
  }, this);

  knockout.getObservable(this, "isEnabled").subscribe(function(newValue) {
    isEnabledChanged(this);
  }, this);

  knockout.getObservable(this, "isShown").subscribe(function(newValue) {
    isShownChanged(this);
  }, this);

  knockout
    .getObservable(this, "_mirroringTerriaClock")
    .subscribe(function(newValue) {
      updateTerriaClockWatcher(this);
    }, this);

  knockout.getObservable(this, "useOwnClock").subscribe(function(newValue) {
    useOwnClockChanged(this);
  }, this);
};

inherit(CatalogMember, CatalogItem);

Object.defineProperties(CatalogItem.prototype, {
  /**
   * Gets a value indicating whether this data item, when enabled, can be reordered with respect to other data items.
   * Data items that cannot be reordered are typically displayed above reorderable data items.
   * @memberOf CatalogItem.prototype
   * @type {Boolean}
   */
  supportsReordering: {
    get: function() {
      return false;
    }
  },

  /**
   * Gets a value indicating whether the visibility of this data item can be toggled.
   * @memberOf CatalogItem.prototype
   * @type {Boolean}
   */
  supportsToggleShown: {
    get: function() {
      return true;
    }
  },

  /**
   * Gets a value indicating whether the opacity of this data item can be changed.
   * @memberOf CatalogItem.prototype
   * @type {Boolean}
   */
  supportsOpacity: {
    get: function() {
      return false;
    }
  },

  /**
   * Gets a value indicating whether this layer can be split so that it is
   * only shown on the left or right side of the screen.
   * @memberOf CatalogItem.prototype
   */
  supportsSplitting: {
    get: function() {
      return false;
    }
  },

  /**
   * Gets a value indicating whether this data item has a legend.
   * @memberOf CatalogItem.prototype
   * @type {Boolean}
   */
  hasLegend: {
    get: function() {
      return defined(this.legendUrl);
    }
  },

  /**
   * Returns true if this item currently has a rectangle to zoom to. Depends on observable properties, and so updates once loaded.
   * @memberOf CatalogItem.prototype
   * @type {Boolean}
   */
  canZoomTo: {
    get: function() {
      if (defined(this.nowViewingCatalogItem)) {
        return this.nowViewingCatalogItem.canZoomTo;
      }
      return defined(this.rectangle);
    }
  },

  /**
   * Gets the metadata associated with this data item and the server that provided it, if applicable.
   * @memberOf CatalogItem.prototype
   * @type {Metadata}
   */
  metadata: {
    get: function() {
      return CatalogItem.defaultMetadata;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf CatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return CatalogItem.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf CatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return CatalogItem.defaultSerializers;
    }
  },

  /**
   * Gets the set of names of the properties to be serialized for this object for a share link.
   * @memberOf CatalogItem.prototype
   * @type {String[]}
   */
  propertiesForSharing: {
    get: function() {
      return CatalogItem.defaultPropertiesForSharing;
    }
  }
});

/**
 * Gets or sets the default metadata to use for data items that don't provide anything better from their
 * {@link CatalogItem#metadata} property.  The default simply indicates that no metadata is available.
 * @type {Metadata}
 */
CatalogItem.defaultMetadata = new Metadata();
CatalogItem.defaultMetadata.isLoading = false;
CatalogItem.defaultMetadata.dataSourceErrorMessage = i18next.t(
  "models.catalog.dataSourceErrorMessage"
);
CatalogItem.defaultMetadata.serviceErrorMessage = i18next.t(
  "models.catalog.serviceErrorMessage"
);

Object.freeze(CatalogItem.defaultMetadata);

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
CatalogItem.defaultUpdaters = clone(CatalogMember.defaultUpdaters);
CatalogItem.defaultUpdaters.rectangle = function(
  catalogItem,
  json,
  propertyName
) {
  if (defined(json.rectangle)) {
    catalogItem.rectangle = Rectangle.fromDegrees(
      json.rectangle[0],
      json.rectangle[1],
      json.rectangle[2],
      json.rectangle[3]
    );
  } else {
    catalogItem.rectangle = Rectangle.MAX_VALUE;
  }
};

CatalogItem.defaultUpdaters.attribution = function(
  catalogItem,
  json,
  prototypeName
) {
  if (defined(json.attribution)) {
    if (
      typeof json.attribution === "object" &&
      json.attribution.text &&
      json.attribution.link
    ) {
      const a = document.createElement("a");
      a.href = json.attribution.link;
      a.target = "_blank";
      a.innerText = json.attribution.text;
      catalogItem.attribution = new Credit(a.outerHTML);
    } else if (typeof json.attribution === "object" && json.attribution.text) {
      catalogItem.attribution = new Credit(json.attribution.text);
    } else if (typeof json.attribution === "string") {
      catalogItem.attribution = new Credit(json.attribution);
    }
  }
};

CatalogItem.defaultUpdaters.legendUrl = function(
  catalogItem,
  json,
  prototypeName
) {
  if (defined(json.legendUrl)) {
    var url, mimeType;

    if (typeof json.legendUrl === "string") {
      url = json.legendUrl;
    } else {
      url = json.legendUrl.url;
      mimeType = json.legendUrl.mimeType;
    }

    catalogItem.legendUrl = new LegendUrl(url, mimeType);
  }
};

CatalogItem.defaultUpdaters.legendUrls = function(
  catalogItem,
  json,
  prototypeName
) {
  if (defined(json.legendUrls)) {
    catalogItem.legendUrls = json.legendUrls.map(function(legendUrl) {
      var url, mimeType;

      if (typeof legendUrl === "string") {
        url = legendUrl;
      } else {
        url = legendUrl.url;
        mimeType = legendUrl.mimeType;
      }

      return new LegendUrl(url, mimeType);
    });
  }
};

CatalogItem.defaultUpdaters.nowViewingCatalogItem = function(
  catalogItem,
  json,
  prototypeName,
  options
) {
  if (defined(json.nowViewingCatalogItem)) {
    return when(catalogItem.load()).then(function() {
      if (!defined(catalogItem.nowViewingCatalogItem)) {
        catalogItem.nowViewingCatalogItem = createCatalogMemberFromType(
          json.nowViewingCatalogItem.type,
          catalogItem.terria
        );
      }
      return catalogItem.nowViewingCatalogItem.updateFromJson(
        json.nowViewingCatalogItem,
        options
      );
    });
  }
};

CatalogItem.defaultUpdaters.currentTime = function(
  catalogItem,
  json,
  propertyName
) {
  // Do not update .currentTime as it is a view of .clock.currentTime.
};

CatalogItem.defaultUpdaters.discreteTime = function(
  catalogItem,
  json,
  propertyName
) {
  // Do not update .currentTime as it is a view of .clock.currentTime.
};

Object.freeze(CatalogItem.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CatalogItem.defaultSerializers = clone(CatalogMember.defaultSerializers);
CatalogItem.defaultSerializers.rectangle = function(
  catalogItem,
  json,
  propertyName
) {
  if (defined(catalogItem.rectangle)) {
    json.rectangle = [
      CesiumMath.toDegrees(catalogItem.rectangle.west),
      CesiumMath.toDegrees(catalogItem.rectangle.south),
      CesiumMath.toDegrees(catalogItem.rectangle.east),
      CesiumMath.toDegrees(catalogItem.rectangle.north)
    ];
  }
};

// Serialize the underlying properties instead of the public views of them.
CatalogItem.defaultSerializers.legendUrl = function(
  catalogItem,
  json,
  propertyName
) {
  if (defined(catalogItem._legendUrl)) {
    json.legendUrl = catalogItem._legendUrl;
  }
};

CatalogItem.defaultSerializers.legendUrls = function(
  catalogItem,
  json,
  propertyName
) {
  if (defined(catalogItem._legendUrls) && catalogItem._legendUrls.length > 0) {
    json.legendUrls = catalogItem._legendUrls;
  }
};

CatalogItem.defaultSerializers.attribution = function(
  catalogItem,
  json,
  propertyName
) {
  if (defined(catalogItem.attribution)) {
    if (defined(catalogItem.attribution.link)) {
      json.attribution = {
        text: catalogItem.attribution.text,
        link: catalogItem.attribution.link
      };
    } else {
      json.attribution = catalogItem.attribution.text;
    }
  }
};

CatalogItem.defaultSerializers.dataUrl = function(
  catalogItem,
  json,
  prototypeName
) {
  if (defined(catalogItem._dataUrl)) {
    json.dataUrl = catalogItem._dataUrl;
  }
};

CatalogItem.defaultSerializers.dataUrlType = function(
  catalogItem,
  json,
  prototypeName
) {
  if (defined(catalogItem._dataUrlType)) {
    json.dataUrlType = catalogItem._dataUrlType;
  }
};

CatalogItem.defaultSerializers.nowViewingCatalogItem = function(
  catalogItem,
  json,
  prototypeName,
  options
) {
  if (catalogItem.isEnabled && defined(catalogItem.nowViewingCatalogItem)) {
    json.nowViewingCatalogItem = catalogItem.nowViewingCatalogItem.serializeToJson(
      options
    );
  }
};

CatalogItem.defaultSerializers.currentTime = function(
  catalogItem,
  json,
  propertyName
) {
  // Do not serialise .currentTime as it is a view of .clock.currentTime.
};

CatalogItem.defaultSerializers.discreteTime = function(
  catalogItem,
  json,
  propertyName
) {
  // Do not serialise .discreteTime as it is a view of .clock.currentTime.
};

CatalogItem.defaultSerializers.clampedDiscreteTime = function(
  catalogItem,
  json,
  propertyName
) {
  // Do not serialise .clampedDiscreteTime as it is a view of .clock.currentTime.
};

Object.freeze(CatalogItem.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object
 * for a share link.
 * @type {String[]}
 */
CatalogItem.defaultPropertiesForSharing = clone(
  CatalogMember.defaultPropertiesForSharing
);
CatalogItem.defaultPropertiesForSharing.push("isEnabled");
CatalogItem.defaultPropertiesForSharing.push("isShown");
CatalogItem.defaultPropertiesForSharing.push("isLegendVisible");
CatalogItem.defaultPropertiesForSharing.push("nowViewingIndex");
CatalogItem.defaultPropertiesForSharing.push("nowViewingCatalogItem");
CatalogItem.defaultPropertiesForSharing.push("useOwnClock");

Object.freeze(CatalogItem.defaultPropertiesForSharing);

/**
 * Loads this catalog item, if it's not already loaded.  It is safe to
 * call this method multiple times.  The {@link CatalogItem#isLoading} flag will be set while the load is in progress.
 * Derived classes should implement {@link CatalogItem#_load} to perform the actual loading for the item.
 * Derived classes may optionally implement {@link CatalogItem#_getValuesThatInfluenceLoad} to provide an array containing
 * the current value of all properties that influence this item's load process.  Each time that {@link CatalogItem#load}
 * is invoked, these values are checked against the list of values returned last time, and {@link CatalogItem#_load} is
 * invoked again if they are different.  If {@link CatalogItem#_getValuesThatInfluenceLoad} is undefined or returns an
 * empty array, {@link CatalogItem#_load} will only be invoked once, no matter how many times
 * {@link CatalogItem#load} is invoked.
 *
 * @returns {Promise} A promise that resolves when the load is complete, or undefined if the item is already loaded.
 *
 */
CatalogItem.prototype.load = function() {
  var parentPromise = CatalogMember.prototype.load.call(this);

  if (parentPromise) {
    return parentPromise
      .then(
        function(loadResult) {
          if (loadResult instanceof CatalogItem) {
            this.nowViewingCatalogItem = loadResult;
            loadResult.creatorCatalogItem = this;
          }
          this.terria.currentViewer.notifyRepaintRequired();
        }.bind(this)
      )
      .otherwise(
        function(e) {
          this.isEnabled = false;
          throw e; // keep throwing this so we can chain more otherwises.
        }.bind(this)
      );
  }
};

/**
 * Enables this catalog item, and returns a promise that resolves when the load process, if any, completes.
 * @return {Promise} The promise.
 */
CatalogItem.prototype.loadAndEnable = function() {
  this.isEnabled = true;
  return this._loadingPromise;
};

/**
 * When implemented in a derived class, this method loads the item.  The base class implementation does nothing.
 * This method should not be called directly; call {@link CatalogItem#load} instead.
 * @return {Promise} A promise that resolves when the load is complete.
 * @protected
 */
CatalogItem.prototype._load = function() {
  return when();
};

var emptyArray = Object.freeze([]);

/**
 * When implemented in a derived class, gets an array containing the current value of all properties that
 * influence this item's load process.  See {@link CatalogItem#load} for more information on when and
 * how this is used.  The base class implementation returns an empty array.
 * @return {Array} The array of values that influence the load process.
 * @protected
 */
CatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  // In the future, we can implement auto-reloading when any of these properties change.  Just create a knockout
  // computed property that calls this method and subscribe to change notifications on that computed property.
  // (Will need to use the rateLimit extender, presumably).
  return emptyArray;
};

/**
 * Toggles the {@link CatalogItem#isEnabled} property of this item.  If it is enabled, calling this method
 * will disable it.  If it is disabled, calling this method will enable it.
 *
 * @returns {Boolean} true if the item is now enabled, false if it is now disabled.
 */
CatalogItem.prototype.toggleEnabled = function() {
  this.isEnabled = !this.isEnabled;
  return this.isEnabled;
};

/**
 * Toggles the {@link CatalogItem#isShown} property of this item.  If it is shown, calling this method
 * will hide it.  If it is hidden, calling this method will show it.
 *
 * @returns {Boolean} true if the item is now shown, false if it is now hidden.
 */
CatalogItem.prototype.toggleShown = function() {
  this.isShown = !this.isShown;
  return this.isShown;
};

/**
 * Toggles the {@link CatalogItem#isLegendVisible} property of this item.  If it is visible, calling this
 * method will hide it.  If it is hidden, calling this method will make it visible.
 * @return {Boolean} true if the legend is now visible, false if it is now hidden.
 */
CatalogItem.prototype.toggleLegendVisible = function() {
  this.isLegendVisible = !this.isLegendVisible;
  return this.isLegendVisible;
};

var scratchRectangle = new Rectangle();

/**
 * Moves the camera so that the item's bounding rectangle is visible.  If {@link CatalogItem#rectangle} is
 * undefined or covers more than about half the world in the longitude direction, or if the data item is not enabled
 * or not shown, this method does nothing.  Because the zoom may happen asynchronously (for example, if the item's
 * rectangle is not yet known), this method returns a Promise that resolves when the zoom animation starts.
 * @returns {Promise} A promise that resolves when the zoom animation starts.
 */
CatalogItem.prototype.zoomTo = function() {
  var that = this;
  return when(this.load(), function() {
    if (defined(that.nowViewingCatalogItem)) {
      return that.nowViewingCatalogItem.zoomTo();
    }

    if (!defined(that.rectangle)) {
      return;
    }

    var rect = Rectangle.clone(that.rectangle, scratchRectangle);

    if (rect.east - rect.west > 3.14) {
      rect = Rectangle.clone(that.terria.homeView.rectangle, scratchRectangle);
      console.log("Extent is wider than world so using homeView.");
    }

    var terria = that.terria;
    terria.analytics.logEvent("dataSource", "zoomTo", that.path);

    var epsilon = CesiumMath.EPSILON3;

    if (rect.east === rect.west) {
      rect.east += epsilon;
      rect.west -= epsilon;
    }

    if (rect.north === rect.south) {
      rect.north += epsilon;
      rect.south -= epsilon;
    }
    return terria.currentViewer.zoomTo(rect);
  });
};

/**
 * Uses the {@link CatalogItem#clock} settings from this data item.  If this data item
 * has no clock settings, or has the useOwnClock property true, this method does nothing.
 * Because the clock update may happen asynchronously (for example, if the item's clock parameters are not yet known),
 * this method returns a Promise that resolves when the clock has been updated.
 * @returns {Promise} A promise that resolves when the clock has been updated.
 */
CatalogItem.prototype.useClock = function() {
  var that = this;
  return when(this.load(), function() {
    if (defined(that.nowViewingCatalogItem)) {
      return that.nowViewingCatalogItem.useClock();
    }

    if (defined(that.clock)) {
      if (that.isEnabled && that.isShown && !that.useOwnClock) {
        that.terria.timeSeriesStack.addLayerToTop(that);
      } else {
        that.terria.timeSeriesStack.removeLayer(that);
      }
    }
  });
};

/**
 * Move the current time to the next time interval.
 */
CatalogItem.prototype.moveToNextTime = function() {
  updateIndex(this, nextIndex(this));
};

/**
 * Move the current time to the previous time interval.
 */
CatalogItem.prototype.moveToPreviousTime = function() {
  updateIndex(this, previousIndex(this));
};

/**
 * Whether it is possible to move to a time interval after the current time.
 * @returns {Boolean} True if it is possible.
 */
CatalogItem.prototype.isNextTimeAvaliable = function() {
  return defined(nextIndex(this));
};

/**
 * Whether it is possible to move to a time interval before the current time.
 * @returns {Boolean} True if it is possible.
 */
CatalogItem.prototype.isPreviousTimeAvaliable = function() {
  return defined(previousIndex(this));
};

/**
 * Moves the camera so that the data item's bounding rectangle is visible, and updates the TerriaJS clock according to this
 * data item's clock settings.  This method simply calls {@link CatalogItem#zoomTo} and
 * {@link CatalogItem#useClock}.  Because the zoom and clock update may happen asynchronously (for example, if the item's
 * rectangle is not yet known), this method returns a Promise that resolves when the zoom animation starts and the clock
 * has been updated.
 * @returns {Promise} A promise that resolves when the clock has been updated and the zoom animation has started.
 */
CatalogItem.prototype.zoomToAndUseClock = function() {
  return when.all([this.zoomTo(), this.useClock()]);
};

/**
 * Enables this data item on the globe or map.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItem#isEnabled} property to true.
 * * Will not necessarily be called immediately when {@link CatalogItem#isEnabled} is set to true; it will be deferred until
 *   {@link CatalogItem#isLoading} is false.
 * * Should NOT also show the data item on the globe/map (see {@link CatalogItem#_show}), so in some cases it may not do
 *   anything at all.
 * * Calls {@link CatalogItem#_enableInCesium} or {@link CatalogItem#_enableInLeaflet} in the base-class implementation,
 *   depending on which viewer is active.  Derived classes that have identical enable logic for both viewers may override
 *   this method instead of the viewer-specific ones.
 * @protected
 */
CatalogItem.prototype._enable = function() {
  if (defined(this.nowViewingCatalogItem)) {
    this.nowViewingCatalogItem.isEnabled = true;
    return;
  }

  var terria = this.terria;

  if (defined(terria.cesium)) {
    terria.cesium.stoppedRendering = true;
    this._enableInCesium();
  }

  if (defined(terria.leaflet)) {
    this._enableInLeaflet();
  }
};

/**
 * Disables this data item on the globe or map.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItem#isEnabled} property to false.
 * * Will not be called if {@link CatalogItem#_enable} was not called (for example, because the previous call was deferred
 *   while the data item loaded, and the user disabled the data item before the load completed).
 * * Will only be called after {@link CatalogItem#_hide} when a shown data item is disabled.
 * * Calls {@link CatalogItem#_disableInCesium} or {@link CatalogItem#_disableInLeaflet} in the base-class implementation,
 *   depending on which viewer is active.  Derived classes that have identical disable logic for both viewers may override
 *   this method instead of the viewer-specific ones.
 * @protected
 */
CatalogItem.prototype._disable = function() {
  if (defined(this.nowViewingCatalogItem)) {
    this.nowViewingCatalogItem.isEnabled = false;
    return;
  }

  var terria = this.terria;

  if (defined(terria.cesium)) {
    this._disableInCesium();
  }

  if (defined(terria.leaflet)) {
    this._disableInLeaflet();
  }
};

/**
 * Shows this data item on the globe or map.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItem#isShown} property to true.
 * * Will only be called after {@link CatalogItem#_enable}; you can count on that method having been called first.
 * * Will not necessarily be called immediately when {@link CatalogItem#isShown} is set to true; it will be deferred until
 *   {@link CatalogItem#isLoading} is false.
 * * Calls {@link CatalogItem#_showInCesium} or {@link CatalogItem#_showInLeaflet} in the base-class implementation,
 *   depending on which viewer is active.  Derived classes that have identical show logic for both viewers
 *    may override this method instead of the viewer-specific ones.
 * @protected
 */
CatalogItem.prototype._show = function() {
  if (defined(this.nowViewingCatalogItem)) {
    this.nowViewingCatalogItem.isShown = true;
    return;
  }

  var terria = this.terria;

  if (defined(terria.cesium)) {
    this._showInCesium();
  }

  if (defined(terria.leaflet)) {
    this._showInLeaflet();
  }
};

/**
 * Hides this data item on the globe or map.  This method:
 * * Should not be called directly.  Instead, set the {@link CatalogItem#isShown} property to false.
 * * Will not be called if {@link CatalogItem#_show} was not called (for example, because the previous call was deferred
 *   while the data item loaded, and the user hid the data item before the load completed).
 * * Calls {@link CatalogItem#_hideInCesium} or {@link CatalogItem#_hideInLeaflet} in the base-class implementation,
 *   depending on which viewer is active.  Derived classes that have identical hide logic for both viewers may override
 *   this method instead of the viewer-specific ones.
 * @protected
 */
CatalogItem.prototype._hide = function() {
  if (defined(this.nowViewingCatalogItem)) {
    this.nowViewingCatalogItem.isShown = false;
    return;
  }

  var terria = this.terria;

  if (defined(terria.cesium)) {
    this._hideInCesium();
  }

  if (defined(terria.leaflet)) {
    this._hideInLeaflet();
  }
};

/**
 * When implemented in a derived class, enables this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItem#isEnabled} property to true.  See
 * {@link CatalogItem#_enable} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._enableInCesium = function() {
  throw new DeveloperError(
    "_enableInCesium must be implemented in the derived class."
  );
};

/**
 * When implemented in a derived class, disables this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItem#isEnabled} property to false.  See
 * {@link CatalogItem#_disable} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._disableInCesium = function() {
  throw new DeveloperError(
    "_disableInCesium must be implemented in the derived class."
  );
};

/**
 * When implemented in a derived class, shows this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItem#isShown} property to true.  See
 * {@link CatalogItem#_show} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._showInCesium = function() {
  throw new DeveloperError(
    "_showInCesium must be implemented in the derived class."
  );
};

/**
 * When implemented in a derived class, hides this data item on the Cesium globe.  You should not call this
 * directly, but instead set the {@link CatalogItem#isShown} property to false.  See
 * {@link CatalogItem#_hide} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._hideInCesium = function() {
  throw new DeveloperError(
    "_hideInCesium must be implemented in the derived class."
  );
};

/**
 * When implemented in a derived class, enables this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItem#isEnabled} property to true.  See
 * {@link CatalogItem#_enable} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._enableInLeaflet = function() {
  throw new DeveloperError(
    "enableInLeaflet must be implemented in the derived class."
  );
};

/**
 * When implemented in a derived class, disables this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItem#isEnabled} property to false.  See
 * {@link CatalogItem#_disable} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._disableInLeaflet = function() {
  throw new DeveloperError(
    "disableInLeaflet must be implemented in the derived class."
  );
};

/**
 * When implemented in a derived class, shows this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItem#isShown} property to true.  See
 * {@link CatalogItem#_show} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._showInLeaflet = function() {
  throw new DeveloperError(
    "_showInLeaflet must be implemented in the derived class."
  );
};

/**
 * When implemented in a derived class, hides this data item on the Leaflet map.  You should not call this
 * directly, but instead set the {@link CatalogItem#isShown} property to false.  See
 * {@link CatalogItem#_hide} for more information.
 * @abstract
 * @protected
 */
CatalogItem.prototype._hideInLeaflet = function() {
  throw new DeveloperError(
    "_hideInLeaflet must be implemented in the derived class."
  );
};

CatalogItem.prototype.enableWithParents = function() {
  this.isEnabled = true;

  if (this.parent) {
    this.parent.enableWithParents();
  }
};

/**
 * Handles an error in loading a tile. If this function returns a promise that resolves successfully,
 * the tile request will be retried. If the returned promise rejects, it must reject with an instance
 * of `RequestErrorEvent` with the details of the failure, and the default handling of tile
 * failures will be used.  The default handling takes into account the `treat404AsError`, `treat403AsError`,
 * and `ignoreUnknownTileErrors` properties.  The default implementation simply returns `detailsRequestPromise`.
 *
 * @param {Promise} detailsRequestPromise A promise which is the result of a simple call to `loadWithXhr` for the URL
 *                  that failed. If it resolves, it will resolve to the successfully-download content of the tile URL,
 *                  as text. If it rejects, it will reject with a `RequestErrorEvent`.
 * @param {ImageryProvider} imageryProvider The imagery provider that generated the failed request.
 * @param {Number} x The x coordinate of the failed tile.
 * @param {Number} y The y coordinate of the failed tile.
 * @param {Number} level The level of the failed tile.
 * @returns {Promise} A promise, as described above.
 */
CatalogItem.prototype.handleTileError = function(
  detailsRequestPromise,
  imageryProvider,
  x,
  y,
  level
) {
  return detailsRequestPromise;
};

function clockChanged(catalogItem) {
  removeCurrentTimeSubscription(catalogItem);

  if (defined(catalogItem.clock)) {
    catalogItem._removeCurrentTimeChange = catalogItem.clock.definitionChanged.addEventListener(
      function() {
        catalogItem._currentTime = JulianDate.clone(
          catalogItem.clock.currentTime
        );
      }
    );

    catalogItem._currentTime = JulianDate.clone(catalogItem.clock.currentTime);
  }
}

// Removes catalogItem.clock.definitionChanged subscriptions.
function removeCurrentTimeSubscription(catalogItem) {
  if (defined(catalogItem._removeCurrentTimeChange)) {
    catalogItem._removeCurrentTimeChange();
    catalogItem._removeCurrentTimeChange = undefined;
  }
}

function isEnabledChanged(catalogItem) {
  var terria = catalogItem.terria;

  if (defined(catalogItem.creatorCatalogItem)) {
    catalogItem.creatorCatalogItem.isEnabled = catalogItem.isEnabled;
  }

  if (catalogItem.isEnabled) {
    terria.nowViewing.add(catalogItem);

    // Load this catalog item's data (if we haven't already) when it is enabled.
    // Don't actually enable until the load finishes.
    // Be careful not to call _enable multiple times or to call _enable
    // after the item has already been disabled.
    if (!defined(catalogItem._loadForEnablePromise)) {
      var resolvedOrRejected = false;
      var loadPromise = when
        .all([catalogItem.load(), catalogItem.waitForDisclaimerIfNeeded()])
        .then(function() {
          if (catalogItem.isEnabled) {
            // If there's a separate now viewing item, remove this catalog item from the
            // now viewing list, if it exists.
            if (defined(catalogItem.nowViewingCatalogItem)) {
              catalogItem.terria.nowViewing.items.remove(catalogItem);
            }

            catalogItem._enable();
            catalogItem.terria.currentViewer.notifyRepaintRequired();
            catalogItem.terria.currentViewer.addAttribution(
              catalogItem.attribution
            );
            if (defined(catalogItem.imageryLayer)) {
              catalogItem.imageryLayer.featureInfoTemplate =
                catalogItem.featureInfoTemplate;
            }

            // Zoom to this catalog item if requested.
            if (catalogItem.zoomOnEnable) {
              return catalogItem.zoomTo();
            }
          }
        });

      raiseErrorOnRejectedPromise(catalogItem.terria, loadPromise);

      loadPromise.always(function() {
        resolvedOrRejected = true;
        catalogItem._loadForEnablePromise = undefined;
      });

      // Make sure we know about it when the promise already resolved/rejected.
      catalogItem._loadForEnablePromise = resolvedOrRejected
        ? undefined
        : loadPromise;
    }

    catalogItem.isShown = true;

    terria.analytics.logEvent("dataSource", "added", catalogItem.path);
    catalogItem._enabledDate = Date.now();
  } else {
    catalogItem.isShown = false;

    // Disable this data item on the map, but only if the previous request to enable it has
    // actually gone through.
    if (!defined(catalogItem._loadForEnablePromise)) {
      catalogItem._disable();
      catalogItem.terria.currentViewer.removeAttribution(
        catalogItem.attribution
      );
    }

    terria.nowViewing.remove(catalogItem);

    var duration;
    if (catalogItem._enabledDate) {
      duration = ((Date.now() - catalogItem._enabledDate) / 1000.0) | 0;
    }
    terria.analytics.logEvent(
      "dataSource",
      "removed",
      catalogItem.path,
      duration
    );
  }

  catalogItem.terria.currentViewer.notifyRepaintRequired();
}

function isShownChanged(catalogItem) {
  if (defined(catalogItem.creatorCatalogItem)) {
    catalogItem.creatorCatalogItem.isShown = catalogItem.isShown;
  }

  if (catalogItem.isShown) {
    // If the item is not enabled, do that first.  This way things will work even if isShown is
    // deserialized before isEnabled.
    catalogItem.isEnabled = true;

    // If enabling is waiting on an async load, we need to wait on it, too.
    raiseErrorOnRejectedPromise(
      catalogItem.terria,
      when(catalogItem._loadForEnablePromise, function() {
        if (catalogItem.isEnabled && catalogItem.isShown) {
          catalogItem._show();
          catalogItem.useClock();
          catalogItem.terria.currentViewer.notifyRepaintRequired();
        }
      })
    );

    catalogItem.terria.analytics.logEvent(
      "dataSource",
      "shown",
      catalogItem.path
    );
    catalogItem._shownDate = Date.now();
  } else {
    // Hide this data item on the map, but only if the previous request to show it has
    // actually gone through.
    if (!defined(catalogItem._loadForEnablePromise)) {
      catalogItem._hide();
      catalogItem.useClock();
    }

    var duration;
    if (defined(catalogItem._shownDate)) {
      duration = ((Date.now() - catalogItem._shownDate) / 1000.0) | 0;
    } else if (catalogItem._enabledDate) {
      duration = ((Date.now() - catalogItem._enabledDate) / 1000.0) | 0;
    }
    catalogItem.terria.analytics.logEvent(
      "dataSource",
      "hidden",
      catalogItem.path,
      duration
    );
  }

  catalogItem.terria.currentViewer.notifyRepaintRequired();
}

/**
 * This function adds / removes a subscription to copy the time from the terria clock into the items clock when .useOwnClock is false.
 *
 * @param catalogItem The item to add / remove the terria clock watching subscription from.
 * @private
 */
function updateTerriaClockWatcher(catalogItem) {
  if (
    catalogItem._mirroringTerriaClock &&
    !defined(catalogItem._removeTerriaClockWatch)
  ) {
    // We are using the terria clock, add a subscription to copy the current time into this items clock.
    catalogItem._removeTerriaClockWatch = catalogItem.terria.clock.onTick.addEventListener(
      terriaClock => {
        if (
          !JulianDate.equals(
            terriaClock.currentTime,
            catalogItem.clock.currentTime
          )
        ) {
          updateCurrentTime(catalogItem, terriaClock.currentTime);
        }
      }
    );
  } else if (
    !catalogItem._mirroringTerriaClock &&
    defined(catalogItem._removeTerriaClockWatch)
  ) {
    // We are no longer using the terria clock, remove the subscription.
    catalogItem._removeTerriaClockWatch();
    catalogItem._removeTerriaClockWatch = undefined;
  }
}

/**
 * Updates the item.clock.currentTime using the value provided.
 * This function does this so that all clients subscribed to the items clock with DataSourceClock.definitionChanged are notified.
 *
 * @param catalogItem The CatalogItem to set the current time for.
 * @param updatedTime The new current time to use.
 * @private
 */
function updateCurrentTime(catalogItem, updatedTime) {
  if (defined(catalogItem.clock)) {
    catalogItem.clock.currentTime = JulianDate.clone(updatedTime);
  }
}

/**
 * Syncs the time between the terria.clock and the catalogItem.clock.
 *
 * The sync is performed in the direction that is required depending on the state change true->false / false->true of useOwnClock.
 *
 * @param catalogItem The CatalogItem to sync the time for.
 * @private
 */
function useOwnClockChanged(catalogItem) {
  // If we are changing the state, copy the time from the clock that was in use to the clock that will be in use.
  if (catalogItem._lastUseOwnClock !== catalogItem.useOwnClock) {
    // Check that both clocks are defined before syncing the time (they may not both be defined during load due to construction order).
    if (
      defined(catalogItem.clock) &&
      defined(catalogItem.terria) &&
      defined(catalogItem.terria.clock) &&
      defined(catalogItem.terria.clock.currentTime)
    ) {
      if (catalogItem.useOwnClock) {
        // This is probably not needed, since we should be doing it on update, but just do this here explicitly
        // to be sure it is immediately current before we change.
        updateCurrentTime(catalogItem, catalogItem.terria.clock.currentTime);
      } else {
        catalogItem.terria.clock.currentTime = JulianDate.clone(
          catalogItem.clock.currentTime
        );
      }

      catalogItem._lastUseOwnClock = catalogItem.useOwnClock;

      catalogItem.useClock();
    }
  }
}

function timeAtIndex(catalogItem, index) {
  if (
    defined(index) &&
    defined(catalogItem.intervals) &&
    index >= 0 &&
    index < catalogItem.intervals.length
  ) {
    return JulianDate.toDate(catalogItem.intervals.get(index).start);
  }

  return undefined;
}

function hasValidCurrentTimeAndIntervals(catalogItem) {
  return (
    defined(catalogItem.currentTime) &&
    defined(catalogItem.intervals) &&
    catalogItem.intervals.length !== 0
  );
}

function getCurrentIndex(catalogItem) {
  if (!hasValidCurrentTimeAndIntervals(catalogItem)) {
    return undefined;
  }

  if (
    timeIsBeforeStart(catalogItem, catalogItem.currentTime) ||
    timeIsAfterStop(catalogItem, catalogItem.currentTime)
  ) {
    return undefined;
  }

  return catalogItem.intervals.indexOf(catalogItem.currentTime);
}

function updateIndex(catalogItem, index) {
  if (!defined(index)) {
    return;
  }

  const time = timeAtIndex(catalogItem, index);

  if (defined(time)) {
    catalogItem.currentTime = JulianDate.fromDate(new Date(time));
  }
}

function timeIsBeforeStart(catalogItem, time) {
  const firstInterval = catalogItem.intervals.get(0);

  if (
    JulianDate.lessThan(time, firstInterval.start) ||
    (JulianDate.equals(time, firstInterval.start) &&
      !firstInterval.isStartIncluded)
  ) {
    return true;
  }

  return false;
}

function timeIsAfterStop(catalogItem, time) {
  const lastIndex = catalogItem.intervals.length - 1;
  const lastInterval = catalogItem.intervals.get(lastIndex);

  if (
    JulianDate.greaterThan(time, lastInterval.stop) ||
    (JulianDate.equals(time, lastInterval.stop) && !lastInterval.isStopIncluded)
  ) {
    return true;
  }

  return false;
}

function nextIndex(catalogItem) {
  if (!hasValidCurrentTimeAndIntervals(catalogItem)) {
    return undefined;
  }

  if (timeIsAfterStop(catalogItem, catalogItem.currentTime)) {
    return undefined;
  }

  if (timeIsBeforeStart(catalogItem, catalogItem.currentTime)) {
    return 0;
  }

  const index = getCurrentIndex(catalogItem);
  if (defined(index) && index < catalogItem.intervals.length - 1) {
    return index + 1;
  }

  return undefined;
}

function previousIndex(catalogItem) {
  if (!hasValidCurrentTimeAndIntervals(catalogItem)) {
    return undefined;
  }

  if (timeIsBeforeStart(catalogItem, catalogItem.currentTime)) {
    return undefined;
  }

  if (timeIsAfterStop(catalogItem, catalogItem.currentTime)) {
    return catalogItem.intervals.length - 1;
  }

  const index = getCurrentIndex(catalogItem);
  if (defined(index) && index > 0) {
    return index - 1;
  }

  return undefined;
}

module.exports = CatalogItem;
