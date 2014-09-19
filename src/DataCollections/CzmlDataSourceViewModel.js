'use strict';

/*global require*/

var clone = require('../../third_party/cesium/Source/Core/clone');
var CzmlDataSource = require('../../third_party/cesium/Source/DataSources/CzmlDataSource');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var corsProxy = require('../corsProxy');
var GeoDataSourceViewModel = require('./GeoDataSourceViewModel');
var inherit = require('../inherit');

/**
 * A {@link GeoDataItemViewModel} that is represented as CZML.
 *
 * @constructor
 * @extends GeoDataItemViewModel
 */
var CzmlDataSourceViewModel = function() {
    GeoDataSourceViewModel.call(this, 'czml');

    this._dataSource = undefined;

    /**
     * Gets or sets the CZML that is added to the {@link DataSourceDisplay} when this data item is enabled.
     * @type {Array}
     */
    this.czml = [];

    knockout.track(this, ['czml']);

    knockout.getObservable(this, 'isEnabled').subscribe(this._isEnabledChanged, this);
};

CzmlDataSourceViewModel.prototype = inherit(GeoDataSourceViewModel.prototype);

/**
 * Updates the CZML data item from a JSON object-literal description of it.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 */
 CzmlDataSourceViewModel.prototype.updateFromJson = function(json) {
    this.name = defaultValue(json.name, 'Unnamed Item');
    this.description = defaultValue(json.description, '');

    if (defined(json.czml)) {
        this.czml = clone(json.czml);
    } else {
        this.czml = {};
    }
};

CzmlDataSourceViewModel.prototype._isEnabledChanged = function(newValue) {
    if (newValue === true && !defined(this._dataSource)) {
        // Enabling
        this._dataSource = new CzmlDataSource(this.name);
        this.dataSourceCollection.add(this._dataSource);

        if (!(this.czml instanceof Array) && this.czml.id !== 'document') {
            this._dataSource.process({
                id: 'document',
                version: '1.0'
            });
        }

        this._dataSource.process(this.czml);
    } else if (newValue === false && defined(this._dataSource)) {
        // Disabling
        this.dataSourceCollection.remove(this._dataSource, true);
        this._dataSource = undefined;
    }
};

module.exports = CzmlDataSourceViewModel;
