import BillboardData from './BillboardData'
import CustomDataSource from 'terriajs-cesium/Source/DataSources/CustomDataSource'
import DataSource from 'terriajs-cesium/Source/DataSources/CustomDataSource'
import BillboardGraphics from 'terriajs-cesium/Source/DataSources/BillboardGraphics'
import Entity from 'terriajs-cesium/Source/DataSources/Entity'

export default function createBillboardDataSource(name: string, billboardDataList: BillboardData[]): DataSource {
    const dataSource = new CustomDataSource(name || "Billboards");
    dataSource.entities.suspendEvents();

    if (billboardDataList === null || billboardDataList === undefined) {
      return dataSource;
    }

    for (let billboardData of billboardDataList) {
      dataSource.entities.add(new Entity(billboardData));

    }
    return dataSource;
}