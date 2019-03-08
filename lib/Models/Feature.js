'use strict';

/*global require*/

var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var inherit = require('../Core/inherit');

var customProperties = ['entityCollection', 'properties', 'data'];
/**
 * A feature is just a Cesium Entity, with observable (ie. knockout-tracked) properties added for
 * currentDescription and currentProperties. These are tracked so that the feature info updates as the clock time changes,
 * because the properties and description themselves do not change (they are functions of the time, whose values change).
 * Set these if needed from an event listener on the terria clock, eg.
 *       terria.clock.onTick.addEventListener(function(clock) {
 *           if (typeof feature.description.getValue === 'function') {
 *               feature.currentDescription = feature.description.getValue(clock.currentTime);
 *           };
 *           if (typeof feature.properties.getValue === 'function') {
 *               feature.currentProperties = feature.properties.getValue(clock.currentTime);
 *           };
 *       });
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

    // Do not add any Cesium-added properties (eg. description or properties) to this, because
    // they are added as getters and setters, which probably interferes with knockout's getters and setters.
    // Instead, subscribe to definitionChanged events.
    knockout.track(this, ['currentProperties', 'currentDescription', 'updateCounters']);
};

inherit(Entity, Feature);

/**
 * Creates a new Feature from an Entity.
 * Note the custom properties are also copied into the new Feature properly.
 * @param  {Entity} entity
 * @return {Feature}
 */
Feature.fromEntity = function(entity) {
    var feature = new Feature({id: entity.id});
    feature.merge(entity);

    for (var i = 0; i < customProperties.length; i++) {
        if (entity.propertyNames.indexOf(customProperties[i]) === -1) {
            feature[customProperties[i]] = entity[customProperties[i]]; // Assume no merging or cloning needed.
        }
    }

    feature.cesiumEntity = entity;

    return feature;
};

/**
 * If the given entity is part of an entityCollection, and those entities are themselves features,
 * then return the matching feature from the collection.
 * Otherwise, return a new Feature from this entity.
 * @param  {Entity} entity
 * @return {Feature} The corresponding feature.
 */
Feature.fromEntityCollectionOrEntity = function(entity) {
    // If this entity is part of a collection, get the feature with this id from that collection.
    var feature;
    if (entity.entityCollection) {
        feature = entity.entityCollection.getById(entity.id);
    }
    if (!feature || !(feature instanceof Feature)) {
        feature = Feature.fromEntity(entity);
    }
    return feature;
};

// Features have 'entityCollection', 'properties' and 'data' properties, which we must add to the entity's property list,
// if they're not already there. (In case they are added in a future version of Cesium.)
function addCustomFeatureProperties(entity) {
    for (var i = 0; i < customProperties.length; i++) {
        if (entity.propertyNames.indexOf(customProperties[i]) === -1) {
            entity.addProperty(customProperties[i]);
        }
    }
}

module.exports = Feature;
