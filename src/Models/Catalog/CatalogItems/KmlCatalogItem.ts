import i18next from "i18next";
import { computed, makeObservable, override } from "mobx";
import { Cartesian3 } from "cesium";
import { Cartographic } from "cesium";
import { Ellipsoid } from "cesium";
import { JulianDate } from "cesium";
import { PolygonHierarchy } from "cesium";
import { Resource } from "cesium";
import { sampleTerrain } from "cesium";
import { ConstantProperty } from "cesium";
import { KmlDataSource } from "cesium";
import { Property } from "cesium";
import isDefined from "../../../Core/isDefined";
import readXml from "../../../Core/readXml";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import KmlCatalogItemTraits from "../../../Traits/TraitsClasses/KmlCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import HasLocalData from "../../HasLocalData";
import { ModelConstructorParameters } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

const kmzRegex = /\.kmz$/i;

class KmlCatalogItem
  extends MappableMixin(
    UrlMixin(CatalogMemberMixin(CreateModel(KmlCatalogItemTraits)))
  )
  implements HasLocalData
{
  static readonly type = "kml";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return KmlCatalogItem.type;
  }

  _private_dataSource: KmlDataSource | undefined;

  _private_kmlFile?: File;

  setFileInput(file: File) {
    this._private_kmlFile = file;
  }

  @computed
  get hasLocalData(): boolean {
    return isDefined(this._private_kmlFile);
  }

  @override
  override get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  override _protected_forceLoadMapItems(): Promise<void> {
    return new Promise<string | Resource | Document | Blob>((resolve) => {
      if (isDefined(this.kmlString)) {
        const parser = new DOMParser();
        resolve(parser.parseFromString(this.kmlString, "text/xml"));
      } else if (isDefined(this._private_kmlFile)) {
        if (
          this._private_kmlFile.name &&
          this._private_kmlFile.name.match(kmzRegex)
        ) {
          resolve(this._private_kmlFile);
        } else {
          resolve(readXml(this._private_kmlFile));
        }
      } else if (isDefined(this.url)) {
        resolve(proxyCatalogItemUrl(this, this.url));
      } else {
        throw networkRequestError({
          sender: this,
          title: i18next.t("models.kml.unableToLoadItemTitle"),
          message: i18next.t("models.kml.unableToLoadItemMessage")
        });
      }
    })
      .then((kmlLoadInput) => {
        return KmlDataSource.load(kmlLoadInput);
      })
      .then((dataSource) => {
        this._private_dataSource = dataSource;
        this._private_doneLoading(dataSource); // Unsure if this is necessary
      })
      .catch((e) => {
        throw networkRequestError(
          TerriaError.from(e, {
            sender: this,
            title: i18next.t("models.kml.errorLoadingTitle"),
            message: i18next.t("models.kml.errorLoadingMessage", {
              appName: this.terria.appName
            })
          })
        );
      });
  }

  @computed
  get mapItems() {
    if (this.isLoadingMapItems || this._private_dataSource === undefined) {
      return [];
    }
    this._private_dataSource.show = this.show;
    return [this._private_dataSource];
  }

  override _protected_forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  _private_doneLoading(kmlDataSource: KmlDataSource) {
    // Clamp features to terrain.
    if (isDefined(this.terria.cesium)) {
      const positionsToSample: Cartographic[] = [];
      const correspondingCartesians: Cartesian3[] = [];

      const entities = kmlDataSource.entities.values;
      for (let i = 0; i < entities.length; ++i) {
        const entity = entities[i];

        const polygon = entity.polygon;
        if (isDefined(polygon)) {
          polygon.perPositionHeight = true as unknown as Property;
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
      sampleTerrain(terrainProvider, 11, positionsToSample).then(function () {
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
