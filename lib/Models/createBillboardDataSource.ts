import BillboardData from "./BillboardData";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
import NearFarScalar from "terriajs-cesium/Source/Core/NearFarScalar";
import Color from "terriajs-cesium/Source/Core/Color";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";

import { func } from "prop-types";

export function createBillboardDataSource(
  name: string,
  billboardDataList: BillboardData[]
): CustomDataSource {
  const dataSource = new CustomDataSource(name || "Billboards");
  dataSource.entities.suspendEvents();

  for (let billboardData of billboardDataList) {
    let billboard = new BillboardGraphics(
      billboardData.billboardGraphicsOptions
    );
    dataSource.entities.add(
      new Entity({
        position: billboardData.position,
        billboard: billboard
      })
    );
  }

  dataSource.entities.resumeEvents();
  return dataSource;
}

export function updateBillboardDataSource(
  dataSource: CustomDataSource,
  updater: (entity: Entity) => void
) {
  dataSource.entities.suspendEvents();
  for (let entity of dataSource.entities.values) {
    updater(entity);
  }

  dataSource.entities.resumeEvents();
  return dataSource;
}
