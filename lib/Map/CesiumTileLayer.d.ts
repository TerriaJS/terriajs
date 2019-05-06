export = CesiumTileLayer;

declare class CesiumTileLayer extends L.TileLayer {
  constructor(
    imageryProvider: Cesium.ImageryProvider,
    options?: L.TileLayerOptions
  );
}
