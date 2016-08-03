'use strict';

/*global require*/

var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');

/**
 * A feature is just a Cesium Entity, with observable (ie. knockout-tracked) properties added for the current description and properties.
 * The current values of these should be set if needed from an event listener on the terria clock, eg.
 * terria.clock.onTick.addEventListener(function(clock) {
 *     if (typeof feature.description.getValue === 'function') {
 *         feature.currentDescription = feature.description.getValue(clock.currentTime);
 *     };
 *     if (typeof feature.properties.getValue === 'function') {
 *         feature.currentProperties = feature.properties.getValue(clock.currentTime);
 *     };
 * });
 *
 * @alias Feature
 * @constructor
 * @param {Object} [options] Object with the same properties as Cesium's Entity.
 * @extends Entity
 */
var Feature = function(options) {

    Entity.call(this, options);

    addCustomFeatureProperties(this);
    /**
     * Gets or sets the current properties. This property is observable.
     * @type {Object}
     */
    this.currentProperties = undefined;

    /**
     * Gets or sets the current description. This property is observable.
     * @type {String}
     */
    this.currentDescription = undefined;

    /**
     * Gets or sets counter objects used to trigger an update of the Feature Info Section,
     * to allow custom components to self-update. The object keys are timeoutIds, and values are
     * {reactComponent: ReactComponent, counter: Integer}.
     * This property is observable.
     * @type {Object}
     */
    this.updateCounters = undefined;

    knockout.track(this, ['currentProperties', 'currentDescription', 'updateCounters']);
};

inherit(Entity, Feature);

/**
 * Creates a new Feature from an Entity.
 * Note the custom 'properties' and 'data' properties are copied into the new Feature properly.
 * @param  {Entity} entity
 * @return {Feature}
 */
Feature.fromEntity = function(entity) {
    var feature = new Feature();
    feature.merge(entity);
    if (entity.propertyNames.indexOf('properties') === -1) {
        feature.properties = entity.properties; // Assume no merging or cloning needed.
    }
    if (entity.propertyNames.indexOf('data') === -1) {
        feature.data = entity.data; // Assume no merging or cloning needed.
    }
    return feature;
};

// Features have 'properties' and 'data' properties, which we must add to the entity's property list,
// if they're not already there. (In case they are added in a future version of Cesium.)
function addCustomFeatureProperties(entity) {
    if (entity.propertyNames.indexOf('properties') === -1) {
        entity.addProperty('properties');
    }
    if (entity.propertyNames.indexOf('data') === -1) {
        entity.addProperty('data');
    }
}

module.exports = Feature;
