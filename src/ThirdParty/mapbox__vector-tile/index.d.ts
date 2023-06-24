declare module "@mapbox/vector-tile" {
  import Protobuf from "pbf";
  import Point from "@mapbox/point-geometry";

  export enum VectorTileFeatureType {
    POLYGON_FEATURE = 3
  }

  export class VectorTileFeature {
    static types: string[];
    type: VectorTileFeatureType;
    properties: { [key: string]: string };
    bbox: () => number[];
    loadGeometry(): Point[][];
  }

  export class VectorTileLayer {
    length: number;
    feature(i: number): VectorTileFeature;
    extent: number;
  }

  export class VectorTile {
    constructor(protobuf: Protobuf, end?: number);
    layers: { [key: string]: VectorTileLayer };
  }
}
