import i18next from "i18next";
import { computed } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import Resource from "terriajs-cesium/Source/Core/Resource";
import sampleTerrain from "terriajs-cesium/Source/Core/sampleTerrain";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import KmlDataSource from "terriajs-cesium/Source/DataSources/KmlDataSource";
import Property from "terriajs-cesium/Source/DataSources/Property";
import isDefined from "../../../Core/isDefined";
import readXml from "../../../Core/readXml";
import TerriaError from "../../../Core/TerriaError";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import KmlCatalogItemTraits from "../../../Traits/TraitsClasses/KmlCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

const kmzRegex = /\.kmz$/i;

class KmlCatalogItem extends MappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(KmlCatalogItemTraits)))
) {
  static readonly type = "kml";
  get type() {
    return KmlCatalogItem.type;
  }

  private _dataSource: KmlDataSource | undefined;

  private _kmlFile?: File;

  setFileInput(file: File) {
    this._kmlFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._kmlFile);
  }

  @computed get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  protected forceLoadMapItems(): Promise<void> {
    const createLoadError = () =>
      new TerriaError({
        sender: this,
        title: i18next.t("models.kml.errorLoadingTitle"),
        message: i18next.t("models.kml.errorLoadingMessage", {
          appName: this.terria.appName,
          email:
            '<a href="mailto:' +
            this.terria.supportEmail +
            '">' +
            this.terria.supportEmail +
            "</a>."
        })
      });

    return new Promise<string | Resource | Document | Blob>(resolve => {
      if (isDefined(this.kmlString)) {
        const parser = new DOMParser();
        resolve(parser.parseFromString(this.kmlString, "text/xml"));
      } else if (isDefined(this._kmlFile)) {
        if (this._kmlFile.name && this._kmlFile.name.match(kmzRegex)) {
          resolve(this._kmlFile);
        } else {
          resolve(readXml(this._kmlFile));
        }
      } else if (isDefined(this.url)) {
        resolve(proxyCatalogItemUrl(this, this.url));
      } else {
        throw new TerriaError({
          sender: this,
          title: i18next.t("models.kml.unableToLoadItemTitle"),
          message: i18next.t("models.kml.unableToLoadItemMessage")
        });
      }
    })
      .then(kmlLoadInput => {
        return KmlDataSource.load(kmlLoadInput);
      })
      .then(dataSource => {
        this._dataSource = dataSource;
        this.doneLoading(dataSource); // Unsure if this is necessary
      })
      .catch(e => {
        if (e instanceof TerriaError) {
          throw e;
        } else {
          throw createLoadError();
        }
      });
  }

  @computed
  get mapItems() {
    if (this.isLoadingMapItems || this._dataSource === undefined) {
      return [];
    }
    this._dataSource.show = this.show;
    return [this._dataSource];
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  private doneLoading(kmlDataSource: KmlDataSource) {
    // Clamp features to terrain.
    if (isDefined(this.terria.cesium)) {
      const positionsToSample: Cartographic[] = [];
      const correspondingCartesians: Cartesian3[] = [];

      const entities = kmlDataSource.entities.values;
      for (let i = 0; i < entities.length; ++i) {
        const entity = entities[i];

        const polygon = entity.polygon;
        if (isDefined(polygon)) {
          polygon.perPositionHeight = (true as unknown) as Property;
          const polygonHierarchy = getPropertyValue<PolygonHierarchy>(
            polygon.hierarchy
          );
          if (polygonHierarchy) {
            samplePolygonHierarchyPositions(
              polygonHierarchy,
              positionsToSample,
              correspondingCartesians
            );
          }
        }
      }
      const terrainProvider = this.terria.cesium.scene.globe.terrainProvider;
      sampleTerrain(terrainProvider, 11, positionsToSample).then(function() {
        for (let i = 0; i < positionsToSample.length; ++i) {
          const position = positionsToSample[i];
          if (!isDefined(position.height)) {
            continue;
          }

          Ellipsoid.WGS84.cartographicToCartesian(
            position,
            correspondingCartesians[i]
          );
        }

        // Force the polygons to be rebuilt.
        for (let i = 0; i < entities.length; ++i) {
          const polygon = entities[i].polygon;
          if (!isDefined(polygon)) {
            continue;
          }

          const existingHierarchy = getPropertyValue<PolygonHierarchy>(
            polygon.hierarchy
          );
          if (existingHierarchy) {
            polygon.hierarchy = new ConstantProperty(
              new PolygonHierarchy(
                existingHierarchy.positions,
                existingHierarchy.holes
              )
            );
          }
        }
      });
    }
  }
}

export default KmlCatalogItem;

function getPropertyValue<T>(property: Property | undefined): T | undefined {
  if (property === undefined) {
    return undefined;
  }
  return property.getValue(JulianDate.now());
}

function samplePolygonHierarchyPositions(
  polygonHierarchy: PolygonHierarchy,
  positionsToSample: Cartographic[],
  correspondingCartesians: Cartesian3[]
) {
  const positions = polygonHierarchy.positions;

  for (let i = 0; i < positions.length; ++i) {
    const position = positions[i];
    correspondingCartesians.push(position);
    positionsToSample.push(Ellipsoid.WGS84.cartesianToCartographic(position));
  }

  const holes = polygonHierarchy.holes;
  for (let i = 0; i < holes.length; ++i) {
    samplePolygonHierarchyPositions(
      holes[i],
      positionsToSample,
      correspondingCartesians
    );
  }
}
