import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CreateModel from "../../../Models/CreateModel";
import Terria from "../../../Models/Terria";
import MappableTraits from "../../../Traits/MappableTraits";

export default class Marker extends MappableMixin(CreateModel(MappableTraits)) {
  private dataSource: CustomDataSource;
  position: Cartesian3;

  constructor(terria: Terria, position: Cartesian3) {
    super(undefined, terria);
    this.position = position;
    this.dataSource = new CustomDataSource();

    const entity = new Entity({
      point: new PointGraphics({
        pixelSize: 10,
        color: Color.BLUE,
        outlineColor: Color.WHITE,
        outlineWidth: 1
      }),
      position: new CallbackProperty(() => this.position, false) as any
    });

    this.dataSource.entities.add(entity);
  }

  get mapItems() {
    return [this.dataSource];
  }
}
