import { VectorTileFeature } from "@mapbox/vector-tile";
import i18next from "i18next";
import { clone } from "lodash-es";
import { action, computed, observable, runInAction } from "mobx";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import isDefined from "../../../Core/isDefined";
import MapboxVectorTileImageryProvider from "../../../Map/MapboxVectorTileImageryProvider";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import MappableMixin, { MapItem } from "../../../ModelMixins/MappableMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import LegendTraits, {
  LegendItemTraits
} from "../../../Traits/TraitsClasses/LegendTraits";
import MapboxVectorTileCatalogItemTraits from "../../../Traits/TraitsClasses/MapboxVectorTileCatalogItemTraits";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";

import Point from "@mapbox/point-geometry";
import { ZxySource, PmtilesSource, TileCache } from "protomaps/src/tilecache";
import { View } from "protomaps/src/view";
import { painter } from "protomaps/src/painter";
import { Labelers } from "protomaps/src/labeler";
import {
  paint_rules as lightPaintRules,
  label_rules as lightLabelRules
} from "protomaps/src/default_style/light";
import {
  paint_rules as darkPaintRules,
  label_rules as darkLabelRules
} from "protomaps/src/default_style/dark";

class MapboxVectorTileLoadableStratum extends LoadableStratum(
  MapboxVectorTileCatalogItemTraits
) {
  static stratumName = "MapboxVectorTileLoadable";

  constructor(readonly item: MapboxVectorTileCatalogItem) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new MapboxVectorTileLoadableStratum(
      newModel as MapboxVectorTileCatalogItem
    ) as this;
  }

  static async load(item: MapboxVectorTileCatalogItem) {
    return new MapboxVectorTileLoadableStratum(item);
  }

  @computed get legends() {
    return [
      createStratumInstance(LegendTraits, {
        items: [
          createStratumInstance(LegendItemTraits, {
            color: this.item.fillColor,
            outlineColor: this.item.lineColor,
            title: this.item.name
          })
        ]
      })
    ];
  }
}

StratumOrder.addLoadStratum(MapboxVectorTileLoadableStratum.stratumName);

class MapboxVectorTileCatalogItem extends MappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(MapboxVectorTileCatalogItemTraits)))
) {
  @observable
  public readonly forceProxy = true;

  static readonly type = "mvt";

  get type() {
    return MapboxVectorTileCatalogItem.type;
  }

  get typeName() {
    return i18next.t("models.mapboxVectorTile.name");
  }

  async forceLoadMetadata() {
    const stratum = await MapboxVectorTileLoadableStratum.load(this);
    runInAction(() => {
      this.strata.set(MapboxVectorTileLoadableStratum.stratumName, stratum);
    });

    // tpe_sample.pmtiles
  }

  @computed
  get imageryProvider(): MapboxVectorTileImageryProvider | undefined {
    if (this.url === undefined || this.layer === undefined) {
      return;
    }

    return new MapboxVectorTileImageryProvider({
      url: this.url,
      layerName: this.layer,
      styleFunc: (opts => () => ({
        ...opts,
        lineJoin: "miter" as CanvasLineJoin,
        lineWidth: 1
      }))({ fillStyle: this.fillColor, strokeStyle: this.lineColor }),
      minimumZoom: this.minimumZoom,
      maximumNativeZoom: this.maximumNativeZoom,
      maximumZoom: this.maximumZoom,
      uniqueIdProp: this.idProperty,
      featureInfoFunc: this.featureInfoFromFeature,
      credit: this.attribution
    });
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed
  get mapItems(): MapItem[] {
    if (this.isLoadingMapItems || this.imageryProvider === undefined) {
      return [];
    }

    return [
      {
        imageryProvider: this.imageryProvider,
        show: this.show,
        alpha: this.opacity,
        clippingRectangle: this.clipToRectangle
          ? this.cesiumRectangle
          : undefined
      }
    ];
  }

  @action.bound
  featureInfoFromFeature(feature: VectorTileFeature) {
    const featureInfo = new ImageryLayerFeatureInfo();
    if (isDefined(this.nameProperty)) {
      featureInfo.name = feature.properties[this.nameProperty];
    }
    (featureInfo as any).properties = clone(feature.properties);
    featureInfo.data = {
      id: feature.properties[this.idProperty]
    }; // For highlight
    return featureInfo;
  }

  public async renderTile(
    coords: { x: number; y: number; z: number },
    element: HTMLCanvasElement
  ) {
    const tile_size = 256;
    let BUF = 16;
    let bbox = [
      256 * coords.x - BUF,
      256 * coords.y - BUF,
      256 * (coords.x + 1) + BUF,
      256 * (coords.y + 1) + BUF
    ];
    let origin = new Point(256 * coords.x, 256 * coords.y);

    let ctx = element.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(tile_size / 256, 0, 0, tile_size / 256, 0, 0);
    ctx.clearRect(0, 0, 256, 256);

    let painting_time = painter(
      ctx,
      [prepared_tile],
      label_data,
      darkPaintRules,
      bbox,
      origin,
      false,
      this.debug
    );

    // if (this.debug) {
    //     let data_tile = prepared_tile.data_tile
    //     ctx.save()
    //     ctx.fillStyle = this.debug
    //     ctx.font = '600 12px sans-serif'
    //     ctx.fillText(coords.z + " " + coords.x + " " + coords.y,4,14)
    //     ctx.font = '200 12px sans-serif'
    //     if ((data_tile.x % 2 + data_tile.y % 2) % 2 == 0) {
    //         ctx.font = '200 italic 12px sans-serif'
    //     }
    //     ctx.fillText(data_tile.z + " " + data_tile.x + " " + data_tile.y,4,28)
    //     ctx.font = '600 10px sans-serif'
    //     if (painting_time > 8) {
    //         ctx.fillText(painting_time.toFixed() + " ms paint",4,42)
    //     }
    //     if (layout_time > 8) {
    //         ctx.fillText(layout_time.toFixed() + " ms layout",4,56)
    //     }
    //     ctx.strokeStyle = this.debug
    //     ctx.lineWidth = 0.5
    //     ctx.strokeRect(0,0,256,256)
    //     ctx.restore()
    // }
  }

  public clearLayout() {
    this.labelers = new Labelers(
      this.scratch,
      this.label_rules,
      this.onTilesInvalidated
    );
  }

  public queryFeatures(lng: number, lat: number) {
    return this.view.queryFeatures(lng, lat, this._map.getZoom());
  }
}

export default MapboxVectorTileCatalogItem;
