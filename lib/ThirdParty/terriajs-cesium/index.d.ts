// Generated from the intersection of:
// - properties available on Cesium object
// - files in Source/**/*
// - typings in @types/cesium/index.d.ts

declare module "terriajs-cesium/Source/Core/AssociativeArray" {
  export default Cesium.AssociativeArray;
}
declare module "terriajs-cesium/Source/Core/AxisAlignedBoundingBox" {
  export default Cesium.AxisAlignedBoundingBox;
}
declare module "terriajs-cesium/Source/Core/BingMapsApi" {
  export default class BingMapsApi {
    static getKey(providedKey?: string): string;
  }
}
declare module "terriajs-cesium/Source/Core/BoundingRectangle" {
  export default Cesium.BoundingRectangle;
}
declare module "terriajs-cesium/Source/Core/BoundingSphere" {
  export default Cesium.BoundingSphere;
}
declare module "terriajs-cesium/Source/Core/BoxGeometry" {
  export default Cesium.BoxGeometry;
}
declare module "terriajs-cesium/Source/Core/BoxOutlineGeometry" {
  export default Cesium.BoxOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/Cartesian2" {
  export default Cesium.Cartesian2;
}
declare module "terriajs-cesium/Source/Core/Cartesian3" {
  export default Cesium.Cartesian3;
}
declare module "terriajs-cesium/Source/Core/Cartesian4" {
  export default Cesium.Cartesian4;
}
declare module "terriajs-cesium/Source/Core/Cartographic" {
  export default Cesium.Cartographic;
}
declare module "terriajs-cesium/Source/Core/CatmullRomSpline" {
  export default Cesium.CatmullRomSpline;
}
declare module "terriajs-cesium/Source/Core/CesiumTerrainProvider" {
  import Credit from "terriajs-cesium/Source/Core/Credit";
  import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
  import IonResource from "terriajs-cesium/Source/Core/IonResource";
  import TerrainProvider from "terriajs-cesium/Source/Core/TerrainProvider";
  namespace Cesium {
    class CesiumTerrainProvider extends TerrainProvider {
      requestVertexNormals: boolean;
      requestWaterMask: boolean;
      constructor(options: {
        url: string | Promise<IonResource>;
        proxy?: any; // Should be Proxy
        requestVertexNormals?: boolean;
        requestWaterMask?: boolean;
        ellipsoid?: Ellipsoid;
        credit?: Credit | string;
      });
    }
  }
  export default Cesium.CesiumTerrainProvider;
}
declare module "terriajs-cesium/Source/Core/CircleGeometry" {
  export default Cesium.CircleGeometry;
}
declare module "terriajs-cesium/Source/Core/CircleOutlineGeometry" {
  export default Cesium.CircleOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/Clock" {
  export default Cesium.Clock;
}
declare module "terriajs-cesium/Source/Core/ClockRange" {
  export default Cesium.ClockRange;
}
declare module "terriajs-cesium/Source/Core/ClockStep" {
  export default Cesium.ClockStep;
}
declare module "terriajs-cesium/Source/Core/Color" {
  export default Cesium.Color;
}
declare module "terriajs-cesium/Source/Core/ColorGeometryInstanceAttribute" {
  export default Cesium.ColorGeometryInstanceAttribute;
}
declare module "terriajs-cesium/Source/Core/ComponentDatatype" {
  export default Cesium.ComponentDatatype;
}
declare module "terriajs-cesium/Source/Core/CornerType" {
  export default Cesium.CornerType;
}
declare module "terriajs-cesium/Source/Core/CorridorGeometry" {
  export default Cesium.CorridorGeometry;
}
declare module "terriajs-cesium/Source/Core/CorridorOutlineGeometry" {
  export default Cesium.CorridorOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/Credit" {
  export default Cesium.Credit;
}
declare module "terriajs-cesium/Source/Core/CubicRealPolynomial" {
  export default Cesium.CubicRealPolynomial;
}
declare module "terriajs-cesium/Source/Core/CullingVolume" {
  export default Cesium.CullingVolume;
}
declare module "terriajs-cesium/Source/Core/CylinderGeometry" {
  export default Cesium.CylinderGeometry;
}
declare module "terriajs-cesium/Source/Core/CylinderOutlineGeometry" {
  export default Cesium.CylinderOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/DefaultProxy" {
  export default Cesium.DefaultProxy;
}
declare module "terriajs-cesium/Source/Core/DeveloperError" {
  export default Cesium.DeveloperError;
}
declare module "terriajs-cesium/Source/Core/DistanceDisplayCondition" {
  export default Cesium.DistanceDisplayCondition;
}
declare module "terriajs-cesium/Source/Core/EasingFunction" {
  export default Cesium.EasingFunction;
}
declare module "terriajs-cesium/Source/Core/EllipseGeometry" {
  export default Cesium.EllipseGeometry;
}
declare module "terriajs-cesium/Source/Core/EllipseOutlineGeometry" {
  export default Cesium.EllipseOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/Ellipsoid" {
  export default Cesium.Ellipsoid;
}
declare module "terriajs-cesium/Source/Core/EllipsoidGeodesic" {
  export default Cesium.EllipsoidGeodesic;
}
declare module "terriajs-cesium/Source/Core/EllipsoidGeometry" {
  export default Cesium.EllipsoidGeometry;
}
declare module "terriajs-cesium/Source/Core/EllipsoidOutlineGeometry" {
  export default Cesium.EllipsoidOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/EllipsoidTangentPlane" {
  export default Cesium.EllipsoidTangentPlane;
}
declare module "terriajs-cesium/Source/Core/EllipsoidTerrainProvider" {
  export default Cesium.EllipsoidTerrainProvider;
}
declare module "terriajs-cesium/Source/Core/Event" {
  export default Cesium.Event;
}
declare module "terriajs-cesium/Source/Core/EventHelper" {
  export default Cesium.EventHelper;
}
declare module "terriajs-cesium/Source/Core/ExtrapolationType" {
  export default Cesium.ExtrapolationType;
}
declare module "terriajs-cesium/Source/Core/FeatureDetection" {
  namespace Cesium.FeatureDetection {
    function isInternetExplorer(): boolean;
    function isEdge(): boolean;
    function internetExplorerVersion(): any[];
  }
  export default Cesium.FeatureDetection;
}
declare module "terriajs-cesium/Source/Core/Fullscreen" {
  export default Cesium.Fullscreen;
}
declare module "terriajs-cesium/Source/Core/GeographicProjection" {
  export default Cesium.GeographicProjection;
}
declare module "terriajs-cesium/Source/Core/GeographicTilingScheme" {
  export default Cesium.GeographicTilingScheme;
}
declare module "terriajs-cesium/Source/Core/Geometry" {
  export default Cesium.Geometry;
}
declare module "terriajs-cesium/Source/Core/GeometryAttribute" {
  export default Cesium.GeometryAttribute;
}
declare module "terriajs-cesium/Source/Core/GeometryAttributes" {
  export default Cesium.GeometryAttributes;
}
declare module "terriajs-cesium/Source/Core/GeometryInstance" {
  export default Cesium.GeometryInstance;
}
declare module "terriajs-cesium/Source/Core/GeometryInstanceAttribute" {
  export default Cesium.GeometryInstanceAttribute;
}
declare module "terriajs-cesium/Source/Core/GeometryPipeline" {
  export default Cesium.GeometryPipeline;
}
declare module "terriajs-cesium/Source/Core/GoogleEarthEnterpriseMetadata" {
  export default Cesium.GoogleEarthEnterpriseMetadata;
}
declare module "terriajs-cesium/Source/Core/GoogleEarthEnterpriseTerrainData" {
  export default Cesium.GoogleEarthEnterpriseTerrainData;
}
declare module "terriajs-cesium/Source/Core/GoogleEarthEnterpriseTerrainProvider" {
  export default Cesium.GoogleEarthEnterpriseTerrainProvider;
}
declare module "terriajs-cesium/Source/Core/GregorianDate" {
  export default Cesium.GregorianDate;
}
declare module "terriajs-cesium/Source/Core/HeadingPitchRange" {
  export default Cesium.HeadingPitchRange;
}
declare module "terriajs-cesium/Source/Core/HeadingPitchRoll" {
  export default Cesium.HeadingPitchRoll;
}
declare module "terriajs-cesium/Source/Core/HeightmapTerrainData" {
  export default Cesium.HeightmapTerrainData;
}
declare module "terriajs-cesium/Source/Core/HeightmapTessellator" {
  export default Cesium.HeightmapTessellator;
}
declare module "terriajs-cesium/Source/Core/HermitePolynomialApproximation" {
  export default Cesium.HermitePolynomialApproximation;
}
declare module "terriajs-cesium/Source/Core/HermiteSpline" {
  export default Cesium.HermiteSpline;
}
declare module "terriajs-cesium/Source/Core/IndexDatatype" {
  export default Cesium.IndexDatatype;
}
declare module "terriajs-cesium/Source/Core/InterpolationAlgorithm" {
  export default Cesium.InterpolationAlgorithm;
}
declare module "terriajs-cesium/Source/Core/Intersect" {
  export default Cesium.Intersect;
}
declare module "terriajs-cesium/Source/Core/IntersectionTests" {
  export default Cesium.IntersectionTests;
}
declare module "terriajs-cesium/Source/Core/Intersections2D" {
  export default Cesium.Intersections2D;
}
declare module "terriajs-cesium/Source/Core/Interval" {
  export default Cesium.Interval;
}
declare module "terriajs-cesium/Source/Core/Iso8601" {
  export default Cesium.Iso8601;
}
declare module "terriajs-cesium/Source/Core/JulianDate" {
  export default Cesium.JulianDate;
}
declare module "terriajs-cesium/Source/Core/KeyboardEventModifier" {
  export default Cesium.KeyboardEventModifier;
}
declare module "terriajs-cesium/Source/Core/LagrangePolynomialApproximation" {
  export default Cesium.LagrangePolynomialApproximation;
}
declare module "terriajs-cesium/Source/Core/LeapSecond" {
  export default Cesium.LeapSecond;
}
declare module "terriajs-cesium/Source/Core/LinearApproximation" {
  export default Cesium.LinearApproximation;
}
declare module "terriajs-cesium/Source/Core/LinearSpline" {
  export default Cesium.LinearSpline;
}
declare module "terriajs-cesium/Source/Core/MapProjection" {
  export default Cesium.MapProjection;
}
declare module "terriajs-cesium/Source/Core/Math" {
  export default Cesium.Math;
}
declare module "terriajs-cesium/Source/Core/Matrix2" {
  export default Cesium.Matrix2;
}
declare module "terriajs-cesium/Source/Core/Matrix3" {
  import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
  export default class Matrix3 extends Cesium.Matrix3 {
    static fromQuaternion(quaternion: Quaternion, result?: Matrix3): Matrix3;
  }
}
declare module "terriajs-cesium/Source/Core/Matrix4" {
  export default Cesium.Matrix4;
}
declare module "terriajs-cesium/Source/Core/NearFarScalar" {
  export default Cesium.NearFarScalar;
}
declare module "terriajs-cesium/Source/Core/Occluder" {
  export default Cesium.Occluder;
}
declare module "terriajs-cesium/Source/Core/OrthographicFrustum" {
  export default Cesium.OrthographicFrustum;
}
declare module "terriajs-cesium/Source/Core/Packable" {
  export default Cesium.Packable;
}
declare module "terriajs-cesium/Source/Core/PackableForInterpolation" {
  export default Cesium.PackableForInterpolation;
}
declare module "terriajs-cesium/Source/Core/PerspectiveFrustum" {
  export default Cesium.PerspectiveFrustum;
}
declare module "terriajs-cesium/Source/Core/PerspectiveOffCenterFrustum" {
  export default Cesium.PerspectiveOffCenterFrustum;
}
declare module "terriajs-cesium/Source/Core/PinBuilder" {
  export default Cesium.PinBuilder;
}
declare module "terriajs-cesium/Source/Core/PixelFormat" {
  export default Cesium.PixelFormat;
}
declare module "terriajs-cesium/Source/Core/Plane" {
  export default Cesium.Plane;
}
declare module "terriajs-cesium/Source/Core/PolygonGeometry" {
  export default Cesium.PolygonGeometry;
}
declare module "terriajs-cesium/Source/Core/PolygonHierarchy" {
  export default Cesium.PolygonHierarchy;
}
declare module "terriajs-cesium/Source/Core/PolygonOutlineGeometry" {
  export default Cesium.PolygonOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/PolylineGeometry" {
  export default Cesium.PolylineGeometry;
}
declare module "terriajs-cesium/Source/Core/PolylineVolumeGeometry" {
  export default Cesium.PolylineVolumeGeometry;
}
declare module "terriajs-cesium/Source/Core/PolylineVolumeOutlineGeometry" {
  export default Cesium.PolylineVolumeOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/PrimitiveType" {
  export default Cesium.PrimitiveType;
}
declare module "terriajs-cesium/Source/Core/QuadraticRealPolynomial" {
  export default Cesium.QuadraticRealPolynomial;
}
declare module "terriajs-cesium/Source/Core/QuantizedMeshTerrainData" {
  export default Cesium.QuantizedMeshTerrainData;
}
declare module "terriajs-cesium/Source/Core/QuarticRealPolynomial" {
  export default Cesium.QuarticRealPolynomial;
}
declare module "terriajs-cesium/Source/Core/Quaternion" {
  export default Cesium.Quaternion;
}
declare module "terriajs-cesium/Source/Core/QuaternionSpline" {
  export default Cesium.QuaternionSpline;
}
declare module "terriajs-cesium/Source/Core/Queue" {
  export default Cesium.Queue;
}
declare module "terriajs-cesium/Source/Core/Ray" {
  export default Cesium.Ray;
}
declare module "terriajs-cesium/Source/Core/Rectangle" {
  export default Cesium.Rectangle;
}
declare module "terriajs-cesium/Source/Core/RectangleGeometry" {
  export default Cesium.RectangleGeometry;
}
declare module "terriajs-cesium/Source/Core/RectangleOutlineGeometry" {
  export default Cesium.RectangleOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/ReferenceFrame" {
  export default Cesium.ReferenceFrame;
}
declare module "terriajs-cesium/Source/Core/RequestErrorEvent" {
  export default Cesium.RequestErrorEvent;
}
declare module "terriajs-cesium/Source/Core/Resource" {
  export default Cesium.Resource;
}
declare module "terriajs-cesium/Source/Core/RuntimeError" {
  export default Cesium.RuntimeError;
}
declare module "terriajs-cesium/Source/Core/ScreenSpaceEventHandler" {
  export default Cesium.ScreenSpaceEventHandler;
}
declare module "terriajs-cesium/Source/Core/ScreenSpaceEventType" {
  export default Cesium.ScreenSpaceEventType;
}
declare module "terriajs-cesium/Source/Core/ShowGeometryInstanceAttribute" {
  export default Cesium.ShowGeometryInstanceAttribute;
}
declare module "terriajs-cesium/Source/Core/Simon1994PlanetaryPositions" {
  export default Cesium.Simon1994PlanetaryPositions;
}
declare module "terriajs-cesium/Source/Core/SimplePolylineGeometry" {
  export default Cesium.SimplePolylineGeometry;
}
declare module "terriajs-cesium/Source/Core/SphereGeometry" {
  export default Cesium.SphereGeometry;
}
declare module "terriajs-cesium/Source/Core/SphereOutlineGeometry" {
  export default Cesium.SphereOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/Spherical" {
  export default Cesium.Spherical;
}
declare module "terriajs-cesium/Source/Core/Spline" {
  export default Cesium.Spline;
}
declare module "terriajs-cesium/Source/Core/TaskProcessor" {
  export default Cesium.TaskProcessor;
}
declare module "terriajs-cesium/Source/Core/TerrainData" {
  export default Cesium.TerrainData;
}
declare module "terriajs-cesium/Source/Core/TerrainMesh" {
  export default Cesium.TerrainMesh;
}
declare module "terriajs-cesium/Source/Core/TerrainProvider" {
  export default Cesium.TerrainProvider;
}
declare module "terriajs-cesium/Source/Core/TileAvailability" {
  export default Cesium.TileAvailability;
}
declare module "terriajs-cesium/Source/Core/TileProviderError" {
  export default Cesium.TileProviderError;
}
declare module "terriajs-cesium/Source/Core/TilingScheme" {
  export default Cesium.TilingScheme;
}
declare module "terriajs-cesium/Source/Core/TimeInterval" {
  export default Cesium.TimeInterval;
}
declare module "terriajs-cesium/Source/Core/TimeIntervalCollection" {
  export default Cesium.TimeIntervalCollection;
}
declare module "terriajs-cesium/Source/Core/TimeStandard" {
  export default Cesium.TimeStandard;
}
declare module "terriajs-cesium/Source/Core/Transforms" {
  export default Cesium.Transforms;
}
declare module "terriajs-cesium/Source/Core/TridiagonalSystemSolver" {
  export default Cesium.TridiagonalSystemSolver;
}
declare module "terriajs-cesium/Source/Core/VRTheWorldTerrainProvider" {
  export default Cesium.VRTheWorldTerrainProvider;
}
declare module "terriajs-cesium/Source/Core/VertexFormat" {
  export default Cesium.VertexFormat;
}
declare module "terriajs-cesium/Source/Core/Visibility" {
  export default Cesium.Visibility;
}
declare module "terriajs-cesium/Source/Core/WallGeometry" {
  export default Cesium.WallGeometry;
}
declare module "terriajs-cesium/Source/Core/WallOutlineGeometry" {
  export default Cesium.WallOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/WebMercatorProjection" {
  export default Cesium.WebMercatorProjection;
}
declare module "terriajs-cesium/Source/Core/WebMercatorTilingScheme" {
  export default Cesium.WebMercatorTilingScheme;
}
declare module "terriajs-cesium/Source/Core/WindingOrder" {
  export default Cesium.WindingOrder;
}

declare module "terriajs-cesium/Source/Core/barycentricCoordinates" {
  export default Cesium.barycentricCoordinates;
}
declare module "terriajs-cesium/Source/Core/binarySearch" {
  export default Cesium.binarySearch;
}
declare module "terriajs-cesium/Source/Core/buildModuleUrl" {
  export default Cesium.buildModuleUrl;
}
declare module "terriajs-cesium/Source/Core/cancelAnimationFrame" {
  export default Cesium.cancelAnimationFrame;
}
declare module "terriajs-cesium/Source/Core/clone" {
  export default Cesium.clone;
}
declare module "terriajs-cesium/Source/Core/combine" {
  export default Cesium.combine;
}
declare module "terriajs-cesium/Source/Core/createWorldTerrain" {
  export default Cesium.createWorldTerrain;
}
declare module "terriajs-cesium/Source/Core/defaultValue" {
  export default function defaultValue(value: any, defaultValue: any): any;
}
declare module "terriajs-cesium/Source/Core/defined" {
  export default Cesium.defined;
}
declare module "terriajs-cesium/Source/Core/destroyObject" {
  export default Cesium.destroyObject;
}
declare module "terriajs-cesium/Source/Core/formatError" {
  export default Cesium.formatError;
}
declare module "terriajs-cesium/Source/Core/getFilenameFromUri" {
  export default Cesium.getFilenameFromUri;
}
declare module "terriajs-cesium/Source/Core/getImagePixels" {
  export default Cesium.getImagePixels;
}
declare module "terriajs-cesium/Source/Core/isArray" {
  export default Cesium.isArray;
}
declare module "terriajs-cesium/Source/Core/isLeapYear" {
  export default Cesium.isLeapYear;
}
declare module "terriajs-cesium/Source/Core/mergeSort" {
  export default Cesium.mergeSort;
}
declare module "terriajs-cesium/Source/Core/objectToQuery" {
  export default Cesium.objectToQuery;
}
declare module "terriajs-cesium/Source/Core/pointInsideTriangle" {
  export default Cesium.pointInsideTriangle;
}
declare module "terriajs-cesium/Source/Core/queryToObject" {
  export default Cesium.queryToObject;
}
declare module "terriajs-cesium/Source/Core/requestAnimationFrame" {
  export default Cesium.requestAnimationFrame;
}
declare module "terriajs-cesium/Source/Core/sampleTerrain" {
  export default Cesium.sampleTerrain;
}
declare module "terriajs-cesium/Source/Core/subdivideArray" {
  export default Cesium.subdivideArray;
}

declare module "terriajs-cesium/Source/Core/Property" {
  abstract class Property<T = any> {
    readonly isConstant: boolean;
    readonly definitionChanged: Cesium.Event;
    getValue(time: Cesium.JulianDate, result?: T): T;
    equals(other?: Property<T>): boolean;
  }
  export default Property;
}

declare module "terriajs-cesium/Source/DataSources/BillboardGraphics" {
  import Property from "terriajs-cesium/Source/Core/Property";
  import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
  import BoundingRectangle from "terriajs-cesium/Source/Core/BoundingRectangle";
  import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
  import HorizontalOrigin from "terriajs-cesium/Source/Scene/HorizontalOrigin";
  import VerticalOrigin from "terriajs-cesium/Source/Scene/VerticalOrigin";
  import Color from "terriajs-cesium/Source/Core/Color";
  import Event from "terriajs-cesium/Source/Core/Event";
  import NearFarScalar from "terriajs-cesium/Source/Core/NearFarScalar";

  class BillboardGraphics {
    definitionChanged: Event;
    image: Property<string>;
    imageSubRegion: Property<BoundingRectangle>;
    scale: Property<number>;
    rotation: Property<number>;
    alignedAxis: Property<Cartesian3>;
    horizontalOrigin: Property<HorizontalOrigin>;
    verticalOrigin: Property<VerticalOrigin>;
    color: Property<Color>;
    eyeOffset: Property<Cartesian3>;
    pixelOffset: Property<Cartesian3>;
    show: Property<boolean>;
    width: Property<number>;
    height: Property<number>;
    scaleByDistance: Property<NearFarScalar>;
    translucencyByDistance: Property<NearFarScalar>;
    pixelOffsetScaleByDistance: Property<NearFarScalar>;
    heightReference: Property<HeightReference>;
    constructor(options?: BillboardGraphicsOptions);
    clone(result?: BillboardGraphics): BillboardGraphics;
    merge(source: BillboardGraphics): BillboardGraphics;
  }
  export interface BillboardGraphicsOptions {
    image?: string;
    imageSubRegion?: BoundingRectangle;
    scale?: number;
    rotation?: number;
    alignedAxis?: Cartesian3;
    horizontalOrigin?: HorizontalOrigin;
    verticalOrigin?: VerticalOrigin;
    color?: Color;
    eyeOffset?: Cartesian3;
    pixelOffset?: Cartesian3;
    show?: boolean;
    width?: number;
    height?: number;
    scaleByDistance?: NearFarScalar;
    translucencyByDistance?: NearFarScalar;
    pixelOffsetScaleByDistance?: NearFarScalar;
    heightReference?: HeightReference;
  }
  export default BillboardGraphics;
}
declare module "terriajs-cesium/Source/DataSources/BillboardVisualizer" {
  export default Cesium.BillboardVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/BoundingSphereState" {
  enum BoundingSphereState {
    DONE,
    PENDING,
    FAILED
  }
  export default BoundingSphereState;
}
declare module "terriajs-cesium/Source/DataSources/BoxGeometryUpdater" {
  export default Cesium.BoxGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/BoxGraphics" {
  export default Cesium.BoxGraphics;
}
declare module "terriajs-cesium/Source/DataSources/CallbackProperty" {
  export default Cesium.CallbackProperty;
}
declare module "terriajs-cesium/Source/DataSources/CheckerboardMaterialProperty" {
  export default Cesium.CheckerboardMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/ColorMaterialProperty" {
  export default Cesium.ColorMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/CompositeEntityCollection" {
  export default Cesium.CompositeEntityCollection;
}
declare module "terriajs-cesium/Source/DataSources/CompositeMaterialProperty" {
  export default Cesium.CompositeMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/CompositePositionProperty" {
  export default Cesium.CompositePositionProperty;
}
declare module "terriajs-cesium/Source/DataSources/CompositeProperty" {
  export default Cesium.CompositeProperty;
}
declare module "terriajs-cesium/Source/DataSources/ConstantPositionProperty" {
  export default Cesium.ConstantPositionProperty;
}
declare module "terriajs-cesium/Source/DataSources/ConstantProperty" {
  export default Cesium.ConstantProperty;
}
declare module "terriajs-cesium/Source/DataSources/CorridorGeometryUpdater" {
  export default Cesium.CorridorGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/CorridorGraphics" {
  export default Cesium.CorridorGraphics;
}
declare module "terriajs-cesium/Source/DataSources/CustomDataSource" {
  import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
  class CustomDataSource extends Cesium.CustomDataSource {
    entities: EntityCollection;
  }
  export default CustomDataSource;
}
declare module "terriajs-cesium/Source/DataSources/CylinderGeometryUpdater" {
  export default Cesium.CylinderGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/CylinderGraphics" {
  export default Cesium.CylinderGraphics;
}
declare module "terriajs-cesium/Source/DataSources/CzmlDataSource" {
  import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
  import Resource from "terriajs-cesium/Source/Core/Resource";
  class CzmlDataSource extends Cesium.CzmlDataSource {
    entities: EntityCollection;
    static load(
      czml: Resource | string | object,
      options?: { sourceUri?: string }
    ): Promise<CzmlDataSource>;
  }
  export default CzmlDataSource;
}
declare module "terriajs-cesium/Source/DataSources/DataSource" {
  import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
  class DataSource extends Cesium.DataSource {
    entities: EntityCollection;
  }
  export default DataSource;
}
declare module "terriajs-cesium/Source/DataSources/DataSourceClock" {
  export default Cesium.DataSourceClock;
}
declare module "terriajs-cesium/Source/DataSources/DataSourceCollection" {
  import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
  class DataSourceCollection extends Cesium.DataSourceCollection {
    get(index: number): DataSource;
  }
  export default DataSourceCollection;
}
declare module "terriajs-cesium/Source/DataSources/DataSourceDisplay" {
  export default Cesium.DataSourceDisplay;
}
declare module "terriajs-cesium/Source/DataSources/DynamicGeometryUpdater" {
  export default Cesium.DynamicGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/EllipseGeometryUpdater" {
  export default Cesium.EllipseGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/EllipseGraphics" {
  export default Cesium.EllipseGraphics;
}
declare module "terriajs-cesium/Source/DataSources/EllipsoidGeometryUpdater" {
  export default Cesium.EllipsoidGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/EllipsoidGraphics" {
  export default Cesium.EllipsoidGraphics;
}
declare module "terriajs-cesium/Source/DataSources/Entity" {
  import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
  class Entity extends Cesium.Entity {
    billboard: BillboardGraphics;
  }
  export default Entity;
}
declare module "terriajs-cesium/Source/DataSources/EntityCluster" {
  export default Cesium.EntityCluster;
}
declare module "terriajs-cesium/Source/DataSources/EntityCollection" {
  import Entity from "terriajs-cesium/Source/DataSources/Entity";
  class EntityCollection extends Cesium.EntityCollection {
    values: Entity[];
    getById(id: string): Entity;
    getOrCreateEntity(id: string): Entity;
  }
  export default EntityCollection;
}
declare module "terriajs-cesium/Source/DataSources/EntityView" {
  export default Cesium.EntityView;
}
declare module "terriajs-cesium/Source/DataSources/GeoJsonDataSource" {
  import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
  class GeoJsonDataSource extends Cesium.GeoJsonDataSource {
    entities: EntityCollection;
  }
  export default GeoJsonDataSource;
}
declare module "terriajs-cesium/Source/DataSources/GeometryUpdater" {
  export default Cesium.GeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/GeometryVisualizer" {
  export default Cesium.GeometryVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/GridMaterialProperty" {
  export default Cesium.GridMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/ImageMaterialProperty" {
  export default Cesium.ImageMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/KmlDataSource" {
  import Camera from "terriajs-cesium/Source/Scene/Camera";
  import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
  import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
  import Resource from "terriajs-cesium/Source/Core/Resource";
  class KmlDataSource extends Cesium.KmlDataSource {
    entities: EntityCollection;
    static load(
      kml: Resource | Document | string | object,
      options?: {
        camera?: Camera;
        canvas?: HTMLCanvasElement;
        sourceUri?: string;
        clampToGround?: boolean;
        ellipsoid?: Ellipsoid;
      }
    ): Promise<KmlDataSource>;
  }
  export default KmlDataSource;
}
declare module "terriajs-cesium/Source/DataSources/LabelGraphics" {
  export default Cesium.LabelGraphics;
}
declare module "terriajs-cesium/Source/DataSources/LabelVisualizer" {
  export default Cesium.LabelVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/MaterialProperty" {
  export default Cesium.MaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/ModelGraphics" {
  export default Cesium.ModelGraphics;
}
declare module "terriajs-cesium/Source/DataSources/ModelVisualizer" {
  export default Cesium.ModelVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/PathGraphics" {
  export default Cesium.PathGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PathVisualizer" {
  export default Cesium.PathVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/PointGraphics" {
  export default Cesium.PointGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PointVisualizer" {
  export default Cesium.PointVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/PolygonGeometryUpdater" {
  export default Cesium.PolygonGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/PolygonGraphics" {
  export default Cesium.PolygonGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PolylineArrowMaterialProperty" {
  export default Cesium.PolylineArrowMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/PolylineGeometryUpdater" {
  export default Cesium.PolylineGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/PolylineGlowMaterialProperty" {
  export default Cesium.PolylineGlowMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/PolylineGraphics" {
  export default Cesium.PolylineGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PolylineOutlineMaterialProperty" {
  export default Cesium.PolylineOutlineMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/PolylineVolumeGeometryUpdater" {
  export default Cesium.PolylineVolumeGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/PolylineVolumeGraphics" {
  export default Cesium.PolylineVolumeGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PositionProperty" {
  export default Cesium.PositionProperty;
}
declare module "terriajs-cesium/Source/DataSources/PositionPropertyArray" {
  export default Cesium.PositionPropertyArray;
}
declare module "terriajs-cesium/Source/DataSources/Property" {
  export default Cesium.Property;
}
declare module "terriajs-cesium/Source/DataSources/PropertyArray" {
  export default Cesium.PropertyArray;
}
declare module "terriajs-cesium/Source/DataSources/RectangleGeometryUpdater" {
  export default Cesium.RectangleGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/RectangleGraphics" {
  export default Cesium.RectangleGraphics;
}
declare module "terriajs-cesium/Source/DataSources/ReferenceProperty" {
  export default Cesium.ReferenceProperty;
}
declare module "terriajs-cesium/Source/DataSources/SampledPositionProperty" {
  export default Cesium.SampledPositionProperty;
}
declare module "terriajs-cesium/Source/DataSources/SampledProperty" {
  export default Cesium.SampledProperty;
}
declare module "terriajs-cesium/Source/DataSources/StripeMaterialProperty" {
  export default Cesium.StripeMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/StripeOrientation" {
  export default Cesium.StripeOrientation;
}
declare module "terriajs-cesium/Source/DataSources/TimeIntervalCollectionPositionProperty" {
  export default Cesium.TimeIntervalCollectionPositionProperty;
}
declare module "terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty" {
  export default Cesium.TimeIntervalCollectionProperty;
}
declare module "terriajs-cesium/Source/DataSources/VelocityOrientationProperty" {
  export default Cesium.VelocityOrientationProperty;
}
declare module "terriajs-cesium/Source/DataSources/Visualizer" {
  export default Cesium.Visualizer;
}
declare module "terriajs-cesium/Source/DataSources/WallGeometryUpdater" {
  export default Cesium.WallGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/WallGraphics" {
  export default Cesium.WallGraphics;
}
declare module "terriajs-cesium/Source/Scene/Appearance" {
  export default Cesium.Appearance;
}
declare module "terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider" {
  class ArcGisMapServerImageryProvider extends Cesium.ArcGisMapServerImageryProvider {
    constructor(options: {
      url: string;
      tileDiscardPolicy?: Cesium.TileDiscardPolicy;
      proxy?: Cesium.Proxy;
      usePreCachedTilesIfAvailable?: boolean;
      enablePickFeatures?: boolean;
      rectangle?: Cesium.Rectangle;
      tilingScheme?: Cesium.TilingScheme;
      ellipsoid?: Cesium.Ellipsoid;
      tileWidth?: number;
      tileHeight?: number;
      maximumLevel?: number;
      layers?: string;
      parameters?: any;
      mapServerData?: any;
      token?: string;
    });
    readonly layers?: string;
    readonly parameters?: any;
    readonly usePreCachedTiles?: boolean;
    readonly enablePickFeatures?: boolean;
    readonly token?: string;
  }
  export default ArcGisMapServerImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/Billboard" {
  export default Cesium.Billboard;
}
declare module "terriajs-cesium/Source/Scene/BillboardCollection" {
  export default Cesium.BillboardCollection;
}
declare module "terriajs-cesium/Source/Scene/BingMapsImageryProvider" {
  export default Cesium.BingMapsImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/BingMapsStyle" {
  enum BingMapsStyle {
    AERIAL,
    AERIAL_WITH_LABELS,
    AERIAL_WITH_LABELS_ON_DEMAND,
    ROAD,
    ROAD_ON_DEMAND,
    CANVAS_DARK,
    CANVAS_LIGHT,
    CANVAS_GRAY,
    ORDNANCE_SURVEY,
    COLLINS_BART
  }
  export default BingMapsStyle;
}
declare module "terriajs-cesium/Source/Scene/BlendEquation" {
  export default Cesium.BlendEquation;
}
declare module "terriajs-cesium/Source/Scene/BlendFunction" {
  export default Cesium.BlendFunction;
}
declare module "terriajs-cesium/Source/Scene/BlendOption" {
  export default Cesium.BlendOption;
}
declare module "terriajs-cesium/Source/Scene/BlendingState" {
  export default Cesium.BlendingState;
}
declare module "terriajs-cesium/Source/Scene/Camera" {
  export default Cesium.Camera;
}
declare module "terriajs-cesium/Source/Scene/CameraEventAggregator" {
  export default Cesium.CameraEventAggregator;
}
declare module "terriajs-cesium/Source/Scene/CameraEventType" {
  export default Cesium.CameraEventType;
}
declare module "terriajs-cesium/Source/Scene/CreditDisplay" {
  export default Cesium.CreditDisplay;
}
declare module "terriajs-cesium/Source/Scene/CullFace" {
  export default Cesium.CullFace;
}
declare module "terriajs-cesium/Source/Scene/DebugAppearance" {
  export default Cesium.DebugAppearance;
}
declare module "terriajs-cesium/Source/Scene/DebugModelMatrixPrimitive" {
  export default Cesium.DebugModelMatrixPrimitive;
}
declare module "terriajs-cesium/Source/Scene/DepthFunction" {
  export default Cesium.DepthFunction;
}
declare module "terriajs-cesium/Source/Scene/DiscardMissingTileImagePolicy" {
  export default Cesium.DiscardMissingTileImagePolicy;
}
declare module "terriajs-cesium/Source/Scene/EllipsoidPrimitive" {
  export default Cesium.EllipsoidPrimitive;
}
declare module "terriajs-cesium/Source/Scene/EllipsoidSurfaceAppearance" {
  export default Cesium.EllipsoidSurfaceAppearance;
}
declare module "terriajs-cesium/Source/Scene/Fog" {
  export default Cesium.Fog;
}
declare module "terriajs-cesium/Source/Scene/FrameRateMonitor" {
  export default Cesium.FrameRateMonitor;
}
declare module "terriajs-cesium/Source/Scene/GetFeatureInfoFormat" {
  export default Cesium.GetFeatureInfoFormat;
}
declare module "terriajs-cesium/Source/Scene/Globe" {
  export default Cesium.Globe;
}
declare module "terriajs-cesium/Source/Scene/GoogleEarthEnterpriseImageryProvider" {
  export default Cesium.GoogleEarthEnterpriseImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/GoogleEarthEnterpriseMapsProvider" {
  export default Cesium.GoogleEarthEnterpriseMapsProvider;
}
declare module "terriajs-cesium/Source/Scene/GridImageryProvider" {
  export default Cesium.GridImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/HeightReference" {
  export default Cesium.HeightReference;
}
declare module "terriajs-cesium/Source/Scene/HorizontalOrigin" {
  export default Cesium.HorizontalOrigin;
}
declare module "terriajs-cesium/Source/Scene/ImageryLayerCollection" {
  export default Cesium.ImageryLayerCollection;
}
declare module "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo" {
  export default Cesium.ImageryLayerFeatureInfo;
}
declare module "terriajs-cesium/Source/Scene/ImageryProvider" {
  export default Cesium.ImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/IonImageryProvider" {
  export default Cesium.IonImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/Label" {
  export default Cesium.Label;
}
declare module "terriajs-cesium/Source/Scene/LabelCollection" {
  export default Cesium.LabelCollection;
}
declare module "terriajs-cesium/Source/Scene/LabelStyle" {
  export default Cesium.LabelStyle;
}
declare module "terriajs-cesium/Source/Scene/MapMode2D" {
  export default Cesium.MapMode2D;
}
declare module "terriajs-cesium/Source/Scene/Material" {
  export default Cesium.Material;
}
declare module "terriajs-cesium/Source/Scene/MaterialAppearance" {
  export default Cesium.MaterialAppearance;
}
declare module "terriajs-cesium/Source/Scene/Model" {
  export default Cesium.Model;
}
declare module "terriajs-cesium/Source/Scene/ModelAnimation" {
  export default Cesium.ModelAnimation;
}
declare module "terriajs-cesium/Source/Scene/ModelAnimationCollection" {
  export default Cesium.ModelAnimationCollection;
}
declare module "terriajs-cesium/Source/Scene/ModelAnimationLoop" {
  export default Cesium.ModelAnimationLoop;
}
declare module "terriajs-cesium/Source/Scene/ModelMaterial" {
  export default Cesium.ModelMaterial;
}
declare module "terriajs-cesium/Source/Scene/ModelMesh" {
  export default Cesium.ModelMesh;
}
declare module "terriajs-cesium/Source/Scene/ModelNode" {
  export default Cesium.ModelNode;
}
declare module "terriajs-cesium/Source/Scene/Moon" {
  export default Cesium.Moon;
}
declare module "terriajs-cesium/Source/Scene/NeverTileDiscardPolicy" {
  export default Cesium.NeverTileDiscardPolicy;
}
declare module "terriajs-cesium/Source/Scene/PerInstanceColorAppearance" {
  export default Cesium.PerInstanceColorAppearance;
}
declare module "terriajs-cesium/Source/Scene/PointPrimitive" {
  export default Cesium.PointPrimitive;
}
declare module "terriajs-cesium/Source/Scene/PointPrimitiveCollection" {
  export default Cesium.PointPrimitiveCollection;
}
declare module "terriajs-cesium/Source/Scene/Polyline" {
  export default Cesium.Polyline;
}
declare module "terriajs-cesium/Source/Scene/PolylineCollection" {
  export default Cesium.PolylineCollection;
}
declare module "terriajs-cesium/Source/Scene/PolylineColorAppearance" {
  export default Cesium.PolylineColorAppearance;
}
declare module "terriajs-cesium/Source/Scene/PolylineMaterialAppearance" {
  export default Cesium.PolylineMaterialAppearance;
}
declare module "terriajs-cesium/Source/Scene/Primitive" {
  export default Cesium.Primitive;
}
declare module "terriajs-cesium/Source/Scene/PrimitiveCollection" {
  export default Cesium.PrimitiveCollection;
}
declare module "terriajs-cesium/Source/Scene/Scene" {
  import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
  class Scene extends Cesium.Scene {
    canvas: HTMLCanvasElement;
    /**
     * NOTE: Private in Cesium, should only be called if there is no other alternative.
     * */
    render(time: JulianDate): void;
  }
  export default Scene;
}
declare module "terriajs-cesium/Source/Scene/SceneMode" {
  export default Cesium.SceneMode;
}
declare module "terriajs-cesium/Source/Scene/SceneTransforms" {
  export default Cesium.SceneTransforms;
}
declare module "terriajs-cesium/Source/Scene/ScreenSpaceCameraController" {
  export default Cesium.ScreenSpaceCameraController;
}
declare module "terriajs-cesium/Source/Scene/ShadowMap" {
  export default Cesium.ShadowMap;
}
declare module "terriajs-cesium/Source/Scene/ShadowMode" {
  export default Cesium.ShadowMode;
}
declare module "terriajs-cesium/Source/Scene/SingleTileImageryProvider" {
  export default Cesium.SingleTileImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/SkyAtmosphere" {
  export default Cesium.SkyAtmosphere;
}
declare module "terriajs-cesium/Source/Scene/SkyBox" {
  export default Cesium.SkyBox;
}
declare module "terriajs-cesium/Source/Scene/StencilFunction" {
  export default Cesium.StencilFunction;
}
declare module "terriajs-cesium/Source/Scene/StencilOperation" {
  export default Cesium.StencilOperation;
}
declare module "terriajs-cesium/Source/Scene/Sun" {
  export default Cesium.Sun;
}
declare module "terriajs-cesium/Source/Scene/TileCoordinatesImageryProvider" {
  export default Cesium.TileCoordinatesImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/TileDiscardPolicy" {
  export default Cesium.TileDiscardPolicy;
}
declare module "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider" {
  export default Cesium.UrlTemplateImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/VerticalOrigin" {
  export default Cesium.VerticalOrigin;
}
declare module "terriajs-cesium/Source/Scene/ViewportQuad" {
  export default Cesium.ViewportQuad;
}
declare module "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider" {
  export default Cesium.WebMapServiceImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/WebMapTileServiceImageryProvider" {
  export default Cesium.WebMapTileServiceImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/createOpenStreetMapImageryProvider" {
  export default Cesium.createOpenStreetMapImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/createTangentSpaceDebugPrimitive" {
  export default Cesium.createTangentSpaceDebugPrimitive;
}
declare module "terriajs-cesium/Source/Scene/createTileMapServiceImageryProvider" {
  export default Cesium.createTileMapServiceImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/createWorldImagery" {
  export default Cesium.createWorldImagery;
}
declare module "terriajs-cesium/Source/Widgets/Animation/Animation" {
  export default Cesium.Animation;
}
declare module "terriajs-cesium/Source/Widgets/Animation/AnimationViewModel" {
  export default Cesium.AnimationViewModel;
}
declare module "terriajs-cesium/Source/Widgets/BaseLayerPicker/BaseLayerPicker" {
  export default Cesium.BaseLayerPicker;
}
declare module "terriajs-cesium/Source/Widgets/BaseLayerPicker/BaseLayerPickerViewModel" {
  export default Cesium.BaseLayerPickerViewModel;
}
declare module "terriajs-cesium/Source/Widgets/BaseLayerPicker/ProviderViewModel" {
  export default Cesium.ProviderViewModel;
}
declare module "terriajs-cesium/Source/Widgets/CesiumInspector/CesiumInspector" {
  export default Cesium.CesiumInspector;
}
declare module "terriajs-cesium/Source/Widgets/CesiumInspector/CesiumInspectorViewModel" {
  export default Cesium.CesiumInspectorViewModel;
}
declare module "terriajs-cesium/Source/Widgets/CesiumWidget/CesiumWidget" {
  import Scene from "terriajs-cesium/Source/Scene/Scene";
  class CesiumWidget extends Cesium.CesiumWidget {
    scene: Scene;
  }
  export default CesiumWidget;
}
declare module "terriajs-cesium/Source/Widgets/ClockViewModel" {
  export default Cesium.ClockViewModel;
}
declare module "terriajs-cesium/Source/Widgets/Command" {
  export default Cesium.Command;
}
declare module "terriajs-cesium/Source/Widgets/FullscreenButton/FullscreenButton" {
  export default Cesium.FullscreenButton;
}
declare module "terriajs-cesium/Source/Widgets/FullscreenButton/FullscreenButtonViewModel" {
  export default Cesium.FullscreenButtonViewModel;
}
declare module "terriajs-cesium/Source/Widgets/Geocoder/Geocoder" {
  export default Cesium.Geocoder;
}
declare module "terriajs-cesium/Source/Widgets/Geocoder/GeocoderViewModel" {
  export default Cesium.GeocoderViewModel;
}
declare module "terriajs-cesium/Source/Widgets/HomeButton/HomeButton" {
  export default Cesium.HomeButton;
}
declare module "terriajs-cesium/Source/Widgets/HomeButton/HomeButtonViewModel" {
  export default Cesium.HomeButtonViewModel;
}
declare module "terriajs-cesium/Source/Widgets/InfoBox/InfoBox" {
  export default Cesium.InfoBox;
}
declare module "terriajs-cesium/Source/Widgets/InfoBox/InfoBoxViewModel" {
  export default Cesium.InfoBoxViewModel;
}
declare module "terriajs-cesium/Source/Widgets/NavigationHelpButton/NavigationHelpButton" {
  export default Cesium.NavigationHelpButton;
}
declare module "terriajs-cesium/Source/Widgets/NavigationHelpButton/NavigationHelpButtonViewModel" {
  export default Cesium.NavigationHelpButtonViewModel;
}
declare module "terriajs-cesium/Source/Widgets/PerformanceWatchdog/PerformanceWatchdog" {
  export default Cesium.PerformanceWatchdog;
}
declare module "terriajs-cesium/Source/Widgets/PerformanceWatchdog/PerformanceWatchdogViewModel" {
  export default Cesium.PerformanceWatchdogViewModel;
}
declare module "terriajs-cesium/Source/Widgets/ProjectionPicker/ProjectionPicker" {
  export default Cesium.ProjectionPicker;
}
declare module "terriajs-cesium/Source/Widgets/ProjectionPicker/ProjectionPickerViewModel" {
  export default Cesium.ProjectionPickerViewModel;
}
declare module "terriajs-cesium/Source/Widgets/SceneModePicker/SceneModePicker" {
  export default Cesium.SceneModePicker;
}
declare module "terriajs-cesium/Source/Widgets/SceneModePicker/SceneModePickerViewModel" {
  export default Cesium.SceneModePickerViewModel;
}
declare module "terriajs-cesium/Source/Widgets/SelectionIndicator/SelectionIndicator" {
  export default Cesium.SelectionIndicator;
}
declare module "terriajs-cesium/Source/Widgets/SelectionIndicator/SelectionIndicatorViewModel" {
  export default Cesium.SelectionIndicatorViewModel;
}
declare module "terriajs-cesium/Source/Widgets/Timeline/Timeline" {
  export default Cesium.Timeline;
}
declare module "terriajs-cesium/Source/Widgets/ToggleButtonViewModel" {
  export default Cesium.ToggleButtonViewModel;
}
declare module "terriajs-cesium/Source/Widgets/VRButton/VRButton" {
  export default Cesium.VRButton;
}
declare module "terriajs-cesium/Source/Widgets/VRButton/VRButtonViewModel" {
  export default Cesium.VRButtonViewModel;
}
declare module "terriajs-cesium/Source/Widgets/Viewer/Viewer" {
  export default Cesium.Viewer;
}
declare module "terriajs-cesium/Source/Widgets/Viewer/viewerCesiumInspectorMixin" {
  export default Cesium.viewerCesiumInspectorMixin;
}
declare module "terriajs-cesium/Source/Widgets/Viewer/viewerDragDropMixin" {
  export default Cesium.viewerDragDropMixin;
}
declare module "terriajs-cesium/Source/Widgets/Viewer/viewerPerformanceWatchdogMixin" {
  export default Cesium.viewerPerformanceWatchdogMixin;
}
declare module "terriajs-cesium/Source/Widgets/createCommand" {
  export default Cesium.createCommand;
}
declare module "terriajs-cesium/Source/Workers/createTaskProcessorWorker" {
  export default Cesium.createTaskProcessorWorker;
}

// Additional declarations to fix type errors
declare module "terriajs-cesium/Source/ThirdParty/when";
declare module "terriajs-cesium/Source/Core/getTimestamp" {
  export default function getTimestamp(): number;
}
declare module "terriajs-cesium/Source/Core/createGuid";

declare module "terriajs-cesium/Source/Scene/ImagerySplitDirection" {
  enum ImagerySplitDirection {
    LEFT,
    NONE,
    RIGHT
  }
  export default ImagerySplitDirection;
}
declare module "terriajs-cesium/Source/Scene/ImageryLayer" {
  import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
  export default class ImageryLayer extends Cesium.ImageryLayer {
    splitDirection: ImagerySplitDirection;
  }
}

declare module "terriajs-cesium/Source/Scene/IonWorldImageryStyle" {
  enum IonWorldImageryStyle {
    AERIAL,
    AERIAL_WITH_LABELS,
    ROAD
  }
  export default IonWorldImageryStyle;
}

declare module "terriajs-cesium/Source/Scene/Axis" {
  enum Axis {
    X,
    Y,
    Z
  }
  namespace Axis {
    function fromName(name: string): Axis;
    const Y_UP_TO_Z_UP: Cesium.Matrix4;
    const X_UP_TO_Z_UP: Cesium.Matrix4;
    const Z_UP_TO_X_UP: Cesium.Matrix4;
    const Z_UP_TO_Y_UP: Cesium.Matrix4;
    const X_UP_TO_Y_UP: Cesium.Matrix4;
  }
  export default Axis;
}

declare module "terriajs-cesium/Source/Core/IonResource" {
  export default class IonResource {
    url: string;
    static fromAssetId(
      assetId: number,
      options: { accessToken?: string; server?: string }
    ): Promise<IonResource>;
  }
}

declare module "terriajs-cesium/Source/Scene/Cesium3DTileset" {
  import IonResource from "terriajs-cesium/Source/Core/IonResource";
  import Cesium3DTileStyle from "terriajs-cesium/Source/Scene/Cesium3DTileStyle";

  export default class Cesium3DTileset {
    url: string;
    show: boolean;
    maximumScreenSpaceError: number;
    style?: Cesium3DTileStyle;
    shadows?: Cesium.ShadowMode;

    constructor(options: {
      url: string | IonResource | Cesium.Resource;
      show?: boolean;
      shadows?: Cesium.ShadowMode;
    });

    destroy(): void;
  }
}

declare module "terriajs-cesium/Source/Scene/Cesium3DTileStyle" {
  export default class Cesium3DTileStyle {
    constructor(style: {
      show?: string | { conditions: string[] };
      color?: string | { conditions: string[] };
      meta?: { [key: string]: string };
    });
  }
}

declare module "terriajs-cesium/Source/Scene/Cesium3DTileFeature" {
  export default class Cesium3DTileFeature {
    color: Cesium.Color;
    getPropertyNames(): string[];
    getProperty(name: string): unknown;
  }
}

declare module "terriajs-cesium/Source/DataSources/PropertyBag" {
  import Property from "terriajs-cesium/Source/Core/Property";
  import JulianDate from "terriajs-cesium/Source/Core/JulianDate";

  export default class PropertyBag {
    constructor(value?: string, createPropertyCallback?: () => any);
    addProperty<T = any>(
      propertyName: string,
      value?: T,
      createPropertyCallback?: () => any
    ): void;
    equals(other: Property): boolean;
    getValue<T = any>(time: JulianDate, result?: T): T;
    hasProperty(propertyName: string): boolean;
    removeProperty(propertyName: string): void;
  }
}
declare module "terriajs-cesium/Source/Core/Ion" {
  import Resource from "terriajs-cesium/Source/Core/Resource";
  import Credit from "terriajs-cesium/Source/Core/Credit";

  namespace Ion {
    let defaultAccessToken: string;
    let defaultServer: string | Resource;
    function getDefaultTokenCredit(providedKey: string): Credit | undefined;
  }

  export default Ion;
}
