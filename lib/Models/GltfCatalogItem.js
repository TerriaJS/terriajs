"use strict";

/*global require*/
const Axis = require("terriajs-cesium/Source/Scene/Axis").default;
const Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3").default;
const CatalogItem = require("./CatalogItem");
const clone = require("terriajs-cesium/Source/Core/clone").default;
const defined = require("terriajs-cesium/Source/Core/defined").default;
const Feature = require("./Feature");
const inherit = require("../Core/inherit");
const knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
const Metadata = require("./Metadata");
const proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
const Resource = require("terriajs-cesium/Source/Core/Resource").default;
const ShadowMode = require("terriajs-cesium/Source/Scene/ShadowMode").default;
const TerriaError = require("../Core/TerriaError");
const Transforms = require("terriajs-cesium/Source/Core/Transforms").default;
const when = require("terriajs-cesium/Source/ThirdParty/when").default;
var i18next = require("i18next").default;

/**
 * A {@link CatalogItem} representing a GL Transmission Format (glTF) model.
 * This catalog item will only be visible in the 3D (Cesium) view.
 *
 * @alias GltfCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the glTF data.
 */
function GltfCatalogItem(terria, url) {
  CatalogItem.call(this, terria);

  this._ModelClass = undefined;
  this._model = undefined;

  /**
   * Gets or sets the URL of the glTF model.
   * @type {String}
   */
  this.url = url;

  /**
   * Gets or sets the start time, as an ISO8601 string, to use when this catalog item is active
   * on the timeline. The time affects things like lighting and shadows. The
   * @type {String}
   */
  this.startTime = undefined;

  /**
   * Gets or sets the stop time, as an ISO8601 string, to use when this catalog item is active
   * on the timeline. The time affects things like lighting and shadows. The
   * @type {String}
   */
  this.stopTime = undefined;

  /**
   * Gets or sets the value of the animation timeline at start. Valid options in config file are:
   *     initialTimeSource: "present"                            // closest to today's date
   *     initialTimeSource: "start"                              // start of time range of animation
   *     initialTimeSource: "end"                                // end of time range of animation
   *     initialTimeSource: An ISO8601 date e.g. "2015-08-08"    // specified date or nearest if date is outside range
   * @type {String}
   */
  this.initialTimeSource = undefined;

  /**
   * Gets or sets the origin of the model, expressed as a longitude and latitude in degrees and
   * a height in meters. If this property is specified, the model's axes will have X pointing
   * East, Y pointing North, and Z pointing Up. If not specified, the model is located in the
   * Earth-Centered Earth-Fixed frame.
   * @type {{longitude: number, latitude: number, height: number}}
   */
  this.origin = undefined;

  /**
   * Indicates whether this tileset casts and receives shadows. Valid values are
   * 'NONE', 'BOTH', 'CAST', and 'RECEIVE'.
   * @type {String}
   * @default 'NONE'
   */
  this.shadows = "NONE";

  /**
   * Gets or sets the model's up-axis. By default models are y-up according to the glTF spec,
   * however geo-referenced models will typically be z-up. Valid values are 'X', 'Y', or 'Z'.
   * @type {String}
   * @default 'Z'
   */
  this.upAxis = "Z";

  /**
   * Gets the model's forward axis. By default, glTF 2.0 models are Z-forward according to the glTF spec, however older
   * glTF (1.0, 0.8) models used X-forward. Valid values are 'X' or 'Z'.
   * @type {String}
   * @default 'X'
   */
  this.forwardAxis = "X";

  /**
   * Gets or sets a URL template that is used to request additional feature information for this model.
   * @type {String}
   */
  this.featureInfoUrlTemplate = undefined;

  knockout.track(this, [
    "startTime",
    "stopTime",
    "initialTimeSource",
    "origin",
    "shadows",
    "upAxis",
    "forwardAxis",
    "featureInfoTemplate"
  ]);

  this._subscriptions = [];

  knockout.defineProperty(this, "_cesiumShadows", {
    get: function() {
      let result;

      switch (this.shadows.toLowerCase()) {
        case "none":
          result = ShadowMode.DISABLED;
          break;
        case "both":
          result = ShadowMode.ENABLED;
          break;
        case "cast":
          result = ShadowMode.CAST_ONLY;
          break;
        case "receive":
          result = ShadowMode.RECEIVE_ONLY;
          break;
        default:
          result = ShadowMode.DISABLED;
          break;
      }

      return result;
    }
  });

  knockout.defineProperty(this, "_cesiumUpAxis", {
    get: function() {
      return Axis.fromName(this.upAxis);
    }
  });

  knockout.defineProperty(this, "_cesiumForwardAxis", {
    get: function() {
      return Axis.fromName(this.forwardAxis);
    }
  });
}

inherit(CatalogItem, GltfCatalogItem);

Object.defineProperties(GltfCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf GltfCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "gltf";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'GL Transmission Format (glTF)'.
   * @memberOf GltfCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.gltf.name");
    }
  },

  /**
   * Gets the metadata associated with this data source and the server that provided it, if applicable.
   * @memberOf GltfCatalogItem.prototype
   * @type {Metadata}
   */
  metadata: {
    get: function() {
      var result = new Metadata();
      result.isLoading = false;
      result.dataSourceErrorMessage = i18next.t(
        "models.gltf.dataSourceErrorMessage"
      );
      result.serviceErrorMessage = i18next.t("models.gltf.serviceErrorMessage");
      return result;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf GltfCatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return GltfCatalogItem.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf GltfCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return GltfCatalogItem.defaultSerializers;
    }
  },

  /**
   * Returns true if we can zoom to this item. Depends on observable properties, and so updates once loaded.
   * @memberOf GltfCatalogItem.prototype
   * @type {Boolean}
   */
  canZoomTo: {
    get: function() {
      return true;
    }
  }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
GltfCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

Object.freeze(GltfCatalogItem.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
GltfCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

Object.freeze(GltfCatalogItem.defaultSerializers);

GltfCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url];
};

GltfCatalogItem.prototype._load = function() {
  var codeSplitDeferred = when.defer();

  var that = this;
  require.ensure(
    "terriajs-cesium/Source/Scene/Model",
    function() {
      that._ModelClass = require("terriajs-cesium/Source/Scene/Model").default;
      codeSplitDeferred.resolve();
    },
    "Cesium-Models"
  );

  return codeSplitDeferred.promise;
};

GltfCatalogItem.prototype._enableInCesium = function() {
  let modelMatrix;
  if (this.origin) {
    const origin = Cartesian3.fromDegrees(
      this.origin.longitude,
      this.origin.latitude,
      this.origin.height
    );
    modelMatrix = Transforms.eastNorthUpToFixedFrame(origin);
  }

  const options = {
    url: proxyCatalogItemUrl(this, this.url),
    show: false,
    modelMatrix: modelMatrix,
    upAxis: this._cesiumUpAxis,
    forwardAxis: this._cesiumForwardAxis,
    shadows: this._cesiumShadows
  };

  var model = this._ModelClass.fromGltf(options);
  model._catalogItem = this;

  this._model = model;

  this._subscriptions.forEach(subscription => subscription.dispose());
  this._subscriptions.length = 0;

  this._subscriptions.push(
    knockout.getObservable(this, "_cesiumShadows").subscribe(value => {
      this._model.shadows = this._cesiumShadows;
    })
  );

  this.terria.cesium.scene.primitives.add(this._model);
};

GltfCatalogItem.prototype._disableInCesium = function() {
  this._subscriptions.forEach(subscription => subscription.dispose());
  this._subscriptions.length = 0;

  if (defined(this._model)) {
    this.terria.cesium.scene.primitives.remove(this._model);
    this._model.destroy();
    this._model = undefined;
  }
};

GltfCatalogItem.prototype._enableInLeaflet = function() {
  // Nothing to be done.
};

GltfCatalogItem.prototype._disableInLeaflet = function() {
  // Nothing to be done.
};

GltfCatalogItem.prototype._showInCesium = function() {
  if (this._model) {
    this._model.show = true;
  }
};

GltfCatalogItem.prototype._hideInCesium = function() {
  if (this._model) {
    this._model.show = false;
  }
};

GltfCatalogItem.prototype._showInLeaflet = function() {
  this.isShown = false;
  throw new TerriaError({
    sender: this,
    title: i18next.t("models.gltf.notSupportedErrorTitle"),
    message: i18next.t("models.gltf.notSupportedErrorMessage", {
      name: this.name
    })
  });
};

GltfCatalogItem.prototype._hideInLeaflet = function() {
  // Nothing to be done.
};

GltfCatalogItem.prototype.zoomTo = function() {
  var that = this;
  return when(this.load(), function() {
    if (defined(that.nowViewingCatalogItem)) {
      return that.nowViewingCatalogItem.zoomTo();
    }

    if (defined(that.rectangle)) {
      return CatalogItem.prototype.zoomTo.call(that);
    }

    if (!defined(that._model)) {
      return;
    }

    return that.terria.currentViewer.zoomTo(that._model);
  });
};

GltfCatalogItem.prototype.getFeaturesFromPickResult = function(
  screenPosition,
  pickResult
) {
  const primitive = pickResult.primitive;
  const mesh = pickResult.mesh;
  const node = pickResult.node;
  if (!primitive || !mesh || !node) {
    return undefined;
  }

  const properties = {
    meshName: mesh.name,
    nodeName: node.name
  };

  const result = new Feature({
    properties: properties
  });

  result._catalogItem = this;

  if (this.featureInfoUrlTemplate) {
    const resource = new Resource({
      url: proxyCatalogItemUrl(this, this.featureInfoUrlTemplate),
      templateValues: properties
    });
    resource
      .fetchJson()
      .then(featureInfo => {
        Object.keys(featureInfo).forEach(property => {
          result.properties.addProperty(property, featureInfo[property]);
        });
      })
      .otherwise(e => {
        result.properties.addProperty(
          i18next.t("models.gltf.error"),
          i18next.t("models.gltf.unableToRetrieve", { url: resource.url })
        );
      });
  }

  return result;
};

module.exports = GltfCatalogItem;
