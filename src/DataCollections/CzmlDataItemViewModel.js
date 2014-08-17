'use strict';

/*global require*/

var CzmlDataSource = require('../../third_party/cesium/Source/DataSources/CzmlDataSource');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var corsProxy = require('../corsProxy');
var GeoDataItemViewModel = require('./GeoDataItemViewModel');

/**
 * A {@link GeoDataItemViewModel} that is represented as CZML.
 *
 * @constructor
 * @extends CzmlDataItemViewModel
 */
var CzmlDataItemViewModel = function() {
    /**
     * Gets or sets the CZML that is added to the {@link DataSourceDisplay} when this data item is enabled.
     * @type {Array}
     */
    this.czml = [];

    this._dataSource = undefined;

    knockout.track(this, ['czml']);

    var that = this;
    ko.getObservable(this, 'isEnabled').subscribe(this._isEnabledChanged, this);
};

CzmlDataItemViewModel.prototype = new GeoDataItemViewModel();
CzmlDataItemViewModel.prototype.constructor = CzmlDataItemViewModel;

CzmlDataItemViewModel.prototype._isEnabledChanged = function(newValue) {
    if (newValue === true && !defined(this._dataSource)) {
        // Enabling
        this._dataSource = new CzmlDataSource(this.name);
        dataSourceCollection.add(this._dataSource);
        this._dataSource.process(this.czml);
    } else if (newValue === false && defined(this._dataSource)) {
        // Disabling
        dataSourceCollection.remove(this._dataSource, true);
        this._dataSource = undefined;
    }
};
