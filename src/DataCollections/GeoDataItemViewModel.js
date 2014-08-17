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

    this.isEnabled = false;

    knockout.track(this, ['name', 'description', 'isEnabled']);
};

defineProperties(GeoDataItemViewModel.prototype, {
    isGroup : {
        get : function() {
            return false;
        }
    }
});

module.exports = GeoDataItemViewModel;
