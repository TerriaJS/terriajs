import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import BillboardTraits from "../Traits/BillboardTraits";
import { computed, observable } from "mobx";
// import { DataSource, CustomDataSource, Entity, BillboardGraphics } from "terriajs-cesium";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import BillboardData from "../Billboard/BillboardData";
import { isNullOrUndefined } from "util";
import TableChartStyleTraits from "../Traits/TableChartStyleTraits";

export default function BillboardsMixin<
  T extends Constructor<Model<BillboardTraits>>> (Base: T) {

  abstract class BillboardsMixin extends Base {

    private defaultBillboard: BillboardGraphics | undefined;
    
    @observable
    billboardDataList: BillboardData[] | undefined;

    /**
     * Gets the items to show on the map.
     */
    @computed
    get mapItems(): DataSource[] {
      return [this.createBillboardDataSource()];
    }

    protected createBillboardDataSource(): DataSource {
      const dataSource = new CustomDataSource(this.name || "Billboards");
      dataSource.entities.suspendEvents();


      if (isNullOrUndefined(this.billboardDataList)) {
        return dataSource;
      }

      for (let billboardData of this.billboardDataList) {
        dataSource.entities.add(new Entity({
          position: billboardData.position,
          billboard: isNullOrUndefined(billboardData.billboard) ? this.defaultBillboard : billboardData.billboard
        }));

      }
      return dataSource;
    }

  }

  return BillboardsMixin;
}
