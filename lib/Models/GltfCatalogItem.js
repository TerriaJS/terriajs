'use strict';

/*global require*/
const Axis = require('terriajs-cesium/Source/Scene/Axis');
const Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
const CatalogItem = require('./CatalogItem');
const clone = require('terriajs-cesium/Source/Core/clone');
const combine = require('terriajs-cesium/Source/Core/combine');
const DataSourceClock = require('terriajs-cesium/Source/DataSources/DataSourceClock');
const defined = require('terriajs-cesium/Source/Core/defined');
const defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
const Feature = require('./Feature');
const freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
const inherit = require('../Core/inherit');
const JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
const knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
const Matrix4 = require('terriajs-cesium/Source/Core/Matrix4');
const Metadata = require('./Metadata');
const proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
const Resource = require('terriajs-cesium/Source/Core/Resource');
const ShaderSource = require('terriajs-cesium/Source/Renderer/ShaderSource');
const TerriaError = require('../Core/TerriaError');
const Transforms = require('terriajs-cesium/Source/Core/Transforms');
const when = require('terriajs-cesium/Source/ThirdParty/when');

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

    this.url = url;
    this.clock = new DataSourceClock();
    this.clock.startTime = JulianDate.fromIso8601('2017-12-21T00:00:00Z');
    this.clock.stopTime = JulianDate.fromIso8601('2017-12-22T00:00:00Z');
    this.clock.currentTime = JulianDate.clone(this.clock.startTime);

    this.modelMinimums = undefined;
    this.modelMaximums = undefined;
    this.crossSectionMinimums = undefined;
    this.crossSectionMaximums = undefined;
    this.crossSectionOrigin = undefined;

    this.featureInfoUrlTemplate = undefined;

    knockout.track(this, [
        'modelMinimums',
        'modelMaximums',
        'crossSectionMinimums',
        'crossSectionMaximums',
        'crossSectionOrigin',
        'featureInfoUrlTemplate'
    ]);

    this._crossSectionFrame = new Matrix4();
    knockout.defineProperty(this, 'crossSectionFrame', {
        get: function() {
            if (!defined(this.crossSectionOrigin)) {
                return undefined;
            }
            Transforms.eastNorthUpToFixedFrame(this.crossSectionOrigin, undefined, this._crossSectionFrame);
            return Matrix4.inverseTransformation(this._crossSectionFrame, this._crossSectionFrame);
        }
    })
}

inherit(CatalogItem, GltfCatalogItem);

defineProperties(GltfCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf GltfCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'gltf';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GL Transmission Format (glTF)'.
     * @memberOf GltfCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'GL Transmission Format (glTF)';
        }
    },

    supportsCrossSection: {
        get: function() {
            return true;
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf GltfCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            var result = new Metadata();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
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
    updaters : {
        get : function() {
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
    serializers : {
        get : function() {
            return GltfCatalogItem.defaultSerializers;
        }
    },

    /**
     * Returns true if we can zoom to this item. Depends on observable properties, and so updates once loaded.
     * @memberOf GltfCatalogItem.prototype
     * @type {Boolean}
     */
    canZoomTo : {
        get : function() {
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

GltfCatalogItem.defaultUpdaters.modelMinimums = function(catalogItem, json, propertyName) {
    if (defined(json.modelMinimums)) {
        catalogItem.modelMinimums = Cartesian3.fromArray(json.modelMinimums);
    }
};

GltfCatalogItem.defaultUpdaters.modelMaximums = function(catalogItem, json, propertyName) {
    if (defined(json.modelMaximums)) {
        catalogItem.modelMaximums = Cartesian3.fromArray(json.modelMaximums);
    }
};

GltfCatalogItem.defaultUpdaters.crossSectionMinimums = function(catalogItem, json, propertyName) {
    if (defined(json.crossSectionMinimums)) {
        catalogItem.crossSectionMinimums = Cartesian3.fromArray(json.crossSectionMinimums);
    }
};

GltfCatalogItem.defaultUpdaters.crossSectionMaximums = function(catalogItem, json, propertyName) {
    if (defined(json.crossSectionMaximums)) {
        catalogItem.crossSectionMaximums = Cartesian3.fromArray(json.crossSectionMaximums);
    }
};

GltfCatalogItem.defaultUpdaters.crossSectionOrigin = function(catalogItem, json, propertyName) {
    if (defined(json.crossSectionOrigin)) {
        catalogItem.crossSectionOrigin = Cartesian3.fromArray(json.crossSectionOrigin);
    }
};

freezeObject(GltfCatalogItem.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
GltfCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

GltfCatalogItem.defaultSerializers.modelMinimums = function(catalogItem, json, propertyName) {
    if (defined(catalogItem.modelMinimums)) {
        json.modelMinimums = Cartesian3.packArray(catalogItem.modelMinimums);
    }
};

GltfCatalogItem.defaultSerializers.modelMaximums = function(catalogItem, json, propertyName) {
    if (defined(catalogItem.modelMaximums)) {
        json.modelMaximums = Cartesian3.packArray(catalogItem.modelMaximums);
    }
};

GltfCatalogItem.defaultSerializers.crossSectionMinimums = function(catalogItem, json, propertyName) {
    if (defined(catalogItem.crossSectionMinimums)) {
        json.crossSectionMinimums = Cartesian3.packArray(catalogItem.crossSectionMinimums);
    }
};

GltfCatalogItem.defaultSerializers.crossSectionMaximums = function(catalogItem, json, propertyName) {
    if (defined(catalogItem.crossSectionMaximums)) {
        json.crossSectionMaximums = Cartesian3.packArray(catalogItem.crossSectionMaximums);
    }
};

GltfCatalogItem.defaultSerializers.crossSectionOrigin = function(catalogItem, json, propertyName) {
    if (defined(catalogItem.crossSectionOrigin)) {
        json.crossSectionOrigin = Cartesian3.packArray(catalogItem.crossSectionOrigin);
    }
};

freezeObject(GltfCatalogItem.defaultSerializers);

GltfCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url];
};

GltfCatalogItem.prototype._load = function() {
    var codeSplitDeferred = when.defer();

    var that = this;
    require.ensure('terriajs-cesium/Source/Scene/Model', function() {
        that._ModelClass = require('terriajs-cesium/Source/Scene/Model');
        codeSplitDeferred.resolve();
    }, 'Cesium-DataSources');

    return codeSplitDeferred.promise;
};

GltfCatalogItem.prototype._enableInCesium = function() {
    const origin = Cartesian3.fromDegrees(150.69476588315317, -33.74735468148187, 52.7);
    const options = {
        url: proxyCatalogItemUrl(this, this.url, '1d'),
        show: false,
        modelMatrix: Transforms.eastNorthUpToFixedFrame(origin),
        upAxis: Axis.Z,
        forwardAxis: Axis.Y
    };

    //addModelCrossSectionSupport(this, options);

    var model = this._ModelClass.fromGltf(options);
    model._catalogItem = this;

    this._model = model;

    this.terria.cesium.scene.primitives.add(this._model);
};

const NoMinimum = new Cartesian3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
const NoMaximum = new Cartesian3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);

function addModelCrossSectionSupport(catalogItem, modelOptions) {
    // Use undocumented hooks in Cesium's Model class to override the fragment
    // shader as it goes by, adding support for cross-sections.

    modelOptions.uniformMapLoaded = function(uniformMap, programId, runtimeNode) {
        return combine(uniformMap, {
            u_crossSectionFrame: function() {
                return catalogItem.crossSectionFrame || Matrix4.IDENTITY;
            },
            u_crossSectionMinimums: function() {
                return catalogItem.crossSectionMinimums || catalogItem.modelMinimums || NoMinimum;
            },
            u_crossSectionMaximums: function() {
                return catalogItem.crossSectionMaximums || catalogItem.modelMaximums || NoMaximum;
            }
        });
    };

    modelOptions.vertexShaderLoaded = function(shader, programName) {
        shader = ShaderSource.replaceMain(shader, 'cross_section_main');
        shader +=
            'uniform mat4 u_crossSectionFrame;\n' +
            'varying vec3 v_positionCrossSection;\n' +
            'void main()\n' +
            '{\n' +
            '    v_positionCrossSection = (u_crossSectionFrame * vec4(a_position, 1.0)).xyz;\n' +
            '    cross_section_main();\n' +
            '}\n';
        return shader;
    };

    modelOptions.fragmentShaderLoaded = function(shader, programName) {
        shader = ShaderSource.replaceMain(shader, 'cross_section_main');
        shader +=
            'uniform vec3 u_crossSectionMinimums;\n' +
            'uniform vec3 u_crossSectionMaximums;\n' +
            'varying vec3 v_positionCrossSection;\n' +
            'void main()\n' +
            '{\n' +
            '    if (v_positionCrossSection.x < u_crossSectionMinimums.x ||\n' +
            '        v_positionCrossSection.x > u_crossSectionMaximums.x ||\n' +
            '        v_positionCrossSection.y < u_crossSectionMinimums.y ||\n' +
            '        v_positionCrossSection.y > u_crossSectionMaximums.y ||\n' +
            '        v_positionCrossSection.z < u_crossSectionMinimums.z ||\n' +
            '        v_positionCrossSection.z > u_crossSectionMaximums.z) discard;\n' +
            '    cross_section_main();\n' +
            '}\n';
        return shader;
    };
}

GltfCatalogItem.prototype._disableInCesium = function() {
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
        title: 'Not supported in 2D',
        message: '"' + this.name + '" cannot be show in the 2D view.  Switch to 3D and try again.'
    });
};

GltfCatalogItem.prototype._hideInLeaflet = function() {
    // Nothing to be done.
};

/**
 * Moves the camera so that the item's bounding rectangle is visible.  If {@link CatalogItem#rectangle} is
 * undefined or covers more than about half the world in the longitude direction, or if the data item is not enabled
 * or not shown, this method zooms to the {@link DataSourceCatalogItem#dataSource} instead.  Because the zoom may
 * happen asynchronously (for example, if the item's rectangle is not yet known), this method returns a Promise that
 * resolves when the zoom animation starts.
 * @returns {Promise} A promise that resolves when the zoom animation starts.
 */
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

GltfCatalogItem.prototype.getFeaturesFromPickResult = function(screenPosition, pickResult) {
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
            url: proxyCatalogItemUrl(this, this.featureInfoUrlTemplate, '0d'),
            templateValues: properties
        });
        resource.fetchJson().then(featureInfo => {
            Object.keys(featureInfo).forEach(property => {
                result.properties.addProperty(property, featureInfo[property]);
            });
        }).otherwise(e => {
            result.properties.addProperty('Error', 'Unable to retrieve feature details from:\n\n' + resource.url);
        });
    }

    return result;
};

module.exports = GltfCatalogItem;
