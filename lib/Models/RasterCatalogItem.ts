import { computed, runInAction, observable, action, autorun } from "mobx";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import RasterCatalogItemTraits from "../Traits/RasterCatalogItemTraits";
import CreateModel from "./CreateModel";
import RasterImageryProvider, { RasterImageryProviderOptions } from "../Map/RasterImageryProvider";

import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import StratumOrder from "./StratumOrder";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import flattenNested from "../Core/flattenNested";

const jsdap = require("jsdap");


export interface DdsLayer {
  id: string;
  name: string;
  type: string;
  array: { dimensions: string[]; shape: number[] };
  attributes: { long_name: string; missing_value: number; units: string };
}

function isDdsLayer(value?: any): value is DdsLayer {
  return (
    typeof value === "object" &&
    "id" in value &&
    "name" in value &&
    "array" in value &&
    "attributes" in value
  );
}

export interface IDdsType {
  attributes: any;
  id: string;
  name: string;
  type: string;
  [key: string]: DdsLayer | string;
}

class RasterLoadableStratum extends LoadableStratum(RasterCatalogItemTraits) {
  static stratumName = "rasterLoadable";

  constructor(readonly item: RasterCatalogItem) {
    super();
  }

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new RasterLoadableStratum(newModel as RasterCatalogItem) as this;
  }

  static async load(item: RasterCatalogItem) {
    return new RasterLoadableStratum(item);
  }

  @computed get rectangle() {
    return this.item.bbox;
  }
}

StratumOrder.addLoadStratum(RasterLoadableStratum.stratumName);

class RasterCatalogItem extends AsyncMappableMixin(
  UrlMixin(CatalogMemberMixin(CreateModel(RasterCatalogItemTraits)))
) {
  @observable
  private imageryProvider: RasterImageryProvider | undefined;
  private _bbox: Rectangle | undefined;

  @observable
  public readonly layers = "main";

  @observable
  private _availableDimensions: { [key: string]: any } = {};

  @observable
  private _dimensions: { [key: string]: string } = {};

  private _ddsLayers: DdsLayer[] = [];
  private currentDdsLayer?: DdsLayer

  private currentCanvasImageryProvider: RasterImageryProviderOptions | undefined

  @observable
  public colorScaleMinimum: number | undefined

  @observable
  public colorScaleMaximum: number | undefined

  public readonly forceProxy = true;

  static readonly type = "raster";
  get type() {
    return RasterCatalogItem.type;
  }

  get bbox() {
    return this._bbox;
  }

  get dimensions() {
    return this._dimensions;
  }

  set dimensions(d) {
    this._dimensions = d;
  }

  get availableDimensions() {
    return this._availableDimensions;
  }

  readonly canZoomTo = true;

  async forceLoadMetadata() {
    const stratum = await RasterLoadableStratum.load(this);
    runInAction(() => {
      this.strata.set(RasterLoadableStratum.stratumName, stratum);
    });

    const url = proxyCatalogItemUrl(
      this,
      `http://climate-data.it.csiro.au:8080/thredds/dodsC/data/authoritative/VIC-5/CSIRO/NOAA-GFDL-GFDL-ESM2M/rcp85/r1i1p1/CSIRO-CCAM-r3355/v1/mon/tasmax/aggregates/tasmax_VIC-5_NOAA-GFDL-GFDL-ESM2M_rcp85_r1i1p1_CSIRO-CCAM-r3355_v1_mon_2020-2039-seasavg-clim.nc`
    );

    const dds: IDdsType = (await new Promise((resolve, reject) => {
      jsdap.loadDataset(url, (data: any) => {
        resolve(data);
      });
    })) as IDdsType;

    this._ddsLayers = Object.keys(dds)
      .filter(
        key => isDdsLayer(dds[key]) && (dds[key] as DdsLayer).type === "Grid"
      )
      .map(key => dds[key] as DdsLayer);

      console.log(this._ddsLayers);

    runInAction(() => {
      this._dimensions = { Layer: this._ddsLayers[0].id, Style: 'viridis' };

      this._availableDimensions = {
        main: [
          {
            name: "Layer",
            default: this._ddsLayers[0].id,
            options: this._ddsLayers.map(layer => layer.id)
          },
          {
            name: "Style",
            default: 'viridis',
            options: RasterImageryProvider.colorscales
          },
        ]
      };
    });
  }

  protected async forceLoadMapItems(): Promise<void> {
    await this.loadMetadata();
    this.updateImageryProvider()
  }

  private updateImageryProvider() {
    autorun(async () => {
      // Note: observables will not be tracked in async function blocks (ie after `const dapData: any = await...`)
      const layerId = this._dimensions.Layer
      const style = this._dimensions.Style
      const minValue = this.colorScaleMinimum
      const maxValue = this.colorScaleMaximum
      

      // Only fetch data if the layerId has changed
      if (typeof this.currentDdsLayer === 'undefined' || this.currentDdsLayer.id !== layerId) {
        this.currentDdsLayer = this._ddsLayers.find(
          layer => layer.id === layerId
        );
    
        if (typeof this.currentDdsLayer === "undefined") {
          this.currentDdsLayer = this._ddsLayers[0];
        }
    
        const url = proxyCatalogItemUrl(
          this,
          `http://climate-data.it.csiro.au:8080/thredds/dodsC/data/authoritative/VIC-5/CSIRO/NOAA-GFDL-GFDL-ESM2M/rcp85/r1i1p1/CSIRO-CCAM-r3355/v1/mon/tasmax/aggregates/tasmax_VIC-5_NOAA-GFDL-GFDL-ESM2M_rcp85_r1i1p1_CSIRO-CCAM-r3355_v1_mon_2080-2099-seasavg-clim.nc.dods?${
            this.currentDdsLayer.id
          }[0:1:0]`
        );
    
        const dapData: any = await new Promise((resolve, reject) => {
          jsdap.loadData(url, (data: any) => {
            resolve(data);
          });
        });
    
        // Actual data values are first element in dapData[]
        // Then the following dimensions: ["time", "lat", "lon"]
    
        // dapData.dds[variable].array.dimensions.findIndex()
    
        const bbox = [
          Math.min(...dapData[0][3]),
          Math.min(...dapData[0][2]),
          Math.max(...dapData[0][3]),
          Math.max(...dapData[0][2])
        ];
  
        this._bbox = new Rectangle(...bbox);
    
        const rectangle = Rectangle.fromDegrees(...bbox);
    
        const width = this.currentDdsLayer.array.shape[2];
        const height = this.currentDdsLayer.array.shape[1];
    
        // Must reverse rows (for some reason?)
        dapData[0][0].forEach((row: number[]) => {
          row.reverse();
        });
    
        const pixels = flattenNested(dapData[0][0]);
    
        if (typeof minValue === 'undefined' || typeof maxValue === 'undefined') {
          runInAction(() => {
            this.colorScaleMinimum = Math.min(...pixels)
            this.colorScaleMaximum = Math.max(...pixels)
          })
        }
  
        this.currentCanvasImageryProvider = {rectangle,
          pixels,
          height,
          width, valueDomain: [this.colorScaleMinimum as number, this.colorScaleMaximum as number]}
      }
      
  
      if (typeof this.currentCanvasImageryProvider !== 'undefined') {
  
        this.currentCanvasImageryProvider.valueDomain = [this.colorScaleMinimum as number, this.colorScaleMaximum as number]
        this.currentCanvasImageryProvider.colourScale = style
        runInAction(() => {
          this.imageryProvider = new RasterImageryProvider(this.currentCanvasImageryProvider as RasterImageryProviderOptions);
        });
      } 
    })
    
  }

  public refresh() {
    // this.updateImageryProvider()
  }

  @computed
  get mapItems() {
    if (this.isLoadingMapItems || this.imageryProvider === undefined) {
      return [];
    }

    return [
      {
        imageryProvider: this.imageryProvider,
        show: this.show,
        alpha: this.opacity,
        canZoomTo: this.canZoomTo
      }
    ];
  }
}

export default RasterCatalogItem;
