import { makeObservable } from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Credit from "terriajs-cesium/Source/Core/Credit";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumEvent from "terriajs-cesium/Source/Core/Event";
import GeographicProjection from "terriajs-cesium/Source/Core/GeographicProjection";
import GeographicTilingScheme from "terriajs-cesium/Source/Core/GeographicTilingScheme";
import Math from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Resource from "terriajs-cesium/Source/Core/Resource";
import TilingScheme from "terriajs-cesium/Source/Core/TilingScheme";
import WebMercatorProjection from "terriajs-cesium/Source/Core/WebMercatorProjection";
import DiscardMissingTileImagePolicy from "terriajs-cesium/Source/Scene/DiscardMissingTileImagePolicy";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";
import TileDiscardPolicy from "terriajs-cesium/Source/Scene/TileDiscardPolicy";
import { JsonObject } from "../../Core/Json";

interface Options {
  url: string;
  token?: string;

  minimumLevel?: number;
  maximumLevel?: number;
  rectangle?: Rectangle;
  credit: Credit | string;
  tileCredits?: Credit[];
  enablePickFeatures?: boolean;
  tileWidth?: number;
  tileHeight?: number;
  ellipsoid?: Ellipsoid;
  tilingScheme?: TilingScheme;
  tileDiscardPolicy?: TileDiscardPolicy;
  parameters?: JsonObject;
}

/** This is adapted from Cesium's ArcGisMapServerImageryProvider
 * https://github.com/CesiumGS/cesium/blob/51aae2d21014cfc28e948b1719d07f1912df9434/packages/engine/Source/Scene/ArcGisMapServerImageryProvider.js
 * Code licensed under the Apache License v2.0.
 * For details, see https://github.com/CesiumGS/cesium/blob/main/LICENSE.md
 */

export default class ArcGisImageServerImageryProvider {
  readonly tilingScheme: TilingScheme;
  readonly ellipsoid: Ellipsoid;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly minimumLevel: number;
  readonly maximumLevel: number;
  readonly rectangle: Rectangle;
  readonly errorEvent = new CesiumEvent();
  readonly ready = true;
  readonly credit: Credit;
  readonly tileCredits: Credit[] | undefined;
  enablePickFeatures: boolean;
  readonly tileDiscardPolicy: TileDiscardPolicy;
  readonly baseResource: Resource;

  readonly defaultNightAlpha = undefined;
  readonly defaultDayAlpha = undefined;
  readonly hasAlphaChannel = true;
  readonly defaultAlpha = undefined;
  readonly defaultBrightness = undefined;
  readonly defaultContrast = undefined;
  readonly defaultGamma = undefined;
  readonly defaultHue = undefined;
  readonly defaultSaturation = undefined;
  readonly defaultMagnificationFilter = undefined;
  readonly defaultMinificationFilter = undefined;
  readonly readyPromise = Promise.resolve(true);

  constructor(options: Options) {
    makeObservable(this);

    const ellipsoid = options.ellipsoid;
    this.tilingScheme =
      options.tilingScheme ??
      new GeographicTilingScheme({ ellipsoid: ellipsoid });

    this.rectangle = options.rectangle ?? this.tilingScheme.rectangle;
    this.ellipsoid = ellipsoid ?? Ellipsoid.WGS84;

    let credit = options.credit;
    if (typeof credit === "string") {
      credit = new Credit(credit);
    }

    this.credit = credit;
    this.tileCredits = options.tileCredits;

    this.tileWidth = options.tileWidth ?? 256;
    this.tileHeight = options.tileHeight ?? 256;

    this.minimumLevel = options.minimumLevel ?? 0;
    this.maximumLevel = options.maximumLevel ?? 25;

    this.ready = true;

    this.credit =
      typeof options.credit === "string"
        ? new Credit(options.credit)
        : (options.credit as Credit);

    this.enablePickFeatures = options.enablePickFeatures ?? true;

    this.baseResource = new Resource(options.url);
    this.baseResource.appendForwardSlash();

    if (options.parameters) {
      this.baseResource.setQueryParameters(options.parameters);
    }

    if (options.token) {
      this.baseResource.setQueryParameters({
        token: options.token
      });
    }

    if (options.tileDiscardPolicy) {
      this.tileDiscardPolicy = options.tileDiscardPolicy;
    } else {
      this.tileDiscardPolicy = new DiscardMissingTileImagePolicy({
        missingImageUrl: this.buildImageResource(0, 0, this.maximumLevel).url,
        pixelsToCheck: [
          new Cartesian2(0, 0),
          new Cartesian2(200, 20),
          new Cartesian2(20, 200),
          new Cartesian2(80, 110),
          new Cartesian2(160, 130)
        ],
        disableCheckIfAllPixelsAreTransparent: true
      });
    }
  }

  get proxy() {
    return this.baseResource.proxy;
  }

  buildImageResource(x: number, y: number, level: number) {
    const nativeRectangle = this.tilingScheme.tileXYToNativeRectangle(
      x,
      y,
      level
    );
    const bbox = `${nativeRectangle.west},${nativeRectangle.south},${nativeRectangle.east},${nativeRectangle.north}`;

    const query: JsonObject = {
      bbox: bbox,
      size: `${this.tileWidth},${this.tileHeight}`,
      format: "png32",
      transparent: true,
      f: "image"
    };

    if (this.tilingScheme.projection instanceof GeographicProjection) {
      query.bboxSR = 4326;
      query.imageSR = 4326;
    } else {
      query.bboxSR = 3857;
      query.imageSR = 3857;
    }

    return this.baseResource.getDerivedResource({
      url: "exportImage",
      queryParameters: query
    });
  }

  getTileCredits(): Credit[] {
    return this.tileCredits ?? [];
  }

  requestImage(x: number, y: number, level: number): any {
    return ImageryProvider.loadImage(
      this,
      this.buildImageResource(x, y, level)
    );
  }

  async pickFeatures(
    x: number,
    y: number,
    level: number,
    longitude: number,
    latitude: number
  ): Promise<ImageryLayerFeatureInfo[]> {
    if (!this.enablePickFeatures) {
      return [];
    }

    const rectangle = this.tilingScheme.tileXYToNativeRectangle(x, y, level);

    let horizontal;
    let vertical;
    let sr;
    if (this.tilingScheme.projection instanceof GeographicProjection) {
      horizontal = Math.toDegrees(longitude);
      vertical = Math.toDegrees(latitude);
      sr = "4326";
    } else {
      const projected = this.tilingScheme.projection.project(
        new Cartographic(longitude, latitude, 0.0)
      );
      horizontal = projected.x;
      vertical = projected.y;
      sr = "3857";
    }

    const query = {
      f: "json",
      tolerance: 2,
      geometryType: "esriGeometryPoint",
      geometry: `${horizontal},${vertical}`,
      mapExtent: `${rectangle.west},${rectangle.south},${rectangle.east},${rectangle.north}`,
      imageDisplay: `${this.tileWidth},${this.tileHeight},96`,
      sr: sr
    };

    const resource = this.baseResource.getDerivedResource({
      url: "identify",
      queryParameters: query
    });

    const json = await resource.fetchJson();
    const result: ImageryLayerFeatureInfo[] = [];

    const features = json.results;
    if (!features) {
      return result;
    }

    for (let i = 0; i < features.length; ++i) {
      const feature = features[i];

      const featureInfo = new ImageryLayerFeatureInfo();
      featureInfo.data = feature;
      featureInfo.name = feature.value;
      featureInfo.properties = feature.attributes;
      featureInfo.configureDescriptionFromProperties(feature.attributes);

      // If this is a point feature, use the coordinates of the point.
      if (feature.geometryType === "esriGeometryPoint" && feature.geometry) {
        const wkid =
          feature.geometry.spatialReference &&
          feature.geometry.spatialReference.wkid
            ? feature.geometry.spatialReference.wkid
            : 4326;
        if (wkid === 4326 || wkid === 4283) {
          featureInfo.position = Cartographic.fromDegrees(
            feature.geometry.x,
            feature.geometry.y,
            feature.geometry.z
          );
        } else if (wkid === 102100 || wkid === 900913 || wkid === 3857) {
          const projection = new WebMercatorProjection();
          featureInfo.position = projection.unproject(
            new Cartesian3(
              feature.geometry.x,
              feature.geometry.y,
              feature.geometry.z
            )
          );
        }
      }

      result.push(featureInfo);
    }

    return result;
  }
}
