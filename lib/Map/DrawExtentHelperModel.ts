import CreateModel from "../Models/CreateModel";
import ModelTraits from "../Traits/ModelTraits";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import Terria from "../Models/Terria";
import mixTraits from "../Traits/mixTraits";
import AsyncMappableMixin from "../ModelMixins/AsyncMappableMixin";
import MappableTraits from "../Traits/MappableTraits";

class EmptyTraits extends mixTraits(MappableTraits) {}

export default class DrawExtentHelperModel extends AsyncMappableMixin(
  CreateModel(EmptyTraits)
) {
  constructor(terria: Terria, readonly dataSource: DataSource) {
    super("DrawExtentHelper", terria);
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  get mapItems() {
    return [this.dataSource];
  }
}
