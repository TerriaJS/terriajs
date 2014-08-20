'use strict';

/*global require*/

var CzmlDataSource = require('../../third_party/cesium/Source/DataSources/CzmlDataSource');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var corsProxy = require('../corsProxy');
var GeoDataItemViewModel = require('./GeoDataItemViewModel');
var inherit = require('../inherit');

/**
 * A {@link GeoDataItemViewModel} that is represented as CZML.
 *
 * @param {DataSourceCollection} dataSourceCollection The collection of data sources to which this item is added when it is enabled.
 *
 * @constructor
 * @extends CzmlDataItemViewModel
 */
var CzmlDataItemViewModel = function(dataSourceCollection) {
    GeoDataItemViewModel.apply(this, 'czml', dataSourceCollection);

    this._dataSource = undefined;

    /**
     * Gets or sets the CZML that is added to the {@link DataSourceDisplay} when this data item is enabled.
     * @type {Array}
     */
    this.czml = [];

    knockout.track(this, ['czml']);

    var that = this;
    knockout.getObservable(this, 'isEnabled').subscribe(this._isEnabledChanged, this);
};

CzmlDataItemViewModel.type = 'czml';

CzmlDataItemViewModel.prototype = inherit(GeoDataItemViewModel.prototype);

CzmlDataItemViewModel.prototype._isEnabledChanged = function(newValue) {
    if (newValue === true && !defined(this._dataSource)) {
        // Enabling
        this._dataSource = new CzmlDataSource(this.name);
        this.dataSourceCollection.add(this._dataSource);
        this._dataSource.process(this.czml);
    } else if (newValue === false && defined(this._dataSource)) {
        // Disabling
        this.dataSourceCollection.remove(this._dataSource, true);
        this._dataSource = undefined;
    }
};

/**
 * Updates the CZML data item from a JSON object-literal description of it.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 */
 CzmlDataItemViewModel.prototype.updateFromJson = function(json) {
    this.name = defaultValue(json.name, 'Unnamed Item');
    this.description = defaultValue(json.description, '');
    this.czml = defaultValue(json.czml, {});
};
