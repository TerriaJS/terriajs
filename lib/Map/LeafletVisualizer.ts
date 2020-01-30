import AssociativeArray from "terriajs-cesium/Source/Core/AssociativeArray";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Color from "terriajs-cesium/Source/Core/Color";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
import EntityCluster from "terriajs-cesium/Source/DataSources/EntityCluster";
import isDefined from "../Core/isDefined";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import L, { LatLngBounds } from "leaflet";
import LeafletScene from "./LeafletScene";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import PolylineGlowMaterialProperty from "terriajs-cesium/Source/DataSources/PolylineGlowMaterialProperty";
import Property from "terriajs-cesium/Source/DataSources/Property";

const destroyObject = require("terriajs-cesium/Source/Core/destroyObject")
  .default;
const writeTextToCanvas = require("terriajs-cesium/Source/Core/writeTextToCanvas")
  .default;

interface PointDetails {
  layer?: L.CircleMarker;
  lastPosition: Cartesian3;
  lastPixelSize: number;
  lastColor: Color;
  lastOutlineColor: Color;
  lastOutlineWidth: number;
}

interface PolygonDetails {
  layer?: L.Polygon;
  lastHierarchy?: PolygonHierarchy;
  lastFill?: boolean;
  lastFillColor: Color;
  lastOutline?: boolean;
  lastOutlineColor: Color;
}

interface BillboardDetails {
  layer?: L.Marker;
}

interface LabelDetails {
  layer?: L.Marker;
}

interface PolylineDetails {
  layer?: L.Polyline;
}

interface EntityDetails {
  point?: PointDetails;
  polygon?: PolygonDetails;
  billboard?: BillboardDetails;
  label?: LabelDetails;
  polyline?: PolylineDetails;
}

interface EntityHash {
  [key: string]: EntityDetails;
}

const defaultColor = Color.WHITE;
const defaultOutlineColor = Color.BLACK;
const defaultOutlineWidth = 1.0;
const defaultPixelSize = 5.0;
const defaultWidth = 5.0;

//Single pixel black dot
const tmpImage =
  "data:image/gif;base64,R0lGODlhAQABAPAAAAAAAP///yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

//NOT IMPLEMENTED
// Path primitive - no need identified
// Ellipse primitive - no need identified
// Ellipsoid primitive - 3d prim - no plans for this
// Model primitive - 3d prim - no plans for this

/**
 * A {@link Visualizer} which maps {@link Entity#point} to Leaflet primitives.
 **/
class LeafletGeomVisualizer {
  private readonly _featureGroup: L.FeatureGroup;
  private readonly _entitiesToVisualize: AssociativeArray;
  private readonly _entityHash: EntityHash;

  constructor(
    readonly leafletScene: LeafletScene,
    readonly entityCollection: EntityCollection
  ) {
    entityCollection.collectionChanged.addEventListener(
      this._onCollectionChanged,
      this
    );
    this._featureGroup = L.featureGroup().addTo(leafletScene.map);
    this._entitiesToVisualize = new AssociativeArray();
    this._entityHash = {};

    this._onCollectionChanged(
      entityCollection,
      entityCollection.values,
      [],
      []
    );
  }

  private _onCollectionChanged(
    _entityCollection: EntityCollection,
    added: Entity[],
    removed: Entity[],
    changed: Entity[]
  ) {
    let entity;
    const featureGroup = this._featureGroup;
    const entities = this._entitiesToVisualize;
    const entityHash = this._entityHash;

    for (let i = added.length - 1; i > -1; i--) {
      entity = added[i];
      if (
        ((isDefined(entity.point) ||
          isDefined(entity.billboard) ||
          isDefined(entity.label)) &&
          isDefined(entity.position)) ||
        isDefined(entity.polyline) ||
        isDefined(entity.polygon)
      ) {
        entities.set(entity.id, entity);
        entityHash[entity.id] = {};
      }
    }

    for (let i = changed.length - 1; i > -1; i--) {
      entity = changed[i];
      if (
        ((isDefined(entity.point) ||
          isDefined(entity.billboard) ||
          isDefined(entity.label)) &&
          isDefined(entity.position)) ||
        isDefined(entity.polyline) ||
        isDefined(entity.polygon)
      ) {
        entities.set(entity.id, entity);
        entityHash[entity.id] = entityHash[entity.id] || {};
      } else {
        cleanEntity(entity, featureGroup, entityHash);
        entities.remove(entity.id);
      }
    }

    for (let i = removed.length - 1; i > -1; i--) {
      entity = removed[i];
      cleanEntity(entity, featureGroup, entityHash);
      entities.remove(entity.id);
    }
  }

  /**
   * Updates the primitives created by this visualizer to match their
   * Entity counterpart at the given time.
   *
   */
  public update(time: JulianDate): boolean {
    const entities = this._entitiesToVisualize.values;
    const entityHash = this._entityHash;
    let lastLeafletMarker: L.CircleMarker | undefined;

    for (let i = 0, len = entities.length; i < len; i++) {
      const entity = entities[i];
      const entityDetails = entityHash[entity.id];

      if (isDefined(entity._point)) {
        lastLeafletMarker = this._updatePoint(
          entity,
          time,
          entityHash,
          entityDetails,
          lastLeafletMarker
        );
      }
      if (isDefined(entity.billboard)) {
        this._updateBillboard(entity, time, entityHash, entityDetails);
      }
      if (isDefined(entity.label)) {
        this._updateLabel(entity, time, entityHash, entityDetails);
      }
      if (isDefined(entity.polyline)) {
        this._updatePolyline(entity, time, entityHash, entityDetails);
      }
      if (isDefined(entity.polygon)) {
        this._updatePolygon(entity, time, entityHash, entityDetails);
      }
    }

    return true;
  }

  private _updatePoint(
    entity: Entity,
    time: JulianDate,
    _entityHash: EntityHash,
    entityDetails: EntityDetails,
    lastLeafletMarker?: L.CircleMarker
  ) {
    const featureGroup = this._featureGroup;
    const pointGraphics = entity.point;

    const show =
      entity.isAvailable(time) &&
      getValueOrDefault(pointGraphics.show, time, true);
    if (!show) {
      cleanPoint(entity, featureGroup, entityDetails);
      return;
    }

    let details = entityDetails.point;
    if (!isDefined(details)) {
      details = entityDetails.point = {
        layer: undefined,
        lastPosition: new Cartesian3(),
        lastPixelSize: 1,
        lastColor: new Color(),
        lastOutlineColor: new Color(),
        lastOutlineWidth: 1
      };
    }

    const position = getValueOrUndefined(entity.position, time);
    if (!isDefined(position)) {
      cleanPoint(entity, featureGroup, entityDetails);
      return;
    }

    const pixelSize = getValueOrDefault(
      pointGraphics.pixelSize,
      time,
      defaultPixelSize
    );
    const color = getValueOrDefault(pointGraphics.color, time, defaultColor);
    const outlineColor = getValueOrDefault(
      pointGraphics.outlineColor,
      time,
      defaultOutlineColor
    );
    const outlineWidth = getValueOrDefault(
      pointGraphics.outlineWidth,
      time,
      defaultOutlineWidth
    );

    let layer = details.layer;

    if (!isDefined(layer)) {
      const pointOptions = {
        radius: pixelSize / 2.0,
        fillColor: color.toCssColorString(),
        fillOpacity: color.alpha,
        color: outlineColor.toCssColorString(),
        weight: outlineWidth,
        opacity: outlineColor.alpha
      };

      layer = details.layer = L.circleMarker(
        positionToLatLng(position, lastLeafletMarker),
        pointOptions
      );
      layer.on("click", featureClicked.bind(undefined, this, entity));
      layer.on("mousedown", featureMousedown.bind(undefined, this, entity));
      featureGroup.addLayer(layer);

      Cartesian3.clone(position, details.lastPosition);
      details.lastPixelSize = pixelSize;
      Color.clone(color, details.lastColor);
      Color.clone(outlineColor, details.lastOutlineColor);
      details.lastOutlineWidth = outlineWidth;

      return layer;
    }

    if (!Cartesian3.equals(position, details.lastPosition)) {
      layer.setLatLng(positionToLatLng(position, lastLeafletMarker));
      Cartesian3.clone(position, details.lastPosition);
    }

    if (pixelSize !== details.lastPixelSize) {
      layer.setRadius(pixelSize / 2.0);
      details.lastPixelSize = pixelSize;
    }

    const options = layer.options;
    let applyStyle = false;

    if (!Color.equals(color, details.lastColor)) {
      options.fillColor = color.toCssColorString();
      options.fillOpacity = color.alpha;
      Color.clone(color, details.lastColor);
      applyStyle = true;
    }

    if (!Color.equals(outlineColor, details.lastOutlineColor)) {
      options.color = outlineColor.toCssColorString();
      options.opacity = outlineColor.alpha;
      Color.clone(outlineColor, details.lastOutlineColor);
      applyStyle = true;
    }

    if (outlineWidth !== details.lastOutlineWidth) {
      options.weight = outlineWidth;
      details.lastOutlineWidth = outlineWidth;
      applyStyle = true;
    }

    if (applyStyle) {
      layer.setStyle(options);
    }
  }

  private _updateBillboard(
    entity: Entity,
    time: JulianDate,
    _entityHash: EntityHash,
    entityDetails: EntityDetails
  ) {
    const markerGraphics = entity.billboard;
    const featureGroup = this._featureGroup;
    let position;
    let marker: L.Marker;

    let details = entityDetails.billboard;
    if (!isDefined(details)) {
      details = entityDetails.billboard = {
        layer: undefined
      };
    }

    const geomLayer = details.layer;

    let show =
      entity.isAvailable(time) &&
      getValueOrDefault(markerGraphics.show, time, true);
    if (show) {
      position = getValueOrUndefined(entity.position, time);
      show = isDefined(position);
    }
    if (!show) {
      cleanBillboard(entity, featureGroup, entityDetails);
      return;
    }

    const cart = Ellipsoid.WGS84.cartesianToCartographic(position);
    const latlng = L.latLng(
      CesiumMath.toDegrees(cart.latitude),
      CesiumMath.toDegrees(cart.longitude)
    );
    const image: any = getValue(markerGraphics.image, time);
    const height: number | undefined = getValue(markerGraphics.height, time);
    const width: number | undefined = getValue(markerGraphics.width, time);
    const color = getValueOrDefault(markerGraphics.color, time, defaultColor);
    const scale = getValueOrDefault(markerGraphics.scale, time, 1.0);
    const verticalOrigin = getValueOrDefault(
      markerGraphics.verticalOrigin,
      time,
      0
    );
    const horizontalOrigin = getValueOrDefault(
      markerGraphics.horizontalOrigin,
      time,
      0
    );
    const pixelOffset = getValueOrDefault(
      markerGraphics.pixelOffset,
      time,
      Cartesian2.ZERO
    );

    let imageUrl: string | undefined;
    if (isDefined(image)) {
      if (typeof image === "string") {
        imageUrl = image;
      } else if (isDefined(image.toDataURL)) {
        imageUrl = image.toDataURL();
      } else if (isDefined(image.url)) {
        imageUrl = image.url;
      } else {
        imageUrl = image.src;
      }
    }

    const iconOptions: any = {
      color: color.toCssColorString(),
      origUrl: imageUrl,
      scale: scale,
      horizontalOrigin: horizontalOrigin, //value: left, center, right
      verticalOrigin: verticalOrigin //value: bottom, center, top
    };

    if (isDefined(height) || isDefined(width)) {
      iconOptions.iconSize = [width, height];
    }

    let redrawIcon = false;
    if (!isDefined(geomLayer)) {
      const markerOptions = { icon: L.icon({ iconUrl: tmpImage }) };
      marker = L.marker(latlng, markerOptions);
      marker.on("click", featureClicked.bind(undefined, this, entity));
      marker.on("mousedown", featureMousedown.bind(undefined, this, entity));
      featureGroup.addLayer(marker);
      details.layer = marker;
      redrawIcon = true;
    } else {
      marker = geomLayer;
      if (!marker.getLatLng().equals(latlng)) {
        marker.setLatLng(latlng);
      }
      for (const prop in iconOptions) {
        if (
          isDefined(marker.options.icon) &&
          iconOptions[prop] !== (<any>marker.options.icon.options)[prop]
        ) {
          redrawIcon = true;
          break;
        }
      }
    }

    if (redrawIcon) {
      const drawBillboard = function(
        image: HTMLImageElement,
        dataurl: string | undefined
      ) {
        iconOptions.iconUrl = dataurl || image;
        if (!isDefined(iconOptions.iconSize)) {
          iconOptions.iconSize = [image.width * scale, image.height * scale];
        }
        const w = iconOptions.iconSize[0],
          h = iconOptions.iconSize[1];
        const xOff = (w / 2) * (1 - horizontalOrigin) - pixelOffset.x;
        const yOff = (h / 2) * (1 + verticalOrigin) - pixelOffset.y;
        iconOptions.iconAnchor = [xOff, yOff];

        if (!color.equals(defaultColor)) {
          iconOptions.iconUrl = recolorBillboard(image, color);
        }
        marker.setIcon(L.icon(iconOptions));
      };
      const img = new Image();
      img.onload = function() {
        drawBillboard(img, imageUrl);
      };
      if (isDefined(imageUrl)) {
        img.src = imageUrl;
      }
    }
  }

  private _updateLabel(
    entity: Entity,
    time: JulianDate,
    _entityHash: EntityHash,
    entityDetails: EntityDetails
  ) {
    const labelGraphics = entity.label;
    const featureGroup = this._featureGroup;
    let position;
    let marker: L.Marker;

    let details = entityDetails.label;
    if (!isDefined(details)) {
      details = entityDetails.label = {
        layer: undefined
      };
    }

    const geomLayer = details.layer;

    let show =
      entity.isAvailable(time) &&
      getValueOrDefault(labelGraphics.show, time, true);
    if (show) {
      position = getValueOrUndefined(entity.position, time);
      show = isDefined(position);
    }
    if (!show) {
      cleanLabel(entity, featureGroup, entityDetails);
      return;
    }

    const cart = Ellipsoid.WGS84.cartesianToCartographic(position);
    const latlng = L.latLng(
      CesiumMath.toDegrees(cart.latitude),
      CesiumMath.toDegrees(cart.longitude)
    );
    const text = getValue(labelGraphics.text, time);
    const font = getValue((labelGraphics.font as unknown) as Property, time);
    const scale = getValueOrDefault(labelGraphics.scale, time, 1.0);
    const fillColor = getValueOrDefault(
      (labelGraphics.fillColor as unknown) as Property,
      time,
      defaultColor
    );
    const verticalOrigin = getValueOrDefault(
      labelGraphics.verticalOrigin,
      time,
      0
    );
    const horizontalOrigin = getValueOrDefault(
      labelGraphics.horizontalOrigin,
      time,
      0
    );
    const pixelOffset = getValueOrDefault(
      labelGraphics.pixelOffset,
      time,
      Cartesian2.ZERO
    );

    const iconOptions: any = {
      text: text,
      font: font,
      color: fillColor.toCssColorString(),
      scale: scale,
      horizontalOrigin: horizontalOrigin, //value: left, center, right
      verticalOrigin: verticalOrigin //value: bottom, center, top
    };

    let redrawLabel = false;
    if (!isDefined(geomLayer)) {
      const markerOptions = { icon: L.icon({ iconUrl: tmpImage }) };
      marker = L.marker(latlng, markerOptions);
      marker.on("click", featureClicked.bind(undefined, this, entity));
      marker.on("mousedown", featureMousedown.bind(undefined, this, entity));
      featureGroup.addLayer(marker);
      details.layer = marker;
      redrawLabel = true;
    } else {
      marker = geomLayer;
      if (!marker.getLatLng().equals(latlng)) {
        marker.setLatLng(latlng);
      }
      for (const prop in iconOptions) {
        if (
          isDefined(marker.options.icon) &&
          iconOptions[prop] !== (<any>marker.options.icon.options)[prop]
        ) {
          redrawLabel = true;
          break;
        }
      }
    }

    if (redrawLabel) {
      const drawBillboard = function(image: HTMLImageElement, dataurl: string) {
        iconOptions.iconUrl = dataurl || image;
        if (!isDefined(iconOptions.iconSize)) {
          iconOptions.iconSize = [image.width * scale, image.height * scale];
        }
        const w = iconOptions.iconSize[0],
          h = iconOptions.iconSize[1];
        const xOff = (w / 2) * (1 - horizontalOrigin) - pixelOffset.x;
        const yOff = (h / 2) * (1 + verticalOrigin) - pixelOffset.y;
        iconOptions.iconAnchor = [xOff, yOff];
        marker.setIcon(L.icon(iconOptions));
      };

      const canvas = writeTextToCanvas(text, {
        fillColor: fillColor,
        font: font
      });
      const imageUrl = canvas.toDataURL();

      const img = new Image();
      img.onload = function() {
        drawBillboard(img, imageUrl);
      };
      img.src = imageUrl;
    }
  }

  private _updatePolygon(
    entity: Entity,
    time: JulianDate,
    _entityHash: EntityHash,
    entityDetails: EntityDetails
  ) {
    const featureGroup = this._featureGroup;
    const polygonGraphics = entity.polygon;

    const show =
      entity.isAvailable(time) &&
      getValueOrDefault(polygonGraphics.show, time, true);
    if (!show) {
      cleanPolygon(entity, featureGroup, entityDetails);
      return;
    }

    let details = entityDetails.polygon;
    if (!isDefined(details)) {
      details = entityDetails.polygon = {
        layer: undefined,
        lastHierarchy: undefined,
        lastFill: undefined,
        lastFillColor: new Color(),
        lastOutline: undefined,
        lastOutlineColor: new Color()
      };
    }

    const hierarchy = getValueOrUndefined(polygonGraphics.hierarchy, time);
    if (!isDefined(hierarchy)) {
      cleanPolygon(entity, featureGroup, entityDetails);
      return;
    }

    const fill = getValueOrDefault(
      (polygonGraphics.fill as unknown) as Property,
      time,
      true
    );
    const outline = getValueOrDefault(polygonGraphics.outline, time, true);
    const outlineColor = getValueOrDefault(
      (polygonGraphics.outlineColor as unknown) as Property,
      time,
      defaultOutlineColor
    );

    const material = getValueOrUndefined(
      (polygonGraphics.material as unknown) as Property,
      time
    );
    let fillColor;
    if (isDefined(material) && isDefined(material.color)) {
      fillColor = material.color;
    } else {
      fillColor = defaultColor;
    }

    let layer = details.layer;
    if (!isDefined(layer)) {
      const polygonOptions = {
        fill: fill,
        fillColor: fillColor.toCssColorString(),
        fillOpacity: fillColor.alpha,
        weight: outline ? 1.0 : 0.0,
        color: outlineColor.toCssColorString(),
        opacity: outlineColor.alpha
      };

      layer = details.layer = L.polygon(
        hierarchyToLatLngs(hierarchy),
        polygonOptions
      );
      layer.on("click", featureClicked.bind(undefined, this, entity));
      layer.on("mousedown", featureMousedown.bind(undefined, this, entity));
      featureGroup.addLayer(layer);

      details.lastHierarchy = hierarchy;
      details.lastFill = fill;
      details.lastOutline = outline;
      Color.clone(fillColor, details.lastFillColor);
      Color.clone(outlineColor, details.lastOutlineColor);

      return;
    }

    if (hierarchy !== details.lastHierarchy) {
      layer.setLatLngs(hierarchyToLatLngs(hierarchy));
      details.lastHierarchy = hierarchy;
    }

    const options = layer.options;
    let applyStyle = false;

    if (fill !== details.lastFill) {
      options.fill = fill;
      details.lastFill = fill;
      applyStyle = true;
    }

    if (outline !== details.lastOutline) {
      options.weight = outline ? 1.0 : 0.0;
      details.lastOutline = outline;
      applyStyle = true;
    }

    if (!Color.equals(fillColor, details.lastFillColor)) {
      options.fillColor = fillColor.toCssColorString();
      options.fillOpacity = fillColor.alpha;
      Color.clone(fillColor, details.lastFillColor);
      applyStyle = true;
    }

    if (!Color.equals(outlineColor, details.lastOutlineColor)) {
      options.color = outlineColor.toCssColorString();
      options.opacity = outlineColor.alpha;
      Color.clone(outlineColor, details.lastOutlineColor);
      applyStyle = true;
    }

    if (applyStyle) {
      layer.setStyle(options);
    }
  }

  private _updatePolyline(
    entity: Entity,
    time: JulianDate,
    _entityHash: EntityHash,
    entityDetails: EntityDetails
  ) {
    const polylineGraphics = entity.polyline;
    const featureGroup = this._featureGroup;
    let positions, polyline;

    let details = entityDetails.polyline;
    if (!isDefined(details)) {
      details = entityDetails.polyline = {
        layer: undefined
      };
    }

    const geomLayer = details.layer;

    let show =
      entity.isAvailable(time) &&
      getValueOrDefault(polylineGraphics.show, time, true);
    if (show) {
      positions = getValueOrUndefined(polylineGraphics.positions, time);
      show = isDefined(positions);
    }
    if (!show) {
      cleanPolyline(entity, featureGroup, entityDetails);
      return;
    }

    const carts = Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
    const latlngs = [];
    for (let p = 0; p < carts.length; p++) {
      latlngs.push(
        L.latLng(
          CesiumMath.toDegrees(carts[p].latitude),
          CesiumMath.toDegrees(carts[p].longitude)
        )
      );
    }

    let color, width;
    if (polylineGraphics.material instanceof PolylineGlowMaterialProperty) {
      color = defaultColor;
      width = defaultWidth;
    } else {
      const material = polylineGraphics.material.getValue(time);
      if (isDefined(material)) {
        color = material.color;
      }
      color = color || defaultColor;
      width = getValueOrDefault(
        (polylineGraphics.width as unknown) as Property,
        time,
        defaultWidth
      );
    }

    const polylineOptions = {
      color: color.toCssColorString(),
      weight: width,
      opacity: color.alpha
    };

    if (!isDefined(geomLayer)) {
      if (latlngs.length > 0) {
        polyline = L.polyline(latlngs, polylineOptions);
        polyline.on("click", featureClicked.bind(undefined, this, entity));
        polyline.on(
          "mousedown",
          featureMousedown.bind(undefined, this, entity)
        );
        featureGroup.addLayer(polyline);
        details.layer = polyline;
      }
    } else {
      polyline = geomLayer;
      const curLatLngs = polyline.getLatLngs();
      let bPosChange = latlngs.length !== curLatLngs.length;
      for (let i = 0; i < curLatLngs.length && !bPosChange; i++) {
        const latlng = curLatLngs[i];
        if (latlng instanceof L.LatLng && latlng.equals(latlngs[i])) {
          bPosChange = true;
        }
      }
      if (bPosChange) {
        polyline.setLatLngs(latlngs);
      }

      for (let prop in polylineOptions) {
        if ((<any>polylineOptions)[prop] !== (<any>polyline.options)[prop]) {
          polyline.setStyle(polylineOptions);
          break;
        }
      }
    }
  }

  /**
   * Returns true if this object was destroyed; otherwise, false.
   *
   */
  isDestroyed(): boolean {
    return false;
  }

  /**
   * Removes and destroys all primitives created by this instance.
   */
  destroy() {
    const entities = this._entitiesToVisualize.values;
    const entityHash = this._entityHash;

    for (let i = entities.length - 1; i > -1; i--) {
      cleanEntity(entities[i], this._featureGroup, entityHash);
    }

    this.entityCollection.collectionChanged.removeEventListener(
      this._onCollectionChanged,
      this
    );
    this.leafletScene.map.removeLayer(this._featureGroup);
    return destroyObject(this);
  }

  /**
   * Computes the rectangular bounds which encloses the collection of
   * entities to be visualized.
   */
  getLatLngBounds(): LatLngBounds | undefined {
    let result: LatLngBounds | undefined;

    Object.keys(this._entityHash).forEach(entityId => {
      const entityDetails: any = this._entityHash[entityId];

      Object.keys(entityDetails).forEach(primitiveId => {
        const primitive = entityDetails[primitiveId];

        if (isDefined(primitive.layer)) {
          if (isDefined(primitive.layer.getBounds)) {
            const bounds = primitive.layer.getBounds();
            if (isDefined(bounds)) {
              result =
                result === undefined
                  ? L.latLngBounds(bounds.getSouthWest(), bounds.getNorthEast())
                  : result.extend(bounds);
            }
          }
          if (isDefined(primitive.layer.getLatLng)) {
            const latLng = primitive.layer.getLatLng();
            if (isDefined(latLng)) {
              result =
                result === undefined
                  ? L.latLngBounds([latLng])
                  : result.extend(latLng);
            }
          }
        }
      });
    });

    return result;
  }
}

function cleanEntity(
  entity: Entity,
  group: L.FeatureGroup,
  entityHash: EntityHash
) {
  const details = entityHash[entity.id];

  cleanPoint(entity, group, details);
  cleanPolygon(entity, group, details);
  cleanBillboard(entity, group, details);
  cleanLabel(entity, group, details);
  cleanPolyline(entity, group, details);

  delete entityHash[entity.id];
}

function cleanPoint(
  _entity: Entity,
  group: L.FeatureGroup,
  details: EntityDetails
) {
  if (isDefined(details.point) && isDefined(details.point.layer)) {
    group.removeLayer(details.point.layer);
    details.point = undefined;
  }
}

function cleanPolygon(
  _entity: Entity,
  group: L.FeatureGroup,
  details: EntityDetails
) {
  if (isDefined(details.polygon) && isDefined(details.polygon.layer)) {
    group.removeLayer(details.polygon.layer);
    details.polygon = undefined;
  }
}

function cleanBillboard(
  _entity: Entity,
  group: L.FeatureGroup,
  details: EntityDetails
) {
  if (isDefined(details.billboard) && isDefined(details.billboard.layer)) {
    group.removeLayer(details.billboard.layer);
    details.billboard = undefined;
  }
}

function cleanLabel(
  _entity: Entity,
  group: L.FeatureGroup,
  details: EntityDetails
) {
  if (isDefined(details.label) && isDefined(details.label.layer)) {
    group.removeLayer(details.label.layer);
    details.label = undefined;
  }
}

function cleanPolyline(
  _entity: Entity,
  group: L.FeatureGroup,
  details: EntityDetails
) {
  if (isDefined(details.polyline) && isDefined(details.polyline.layer)) {
    group.removeLayer(details.polyline.layer);
    details.polyline = undefined;
  }
}

function positionToLatLng(position: Cartesian3, prevMarker?: L.CircleMarker) {
  const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position);
  let lon = CesiumMath.toDegrees(cartographic.longitude);
  if (prevMarker) {
    const prevLon = prevMarker.getLatLng().lng;
    if (prevLon - lon > 180) {
      lon = lon + 360;
    } else if (prevLon - lon < -180) {
      lon = lon - 360;
    }
  }

  return L.latLng(CesiumMath.toDegrees(cartographic.latitude), lon);
}

function hierarchyToLatLngs(hierarchy: PolygonHierarchy) {
  // This function currently does not handle polygons with holes.

  const positions = Array.isArray(hierarchy) ? hierarchy : hierarchy.positions;
  return convertEntityPositionsToLatLons(positions);
}

//Recolor an image using 2d canvas
function recolorBillboard(
  img: HTMLImageElement,
  color: Color
): string | undefined {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  // Copy the image contents to the canvas
  const context = canvas.getContext("2d");
  if (context === null) {
    return;
  }

  context.drawImage(img, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const normClr = [color.red, color.green, color.blue, color.alpha];

  const length = image.data.length; //pixel count * 4
  for (let i = 0; i < length; i += 4) {
    for (let j = 0; j < 4; j++) {
      image.data[j + i] *= normClr[j];
    }
  }

  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

function featureClicked(
  visualizer: LeafletGeomVisualizer,
  entity: Entity,
  event: L.LeafletEvent
) {
  visualizer.leafletScene.featureClicked.raiseEvent(entity, event);
}

function featureMousedown(
  visualizer: LeafletGeomVisualizer,
  entity: Entity,
  event: L.LeafletEvent
) {
  visualizer.leafletScene.featureMousedown.raiseEvent(entity, event);
}

function getValue<T>(
  property: Property | undefined,
  time: JulianDate
): T | undefined {
  if (isDefined(property)) {
    return property.getValue(time);
  }
}

function getValueOrDefault<T>(
  property: Property | undefined,
  time: JulianDate,
  defaultValue: T
): T {
  if (isDefined(property)) {
    const value = property.getValue(time);
    if (isDefined(value)) {
      return value;
    }
  }
  return defaultValue;
}

function getValueOrUndefined(property: Property | undefined, time: JulianDate) {
  if (isDefined(property)) {
    return property.getValue(time);
  }
}

function convertEntityPositionsToLatLons(positions: Cartesian3[]) {
  var carts = Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
  var latlngs = [];
  let lastLongitude;
  for (var p = 0; p < carts.length; p++) {
    let lon = CesiumMath.toDegrees(carts[p].longitude);

    if (lastLongitude !== undefined) {
      if (lastLongitude - lon > 180) {
        lon = lon + 360;
      } else if (lastLongitude - lon < -180) {
        lon = lon - 360;
      }
    }

    latlngs.push(L.latLng(CesiumMath.toDegrees(carts[p].latitude), lon));
    lastLongitude = lon;
  }
  return latlngs;
}

export default class LeafletVisualizer {
  visualizersCallback(
    leafletScene: LeafletScene,
    _entityCluster: EntityCluster,
    dataSource: DataSource
  ) {
    const entities = dataSource.entities;
    return [new LeafletGeomVisualizer(leafletScene, entities)];
  }
}
