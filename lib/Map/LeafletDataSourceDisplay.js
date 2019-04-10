const BoundingSphere = require('terriajs-cesium/Source/Core/BoundingSphere');
const BoundingSphereState = require('terriajs-cesium/Source/DataSources/BoundingSphereState');
const Check = require('terriajs-cesium/Source/Core/Check');
const createGuid = require('terriajs-cesium/Source/Core/createGuid');
const CustomDataSource = require('terriajs-cesium/Source/DataSources/CustomDataSource');
const defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
const defined = require('terriajs-cesium/Source/Core/defined');
const defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
const destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
const EventHelper = require('terriajs-cesium/Source/Core/EventHelper');
const JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
const L = require('leaflet');

/**
 * Visualizes a collection of {@link DataSource} instances in Leaflet.
 * @alias LeafletDataSourceDisplay
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Scene} options.scene The scene in which to display the data.
 * @param {DataSourceCollection} options.dataSourceCollection The data sources to display.
 * @param {LeafletDataSourceDisplay~VisualizersCallback} [options.visualizersCallback=LeafletDataSourceDisplay.defaultVisualizersCallback]
 *        A function which creates an array of visualizers used for visualization.
 *        If undefined, all standard visualizers are used.
 */
function LeafletDataSourceDisplay(options) {
    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.object('options', options);
    Check.typeOf.object('options.scene', options.scene);
    Check.typeOf.object('options.dataSourceCollection', options.dataSourceCollection);
    //>>includeEnd('debug');

    this._displayID = createGuid();

    var scene = options.scene;
    var dataSourceCollection = options.dataSourceCollection;

    this._eventHelper = new EventHelper();
    this._eventHelper.add(dataSourceCollection.dataSourceAdded, this._onDataSourceAdded, this);
    this._eventHelper.add(dataSourceCollection.dataSourceRemoved, this._onDataSourceRemoved, this);
    this._eventHelper.add(dataSourceCollection.dataSourceMoved, this._onDataSourceMoved, this);

    this._dataSourceCollection = dataSourceCollection;
    this._scene = scene;
    this._visualizersCallback = defaultValue(options.visualizersCallback, LeafletDataSourceDisplay.defaultVisualizersCallback);

    for (var i = 0, len = dataSourceCollection.length; i < len; i++) {
        this._onDataSourceAdded(dataSourceCollection, dataSourceCollection.get(i));
    }

    var defaultDataSource = new CustomDataSource();
    this._onDataSourceAdded(undefined, defaultDataSource);
    this._defaultDataSource = defaultDataSource;

    this._ready = false;
    this._lastTime = JulianDate.now();
}

/**
 * Gets or sets the default function which creates an array of visualizers used for visualization.
 * By default, this function uses all standard visualizers.
 *
 * @type {LeafletDataSourceDisplay~VisualizersCallback}
 */
LeafletDataSourceDisplay.defaultVisualizersCallback = function(scene, entityCluster, dataSource) {
    return [];
};

defineProperties(LeafletDataSourceDisplay.prototype, {
    /**
     * Gets the scene associated with this display.
     * @memberof LeafletDataSourceDisplay.prototype
     * @type {LeafletScene}
     */
    scene : {
        get : function() {
            return this._scene;
        }
    },
    /**
     * Gets the collection of data sources to display.
     * @memberof LeafletDataSourceDisplay.prototype
     * @type {DataSourceCollection}
     */
    dataSources : {
        get : function() {
            return this._dataSourceCollection;
        }
    },
    /**
     * Gets the default data source instance which can be used to
     * manually create and visualize entities not tied to
     * a specific data source. This instance is always available
     * and does not appear in the list dataSources collection.
     * @memberof LeafletDataSourceDisplay.prototype
     * @type {CustomDataSource}
     */
    defaultDataSource : {
        get : function() {
            return this._defaultDataSource;
        }
    },

    /**
     * Gets a value indicating whether or not all entities in the data source are ready
     * @memberof LeafletDataSourceDisplay.prototype
     * @type {Boolean}
     * @readonly
     */
    ready : {
        get : function() {
            return this._ready;
        }
    }
});

/**
 * Returns true if this object was destroyed; otherwise, false.
 * <br /><br />
 * If this object was destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
 *
 * @returns {Boolean} True if this object was destroyed; otherwise, false.
 *
 * @see LeafletDataSourceDisplay#destroy
 */
LeafletDataSourceDisplay.prototype.isDestroyed = function() {
    return false;
};

/**
 * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
 * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
 * <br /><br />
 * Once an object is destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
 * assign the return value (<code>undefined</code>) to the object as done in the example.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 *
 * @example
 * LeafletDataSourceDisplay = dataSourceDisplay.destroy();
 *
 * @see DataSourceDisplay#isDestroyed
 */
LeafletDataSourceDisplay.prototype.destroy = function() {
    this._eventHelper.removeAll();

    var dataSourceCollection = this._dataSourceCollection;
    for (var i = 0, length = dataSourceCollection.length; i < length; ++i) {
        this._onDataSourceRemoved(this._dataSourceCollection, dataSourceCollection.get(i));
    }
    this._onDataSourceRemoved(undefined, this._defaultDataSource);

    return destroyObject(this);
};

/**
 * Updates the display to the provided time.
 *
 * @param {JulianDate} time The simulation time.
 * @returns {Boolean} True if all data sources are ready to be displayed, false otherwise.
 */
LeafletDataSourceDisplay.prototype.update = function(time) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined('time', time);
    //>>includeEnd('debug');

    var result = true;

    var i;
    var x;
    var visualizers;
    var vLength;
    var dataSources = this._dataSourceCollection;
    var length = dataSources.length;
    for (i = 0; i < length; i++) {
        var dataSource = dataSources.get(i);
        if (defined(dataSource.update)) {
            result = dataSource.update(time) && result;
        }

        visualizers = dataSource._visualizersByDisplayID[this._displayID];
        vLength = visualizers.length;
        for (x = 0; x < vLength; x++) {
            result = visualizers[x].update(time) && result;
        }
    }

    visualizers = this._defaultDataSource._visualizersByDisplayID[this._displayID];
    vLength = visualizers.length;
    for (x = 0; x < vLength; x++) {
        result = visualizers[x].update(time) && result;
    }

    this._ready = result;

    this._lastTime = JulianDate.clone(time, this._lastTime);

    return result;
};

/**
 * Computes the rectangular bounds which encloses the visualization
 * produced for the given entities.
 *
 * @param {DataSource} dataSource The data source whose bounds to compute.
 * @returns {LatLngBounds} The computed bounds.
 */
LeafletDataSourceDisplay.prototype.getLatLngBounds = function(dataSource) {
    this.update(this._lastTime);

    const visualizers = dataSource._visualizersByDisplayID[this._displayID];
    if (visualizers === undefined) {
        return undefined;
    }

    let result;

    for (let j = 0, vLength = visualizers.length; j < vLength; j++) {
        var visualizer = visualizers[j];
        var bounds = visualizer.getLatLngBounds();
        if (bounds === undefined) {
            continue;
        }

        result = result === undefined ? L.latLngBounds(bounds.getSouthWest(), bounds.getNorthEast()) : result.extend(bounds);
    }

    return result;
};

var getBoundingSphereArrayScratch = [];
var getBoundingSphereBoundingSphereScratch = new BoundingSphere();

/**
 * Computes a bounding sphere which encloses the visualization produced for the specified entity.
 * The bounding sphere is in the fixed frame of the scene's globe.
 *
 * @param {Entity} entity The entity whose bounding sphere to compute.
 * @param {Boolean} allowPartial If true, pending bounding spheres are ignored and an answer will be returned from the currently available data.
 *                               If false, the the function will halt and return pending if any of the bounding spheres are pending.
 * @param {BoundingSphere} result The bounding sphere onto which to store the result.
 * @returns {BoundingSphereState} BoundingSphereState.DONE if the result contains the bounding sphere,
 *                       BoundingSphereState.PENDING if the result is still being computed, or
 *                       BoundingSphereState.FAILED if the entity has no visualization in the current scene.
 * @private
 */
LeafletDataSourceDisplay.prototype.getBoundingSphere = function(entity, allowPartial, result) {
    //>>includeStart('debug', pragmas.debug);
    Check.defined('entity', entity);
    Check.typeOf.bool('allowPartial', allowPartial);
    Check.defined('result', result);
    //>>includeEnd('debug');

    if (!this._ready) {
        return BoundingSphereState.PENDING;
    }

    var i;
    var length;
    var dataSource = this._defaultDataSource;
    if (!dataSource.entities.contains(entity)) {
        dataSource = undefined;

        var dataSources = this._dataSourceCollection;
        length = dataSources.length;
        for (i = 0; i < length; i++) {
            var d = dataSources.get(i);
            if (d.entities.contains(entity)) {
                dataSource = d;
                break;
            }
        }
    }

    if (!defined(dataSource)) {
        return BoundingSphereState.FAILED;
    }

    var boundingSpheres = getBoundingSphereArrayScratch;
    var tmp = getBoundingSphereBoundingSphereScratch;

    var count = 0;
    var state = BoundingSphereState.DONE;
    var visualizers = dataSource._visualizers;
    var visualizersLength = visualizers.length;

    for (i = 0; i < visualizersLength; i++) {
        var visualizer = visualizers[i];
        if (defined(visualizer.getBoundingSphere)) {
            state = visualizers[i].getBoundingSphere(entity, tmp);
            if (!allowPartial && state === BoundingSphereState.PENDING) {
                return BoundingSphereState.PENDING;
            } else if (state === BoundingSphereState.DONE) {
                boundingSpheres[count] = BoundingSphere.clone(tmp, boundingSpheres[count]);
                count++;
            }
        }
    }

    if (count === 0) {
        return BoundingSphereState.FAILED;
    }

    boundingSpheres.length = count;
    BoundingSphere.fromBoundingSpheres(boundingSpheres, result);
    return BoundingSphereState.DONE;
};

LeafletDataSourceDisplay.prototype._onDataSourceAdded = function(dataSourceCollection, dataSource) {
    var visualizers = this._visualizersCallback(this._scene, undefined, dataSource);

    dataSource._visualizersByDisplayID = dataSource._visualizersByDisplayID || {};
    dataSource._visualizersByDisplayID[this._displayID] = visualizers;

    dataSource._visualizers = dataSource._visualizers || [];
    dataSource._visualizers = dataSource._visualizers.concat(visualizers);
};

LeafletDataSourceDisplay.prototype._onDataSourceRemoved = function(dataSourceCollection, dataSource) {
    var visualizers = dataSource._visualizersByDisplayID[this._displayID];
    if (!defined(visualizers)) {
        return;
    }

    var length = visualizers.length;
    for (var i = 0; i < length; i++) {
        var visualizer = visualizers[i];
        visualizer.destroy();

        var index = dataSource._visualizers.indexOf(visualizer);
        dataSource._visualizers.splice(index, 1);
    }

    delete dataSource._visualizersByDisplayID[this._displayID];
};

LeafletDataSourceDisplay.prototype._onDataSourceMoved = function(dataSource, newIndex, oldIndex) {
    // Not currently implemented for Leaflet.
};

/**
 * A function which creates an array of visualizers used for visualization.
 * @callback LeafletDataSourceDisplay~VisualizersCallback
 *
 * @param {Scene} scene The scene to create visualizers for.
 * @param {DataSource} dataSource The data source to create visualizers for.
 * @returns {Visualizer[]} An array of visualizers used for visualization.
 *
 * @example
 * function createVisualizers(scene, dataSource) {
 *     return [new Cesium.BillboardVisualizer(scene, dataSource.entities)];
 * }
 */

module.exports = LeafletDataSourceDisplay;
