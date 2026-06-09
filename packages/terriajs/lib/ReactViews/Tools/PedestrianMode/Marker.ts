import { makeObservable } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CreateModel from "../../../Models/Definition/CreateModel";
import { ModelConstructorParameters } from "../../../Models/Definition/Model";
import MappableTraits from "../../../Traits/TraitsClasses/MappableTraits";

export default class Marker extends MappableMixin(CreateModel(MappableTraits)) {
  private dataSource: CustomDataSource;

  /**
   * Marker rotation in radians
   */
  public rotation: number | undefined;

  /**
   * Marker position
   */
  public position: Cartesian3 | undefined;

  /**
   * Marker URL
   */
  public iconUrl: string | undefined;

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);

    this.dataSource = new CustomDataSource();
    this.dataSource.entities.add(
      new Entity({
        billboard: new BillboardGraphics({
          width: 24,
          height: 24,
          image: new CallbackProperty(() => this.iconUrl, false),
          rotation: new CallbackProperty(() => this.rotation, false)
        }),
        position: new CallbackProperty(() => this.position, false) as any
      })
    );
  }

  async forceLoadMapItems() {}

  get mapItems() {
    return [this.dataSource];
  }
}
