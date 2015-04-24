'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * Overrides a Knockout property definition.  Change notification is raised on the old property, if any, to encourage
 * listeners to subscribe to the new one.
 *
 * @param {Object} owner The owner of the property.
 * @param {String} propertyName The name of the property.
 * @param {Object} descriptor The property descriptor, just like the one that would be passed to `knockout.defineProperty`
 *                            or `Object.defineProperty`.
 */
var overrideProperty = function(owner, propertyName, descriptor) {
    // Get the existing observable with this name, if any, and delete it.
    var overridden = knockout.getObservable(owner, propertyName);
    if (defined(overridden)) {
        delete owner.__knockoutObservables[propertyName];
    }

    // Define the new property.
    knockout.defineProperty(owner, propertyName, descriptor);

    if (defined(overridden)) {
        // Notify subscribers to the old property that it has changed.
        // This is a hacky way of getting most subscribers to now subscribe to the new property.
        overridden.notifySubscribers();
    }
};

module.exports = overrideProperty;
