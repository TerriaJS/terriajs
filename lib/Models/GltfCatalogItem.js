'use strict';

/*global require*/
const CatalogItem = require('./CatalogItem');
const defined = require('terriajs-cesium/Source/Core/defined');
const defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
const inherit = require('../Core/inherit');
const Metadata = require('./Metadata');
const proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
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
    }
});

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
    var model = this._ModelClass.fromGltf({
        url: proxyCatalogItemUrl(this, this.url, '1d'),
        show: false
    });

    this._model = model;

    this.terria.cesium.scene.primitives.add(this._model);
};

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

module.exports = GltfCatalogItem;
