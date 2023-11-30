import { makeObservable, observable } from "mobx";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";
import Cesium3DTilePointFeature from "terriajs-cesium/Source/Scene/Cesium3DTilePointFeature";
import ImageryLayer from "terriajs-cesium/Source/Scene/ImageryLayer";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import JsonValue from "../../Core/Json";
import { BaseModel } from "../Definition/Model";
import { TerriaFeatureData } from "./FeatureData";

const customProperties = ["entityCollection", "properties", "data"];

/** Terria wrapper around Cesium Entity
 * Adds a few extra properties
 * -
 */

export default class TerriaFeature extends Entity {
  /** This object can be used to pass Terria-specific properties */
  data?: TerriaFeatureData | JsonValue;

  cesiumEntity?: Entity;
  imageryLayer?: ImageryLayer | undefined;

  /** This comes from Cesium.scene.drillPick
   * No type provided
   */
  cesiumPrimitive?: any;

  _catalogItem?: BaseModel;
  _cesium3DTileFeature?: Cesium3DTileFeature | Cesium3DTilePointFeature;

  /** Flag if loading featureInfoUrl (see `FeatureInfoUrlTemplateMixin.getFeaturesFromPickResult`) */
  @observable loadingFeatureInfoUrl?: boolean = false;

  constructor(options: Entity.ConstructorOptions) {
    super(options);
    makeObservable(this);
    addCustomFeatureProperties(this);
  }

  /**
   * Creates a new Feature from an Entity.
   * Note the custom properties are also copied into the new Feature properly.
   */
  static fromEntity(entity: Entity): TerriaFeature {
    const feature = new TerriaFeature({ id: entity.id });
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
  static fromEntityCollectionOrEntity(entity: Entity): TerriaFeature {
    // If this entity is part of a collection, get the feature with this id from that collection.
    let feature;
    if (entity.entityCollection) {
      feature = entity.entityCollection.getById(entity.id);
    }
    if (!feature || !(feature instanceof TerriaFeature)) {
      feature = TerriaFeature.fromEntity(entity);
    }
    return feature;
  }

  static fromImageryLayerFeatureInfo(imageryFeature: ImageryLayerFeatureInfo) {
    const feature = new TerriaFeature({
      id: imageryFeature.name,
      name: imageryFeature.name,
      description: imageryFeature.description,
      properties: imageryFeature.properties
    });
    feature.data = imageryFeature.data;
    feature.imageryLayer = imageryFeature.imageryLayer;
    if (imageryFeature.position) {
      feature.position = new ConstantPositionProperty(
        Ellipsoid.WGS84.cartographicToCartesian(imageryFeature.position)
      );
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

module.exports = TerriaFeature;
