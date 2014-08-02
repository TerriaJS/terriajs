'use strict';

/*global require*/

var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

/**
 * An item in a {@link GeoDataGroupViewModel}.
 */
var GeoDataItemViewModel = function() {
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

    this._isEnabled = false;

    knockout.track(this, ['name', 'description', '_isEnabled']);
};

defineProperties(GeoDataItemViewModel.prototype, {
    isGroup : {
        get : function() {
            return false;
        }
    },

    isEnabled : {
        get : function() {
            return this._isEnabled;
        }
    }
});

module.exports = GeoDataItemViewModel;
