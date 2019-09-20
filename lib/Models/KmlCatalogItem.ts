import { computed } from "mobx";

import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import KmlDataSource from "terriajs-cesium/Source/DataSources/KmlDataSource";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import sampleTerrain from "terriajs-cesium/Source/Core/sampleTerrain";
import TerriaError from "../Core/TerriaError";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import KmlCatalogItemTraits from "../Traits/KmlCatalogItemTraits"
import UrlMixin from "../ModelMixins/UrlMixin";
import isDefined from "../Core/isDefined";

import Terria from "./Terria";

const proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
import readXml from "../Core/readXml";

const kmzRegex = /\.kmz$/i;

class KmlCatalogItem extends AsyncMappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(KmlCatalogItemTraits)))
) {
  static readonly type = "kml";
  get type() {
    return KmlCatalogItem.type;
  }
  
  private _dataSource: KmlDataSource | undefined;

  private _kmlFile?: File;

  readonly canZoomTo = true;

  constructor(id: string, terria: Terria) {
      super(id, terria);
  }

  setFileInput(file: File) {
    this._kmlFile = file;
  }

  protected forceLoadMapItems(): Promise<void> {
      const createLoadError = () =>
        new TerriaError({
          sender: this,
          title: "Error loading KML or KMZ",
          message:
            `An error occurred while loading a KML or KMZ file. This may indicate that the file is invalid or ` +
            `that it is not supported by ${this.terria.appName}. If you would like assistance or further ` +
            `information, please email us at ` +
            `<a href="mailto:${this.terria.supportEmail}">${this.terria.supportEmail}></a>.`
        });
      
      this._dataSource = new KmlDataSource({
        // Currently we don't pass camera and canvas, which are technically required as of Cesium v1.23.
        // We get away with it because A) the code to check that they're supplied is removed
        // in release builds of Cesium, and B) the code that actually uses them (building network
        // link URLs) has guards so it won't totally fail if they're not supplied.  But for
        // proper network link support, we'll need to figure out how to get those things in here,
        // even though a single KmlCatalogItem can be shown on multiple maps.  Some refactoring of
        // Cesium will be required.
        proxy: {
          // Don't cache resources referenced by the KML.
          getURL: (url: string) =>
            this.terria.corsProxy.getURLProxyIfNecessary(url, "0d")
        }
      });

      return new Promise((resolve, reject) => {
        if (isDefined(this.kmlData)) {
          return this._dataSource
            .load(this.kmlData, proxyCatalogItemUrl(this, this.url, "1d"))
            .then((kmlDataSource: KmlDataSource) => {
              return doneLoading(kmlDataSource);
            })
            .catch(function() {
              return createLoadError();
            })
        } else if (isDefined(this.kmlString)) {
          var parser = new DOMParser();
          resolve(parser.parseFromString(this.kmlString, "text/xml"));
        } else if (isDefined(this._kmlFile)) {
          resolve(readXml(this._kmlFile));
        } else if (isDefined(this.url)) {
          resolve()
        }
      })
  }

  @computed
  get mapItems() {

  }

  protected forceLoadMetadata(): Promise<void> {
      return Promise.resolve();
  }

  private doneLoading(kmlDataSource: KmlDataSource) {
    // Clamp features to terrain.
    if (isDefined(this.terria.cesium)) {
      var positionsToSample : Cartesian3[] = [];
      var correspondingCartesians : Cartesian3[] = [];

      var entities = kmlDataSource.entities.values;
      for (var i = 0; i < entities.length; ++i) {
        var entity = entities[i];

        var polygon = entity.polygon;
        if (isDefined(polygon)) {
          polygon.perPositionHeight = true;
          var polygonHierarchy = polygon.hierarchy.getValue(); // assuming hierarchy is not time-varying
          samplePolygonHierarchyPositions(
            polygonHierarchy,
            positionsToSample,
            correspondingCartesians
          );
        }
      }
      var terrainProvider = this.terria.cesium.scene.globe.terrainProvider;
      sampleTerrain(terrainProvider, 11, positionsToSample).then(function() {
        var i;
        for (i = 0; i < positionsToSample.length; ++i) {
          var position = positionsToSample[i];
          if (!isDefined(position.height)) {
            continue;
          }

          Ellipsoid.WGS84.cartographicToCartesian(
            position,
            correspondingCartesians[i]
          );
        }

        // Force the polygons to be rebuilt.
        for (i = 0; i < entities.length; ++i) {
          var polygon = entities[i].polygon;
          if (!isDefined(polygon)) {
            continue;
          }

          var existingHierarchy = polygon.hierarchy.getValue();
          polygon.hierarchy = new PolygonHierarchy(
            existingHierarchy.positions,
            existingHierarchy.holes
          );
        }
      });
    }
  }
}

export default KmlCatalogItem;

function samplePolygonHierarchyPositions(
  polygonHierarchy: PolygonHierarchy,
  positionsToSample: Cartesian3[],
  correspondingCartesians: Cartesian3[]
) {
  
}

