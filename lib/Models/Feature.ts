import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ImageryLayer from "terriajs-cesium/Source/Scene/ImageryLayer";
import { observable } from "mobx";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";

const customProperties = ["entityCollection", "properties", "data"];
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
export default class Feature extends Entity {
  /**
   * Gets or sets the current properties. This property is observable.
   */
  @observable currentProperties: any = undefined;

  /**
   * Gets or sets the current description. This property is observable.
   */
  @observable currentDescription: string | undefined = undefined;

  /**
   * Gets or sets counter objects used to trigger an update of the Feature Info Section,
   * to allow custom components to self-update. The object keys are timeoutIds, and values are
   * {reactComponent: ReactComponent, counter: Integer}.
   * This property is observable.
   */
  @observable updateCounters: any = undefined;

  data: any;

  cesiumEntity?: Entity;

  imageryLayer?: ImageryLayer;

  cesiumPrimitive?: any;

  _catalogItem?: unknown;
  _cesium3DTileFeature?: Cesium3DTileFeature;

  constructor(options: any) {
    super(options);
    addCustomFeatureProperties(this);
  }

  /**
   * Creates a new Feature from an Entity.
   * Note the custom properties are also copied into the new Feature properly.
   */
  static fromEntity(entity: Entity): Feature {
    const feature = new Feature({ id: entity.id });
    feature.merge(entity);

    for (let i = 0; i < customProperties.length; i++) {
      if (entity.propertyNames.indexOf(customProperties[i]) === -1) {
        (<any>feature)[customProperties[i]] = (<any>entity)[
          customProperties[i]
        ]; // Assume no merging or cloning needed.
      }
    }
    feature.cesiumEntity = entity;
    return feature;
  }

  /**
   * If the given entity is part of an entityCollection, and those entities are themselves features,
   * then return the matching feature from the collection.
   * Otherwise, return a new Feature from this entity.
   */
  static fromEntityCollectionOrEntity(entity: Entity): Feature {
    // If this entity is part of a collection, get the feature with this id from that collection.
    let feature;
    if (entity.entityCollection) {
      feature = entity.entityCollection.getById(entity.id);
    }
    if (!feature || !(feature instanceof Feature)) {
      feature = Feature.fromEntity(entity);
    }
    return feature;
  }
}

// Features have 'entityCollection', 'properties' and 'data' properties, which we must add to the entity's property list,
// if they're not already there. (In case they are added in a future version of Cesium.)
function addCustomFeatureProperties(entity: Entity) {
  for (let i = 0; i < customProperties.length; i++) {
    if (entity.propertyNames.indexOf(customProperties[i]) === -1) {
      entity.addProperty(customProperties[i]);
    }
  }
}

module.exports = Feature;
