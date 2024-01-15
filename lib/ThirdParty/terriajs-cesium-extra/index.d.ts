declare module "terriajs-cesium/Source/Scene/TweenCollection" {
  export default class TweenCollection {
    get length(): number;
    add(options: any): any;
  }
}

declare module "terriajs-cesium/Source/DataSources/BoundingSphereState" {
  /**
   * The state of a BoundingSphere computation being performed by a {@link Visualizer}.
   * @enum {Number}
   * @private
   */
  enum BoundingSphereState {
    /**
     * The BoundingSphere has been computed.
     * @type BoundingSphereState
     * @constant
     */
    DONE = 0,
    /**
     * The BoundingSphere is still being computed.
     * @type BoundingSphereState
     * @constant
     */
    PENDING = 1,
    /**
     * The BoundingSphere does not exist.
     * @type BoundingSphereState
     * @constant
     */
    FAILED = 2
  }
  export default BoundingSphereState;
}

declare module "terriajs-cesium/Source/Widgets/getElement" {
  export default function getElement(
    element: string | HTMLElement
  ): HTMLElement | undefined;
}

declare module "terriajs-cesium/Source/Core/PolygonGeometryLibrary";

declare module "terriajs-cesium/Source/DataSources/getElement";

declare interface Axis {
  X: number;
  Y: number;
  Z: number;
  fromName(name: string): number;
}

declare interface FeatureDetection {
  isEdge(): boolean;
  isInternetExplorer(): boolean;
  internetExplorerVersion(): number[];
  chromeVersion(): number[];
}

// This is a workaround for Cesium's incorrect type declaration for raiseEvent.
declare module "terriajs-cesium" {
  export interface Event {
    raiseEvent(...arguments: any[]): void;
  }
}

// Begin Generated Declarations
declare module "terriajs-cesium/Source/Core/ArcGISTiledElevationTerrainProvider" {
  import { ArcGISTiledElevationTerrainProvider } from "terriajs-cesium";
  export default ArcGISTiledElevationTerrainProvider;
}
declare module "terriajs-cesium/Source/Core/ArcType" {
  import { ArcType } from "terriajs-cesium";
  export default ArcType;
}
declare module "terriajs-cesium/Source/Core/AssociativeArray" {
  import { AssociativeArray } from "terriajs-cesium";
  export default AssociativeArray;
}
declare module "terriajs-cesium/Source/Core/AxisAlignedBoundingBox" {
  import { AxisAlignedBoundingBox } from "terriajs-cesium";
  export default AxisAlignedBoundingBox;
}
declare module "terriajs-cesium/Source/Core/barycentricCoordinates" {
  import { barycentricCoordinates } from "terriajs-cesium";
  export default barycentricCoordinates;
}
declare module "terriajs-cesium/Source/Core/binarySearch" {
  import { binarySearch } from "terriajs-cesium";
  export default binarySearch;
}
declare module "terriajs-cesium/Source/Core/BingMapsGeocoderService" {
  import { BingMapsGeocoderService } from "terriajs-cesium";
  export default BingMapsGeocoderService;
}
declare module "terriajs-cesium/Source/Core/BoundingRectangle" {
  import { BoundingRectangle } from "terriajs-cesium";
  export default BoundingRectangle;
}
declare module "terriajs-cesium/Source/Core/BoundingSphere" {
  import { BoundingSphere } from "terriajs-cesium";
  export default BoundingSphere;
}
declare module "terriajs-cesium/Source/Core/BoxGeometry" {
  import { BoxGeometry } from "terriajs-cesium";
  export default BoxGeometry;
}
declare module "terriajs-cesium/Source/Core/BoxOutlineGeometry" {
  import { BoxOutlineGeometry } from "terriajs-cesium";
  export default BoxOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/buildModuleUrl" {
  import { buildModuleUrl } from "terriajs-cesium";
  export default buildModuleUrl;
}
declare module "terriajs-cesium/Source/Core/Cartesian2" {
  import { Cartesian2 } from "terriajs-cesium";
  export default Cartesian2;
}
declare module "terriajs-cesium/Source/Core/Cartesian3" {
  import { Cartesian3 } from "terriajs-cesium";
  export default Cartesian3;
}
declare module "terriajs-cesium/Source/Core/Cartesian4" {
  import { Cartesian4 } from "terriajs-cesium";
  export default Cartesian4;
}
declare module "terriajs-cesium/Source/Core/Cartographic" {
  import { Cartographic } from "terriajs-cesium";
  export default Cartographic;
}
declare module "terriajs-cesium/Source/Core/CartographicGeocoderService" {
  import { CartographicGeocoderService } from "terriajs-cesium";
  export default CartographicGeocoderService;
}
declare module "terriajs-cesium/Source/Core/CatmullRomSpline" {
  import { CatmullRomSpline } from "terriajs-cesium";
  export default CatmullRomSpline;
}
declare module "terriajs-cesium/Source/Core/CesiumTerrainProvider" {
  import { CesiumTerrainProvider } from "terriajs-cesium";
  export default CesiumTerrainProvider;
}
declare module "terriajs-cesium/Source/Core/CircleGeometry" {
  import { CircleGeometry } from "terriajs-cesium";
  export default CircleGeometry;
}
declare module "terriajs-cesium/Source/Core/CircleOutlineGeometry" {
  import { CircleOutlineGeometry } from "terriajs-cesium";
  export default CircleOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/Clock" {
  import { Clock } from "terriajs-cesium";
  export default Clock;
}
declare module "terriajs-cesium/Source/Core/ClockRange" {
  import { ClockRange } from "terriajs-cesium";
  export default ClockRange;
}
declare module "terriajs-cesium/Source/Core/ClockStep" {
  import { ClockStep } from "terriajs-cesium";
  export default ClockStep;
}
declare module "terriajs-cesium/Source/Core/clone" {
  import { clone } from "terriajs-cesium";
  export default clone;
}
declare module "terriajs-cesium/Source/Core/Color" {
  import { Color } from "terriajs-cesium";
  export default Color;
}
declare module "terriajs-cesium/Source/Core/ColorGeometryInstanceAttribute" {
  import { ColorGeometryInstanceAttribute } from "terriajs-cesium";
  export default ColorGeometryInstanceAttribute;
}
declare module "terriajs-cesium/Source/Core/combine" {
  import { combine } from "terriajs-cesium";
  export default combine;
}
declare module "terriajs-cesium/Source/Core/ComponentDatatype" {
  import { ComponentDatatype } from "terriajs-cesium";
  export default ComponentDatatype;
}
declare module "terriajs-cesium/Source/Core/CompressedTextureBuffer" {
  import { CompressedTextureBuffer } from "terriajs-cesium";
  export default CompressedTextureBuffer;
}
declare module "terriajs-cesium/Source/Core/ConstantSpline" {
  import { ConstantSpline } from "terriajs-cesium";
  export default ConstantSpline;
}
declare module "terriajs-cesium/Source/Core/CoplanarPolygonGeometry" {
  import { CoplanarPolygonGeometry } from "terriajs-cesium";
  export default CoplanarPolygonGeometry;
}
declare module "terriajs-cesium/Source/Core/CoplanarPolygonOutlineGeometry" {
  import { CoplanarPolygonOutlineGeometry } from "terriajs-cesium";
  export default CoplanarPolygonOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/CornerType" {
  import { CornerType } from "terriajs-cesium";
  export default CornerType;
}
declare module "terriajs-cesium/Source/Core/CorridorGeometry" {
  import { CorridorGeometry } from "terriajs-cesium";
  export default CorridorGeometry;
}
declare module "terriajs-cesium/Source/Core/CorridorOutlineGeometry" {
  import { CorridorOutlineGeometry } from "terriajs-cesium";
  export default CorridorOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/createGuid" {
  import { createGuid } from "terriajs-cesium";
  export default createGuid;
}
declare module "terriajs-cesium/Source/Core/createWorldTerrainAsync" {
  import { createWorldTerrainAsync } from "terriajs-cesium";
  export default createWorldTerrainAsync;
}
declare module "terriajs-cesium/Source/Core/Credit" {
  import { Credit } from "terriajs-cesium";
  export default Credit;
}
declare module "terriajs-cesium/Source/Core/CubicRealPolynomial" {
  import { CubicRealPolynomial } from "terriajs-cesium";
  export default CubicRealPolynomial;
}
declare module "terriajs-cesium/Source/Core/CullingVolume" {
  import { CullingVolume } from "terriajs-cesium";
  export default CullingVolume;
}
declare module "terriajs-cesium/Source/Core/CustomHeightmapTerrainProvider" {
  import { CustomHeightmapTerrainProvider } from "terriajs-cesium";
  export default CustomHeightmapTerrainProvider;
}
declare module "terriajs-cesium/Source/Core/CylinderGeometry" {
  import { CylinderGeometry } from "terriajs-cesium";
  export default CylinderGeometry;
}
declare module "terriajs-cesium/Source/Core/CylinderOutlineGeometry" {
  import { CylinderOutlineGeometry } from "terriajs-cesium";
  export default CylinderOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/DefaultProxy" {
  import { DefaultProxy } from "terriajs-cesium";
  export default DefaultProxy;
}
declare module "terriajs-cesium/Source/Core/defaultValue" {
  import { defaultValue } from "terriajs-cesium";
  export default defaultValue;
}
declare module "terriajs-cesium/Source/Core/defined" {
  import { defined } from "terriajs-cesium";
  export default defined;
}
declare module "terriajs-cesium/Source/Core/destroyObject" {
  import { destroyObject } from "terriajs-cesium";
  export default destroyObject;
}
declare module "terriajs-cesium/Source/Core/DeveloperError" {
  import { DeveloperError } from "terriajs-cesium";
  export default DeveloperError;
}
declare module "terriajs-cesium/Source/Core/DistanceDisplayCondition" {
  import { DistanceDisplayCondition } from "terriajs-cesium";
  export default DistanceDisplayCondition;
}
declare module "terriajs-cesium/Source/Core/DistanceDisplayConditionGeometryInstanceAttribute" {
  import { DistanceDisplayConditionGeometryInstanceAttribute } from "terriajs-cesium";
  export default DistanceDisplayConditionGeometryInstanceAttribute;
}
declare module "terriajs-cesium/Source/Core/EasingFunction" {
  import { EasingFunction } from "terriajs-cesium";
  export default EasingFunction;
}
declare module "terriajs-cesium/Source/Core/EllipseGeometry" {
  import { EllipseGeometry } from "terriajs-cesium";
  export default EllipseGeometry;
}
declare module "terriajs-cesium/Source/Core/EllipseOutlineGeometry" {
  import { EllipseOutlineGeometry } from "terriajs-cesium";
  export default EllipseOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/Ellipsoid" {
  import { Ellipsoid } from "terriajs-cesium";
  export default Ellipsoid;
}
declare module "terriajs-cesium/Source/Core/EllipsoidGeodesic" {
  import { EllipsoidGeodesic } from "terriajs-cesium";
  export default EllipsoidGeodesic;
}
declare module "terriajs-cesium/Source/Core/EllipsoidGeometry" {
  import { EllipsoidGeometry } from "terriajs-cesium";
  export default EllipsoidGeometry;
}
declare module "terriajs-cesium/Source/Core/EllipsoidOutlineGeometry" {
  import { EllipsoidOutlineGeometry } from "terriajs-cesium";
  export default EllipsoidOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/EllipsoidRhumbLine" {
  import { EllipsoidRhumbLine } from "terriajs-cesium";
  export default EllipsoidRhumbLine;
}
declare module "terriajs-cesium/Source/Core/EllipsoidTangentPlane" {
  import { EllipsoidTangentPlane } from "terriajs-cesium";
  export default EllipsoidTangentPlane;
}
declare module "terriajs-cesium/Source/Core/EllipsoidTerrainProvider" {
  import { EllipsoidTerrainProvider } from "terriajs-cesium";
  export default EllipsoidTerrainProvider;
}
declare module "terriajs-cesium/Source/Core/Event" {
  import { Event } from "terriajs-cesium";
  export default Event;
}
declare module "terriajs-cesium/Source/Core/EventHelper" {
  import { EventHelper } from "terriajs-cesium";
  export default EventHelper;
}
declare module "terriajs-cesium/Source/Core/ExtrapolationType" {
  import { ExtrapolationType } from "terriajs-cesium";
  export default ExtrapolationType;
}
declare module "terriajs-cesium/Source/Core/FeatureDetection" {
  import { FeatureDetection } from "terriajs-cesium";
  export default FeatureDetection;
}
declare module "terriajs-cesium/Source/Core/formatError" {
  import { formatError } from "terriajs-cesium";
  export default formatError;
}
declare module "terriajs-cesium/Source/Core/FrustumGeometry" {
  import { FrustumGeometry } from "terriajs-cesium";
  export default FrustumGeometry;
}
declare module "terriajs-cesium/Source/Core/FrustumOutlineGeometry" {
  import { FrustumOutlineGeometry } from "terriajs-cesium";
  export default FrustumOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/Fullscreen" {
  import { Fullscreen } from "terriajs-cesium";
  export default Fullscreen;
}
declare module "terriajs-cesium/Source/Core/GeocoderService" {
  import { GeocoderService } from "terriajs-cesium";
  export default GeocoderService;
}
declare module "terriajs-cesium/Source/Core/GeocodeType" {
  import { GeocodeType } from "terriajs-cesium";
  export default GeocodeType;
}
declare module "terriajs-cesium/Source/Core/GeographicProjection" {
  import { GeographicProjection } from "terriajs-cesium";
  export default GeographicProjection;
}
declare module "terriajs-cesium/Source/Core/GeographicTilingScheme" {
  import { GeographicTilingScheme } from "terriajs-cesium";
  export default GeographicTilingScheme;
}
declare module "terriajs-cesium/Source/Core/Geometry" {
  import { Geometry } from "terriajs-cesium";
  export default Geometry;
}
declare module "terriajs-cesium/Source/Core/GeometryAttribute" {
  import { GeometryAttribute } from "terriajs-cesium";
  export default GeometryAttribute;
}
declare module "terriajs-cesium/Source/Core/GeometryAttributes" {
  import { GeometryAttributes } from "terriajs-cesium";
  export default GeometryAttributes;
}
declare module "terriajs-cesium/Source/Core/GeometryFactory" {
  import { GeometryFactory } from "terriajs-cesium";
  export default GeometryFactory;
}
declare module "terriajs-cesium/Source/Core/GeometryInstance" {
  import { GeometryInstance } from "terriajs-cesium";
  export default GeometryInstance;
}
declare module "terriajs-cesium/Source/Core/GeometryInstanceAttribute" {
  import { GeometryInstanceAttribute } from "terriajs-cesium";
  export default GeometryInstanceAttribute;
}
declare module "terriajs-cesium/Source/Core/GeometryPipeline" {
  import { GeometryPipeline } from "terriajs-cesium";
  export default GeometryPipeline;
}
declare module "terriajs-cesium/Source/Core/getAbsoluteUri" {
  import { getAbsoluteUri } from "terriajs-cesium";
  export default getAbsoluteUri;
}
declare module "terriajs-cesium/Source/Core/getBaseUri" {
  import { getBaseUri } from "terriajs-cesium";
  export default getBaseUri;
}
declare module "terriajs-cesium/Source/Core/getExtensionFromUri" {
  import { getExtensionFromUri } from "terriajs-cesium";
  export default getExtensionFromUri;
}
declare module "terriajs-cesium/Source/Core/getFilenameFromUri" {
  import { getFilenameFromUri } from "terriajs-cesium";
  export default getFilenameFromUri;
}
declare module "terriajs-cesium/Source/Core/getImagePixels" {
  import { getImagePixels } from "terriajs-cesium";
  export default getImagePixels;
}
declare module "terriajs-cesium/Source/Core/getTimestamp" {
  import { getTimestamp } from "terriajs-cesium";
  export default getTimestamp;
}
declare module "terriajs-cesium/Source/Core/GoogleEarthEnterpriseMetadata" {
  import { GoogleEarthEnterpriseMetadata } from "terriajs-cesium";
  export default GoogleEarthEnterpriseMetadata;
}
declare module "terriajs-cesium/Source/Core/GoogleEarthEnterpriseTerrainData" {
  import { GoogleEarthEnterpriseTerrainData } from "terriajs-cesium";
  export default GoogleEarthEnterpriseTerrainData;
}
declare module "terriajs-cesium/Source/Core/GoogleEarthEnterpriseTerrainProvider" {
  import { GoogleEarthEnterpriseTerrainProvider } from "terriajs-cesium";
  export default GoogleEarthEnterpriseTerrainProvider;
}
declare module "terriajs-cesium/Source/Core/GoogleMaps" {
  import { GoogleMaps } from "terriajs-cesium";
  export default GoogleMaps;
}
declare module "terriajs-cesium/Source/Core/GregorianDate" {
  import { GregorianDate } from "terriajs-cesium";
  export default GregorianDate;
}
declare module "terriajs-cesium/Source/Core/GroundPolylineGeometry" {
  import { GroundPolylineGeometry } from "terriajs-cesium";
  export default GroundPolylineGeometry;
}
declare module "terriajs-cesium/Source/Core/HeadingPitchRange" {
  import { HeadingPitchRange } from "terriajs-cesium";
  export default HeadingPitchRange;
}
declare module "terriajs-cesium/Source/Core/HeadingPitchRoll" {
  import { HeadingPitchRoll } from "terriajs-cesium";
  export default HeadingPitchRoll;
}
declare module "terriajs-cesium/Source/Core/HeightmapEncoding" {
  import { HeightmapEncoding } from "terriajs-cesium";
  export default HeightmapEncoding;
}
declare module "terriajs-cesium/Source/Core/HeightmapTerrainData" {
  import { HeightmapTerrainData } from "terriajs-cesium";
  export default HeightmapTerrainData;
}
declare module "terriajs-cesium/Source/Core/HermitePolynomialApproximation" {
  import { HermitePolynomialApproximation } from "terriajs-cesium";
  export default HermitePolynomialApproximation;
}
declare module "terriajs-cesium/Source/Core/HermiteSpline" {
  import { HermiteSpline } from "terriajs-cesium";
  export default HermiteSpline;
}
declare module "terriajs-cesium/Source/Core/HilbertOrder" {
  import { HilbertOrder } from "terriajs-cesium";
  export default HilbertOrder;
}
declare module "terriajs-cesium/Source/Core/IndexDatatype" {
  import { IndexDatatype } from "terriajs-cesium";
  export default IndexDatatype;
}
declare module "terriajs-cesium/Source/Core/InterpolationAlgorithm" {
  import { InterpolationAlgorithm } from "terriajs-cesium";
  export default InterpolationAlgorithm;
}
declare module "terriajs-cesium/Source/Core/Intersect" {
  import { Intersect } from "terriajs-cesium";
  export default Intersect;
}
declare module "terriajs-cesium/Source/Core/Intersections2D" {
  import { Intersections2D } from "terriajs-cesium";
  export default Intersections2D;
}
declare module "terriajs-cesium/Source/Core/IntersectionTests" {
  import { IntersectionTests } from "terriajs-cesium";
  export default IntersectionTests;
}
declare module "terriajs-cesium/Source/Core/Interval" {
  import { Interval } from "terriajs-cesium";
  export default Interval;
}
declare module "terriajs-cesium/Source/Core/Ion" {
  import { Ion } from "terriajs-cesium";
  export default Ion;
}
declare module "terriajs-cesium/Source/Core/IonGeocoderService" {
  import { IonGeocoderService } from "terriajs-cesium";
  export default IonGeocoderService;
}
declare module "terriajs-cesium/Source/Core/IonResource" {
  import { IonResource } from "terriajs-cesium";
  export default IonResource;
}
declare module "terriajs-cesium/Source/Core/isLeapYear" {
  import { isLeapYear } from "terriajs-cesium";
  export default isLeapYear;
}
declare module "terriajs-cesium/Source/Core/Iso8601" {
  import { Iso8601 } from "terriajs-cesium";
  export default Iso8601;
}
declare module "terriajs-cesium/Source/Core/JulianDate" {
  import { JulianDate } from "terriajs-cesium";
  export default JulianDate;
}
declare module "terriajs-cesium/Source/Core/KeyboardEventModifier" {
  import { KeyboardEventModifier } from "terriajs-cesium";
  export default KeyboardEventModifier;
}
declare module "terriajs-cesium/Source/Core/LagrangePolynomialApproximation" {
  import { LagrangePolynomialApproximation } from "terriajs-cesium";
  export default LagrangePolynomialApproximation;
}
declare module "terriajs-cesium/Source/Core/LeapSecond" {
  import { LeapSecond } from "terriajs-cesium";
  export default LeapSecond;
}
declare module "terriajs-cesium/Source/Core/LinearApproximation" {
  import { LinearApproximation } from "terriajs-cesium";
  export default LinearApproximation;
}
declare module "terriajs-cesium/Source/Core/LinearSpline" {
  import { LinearSpline } from "terriajs-cesium";
  export default LinearSpline;
}
declare module "terriajs-cesium/Source/Core/MapProjection" {
  import { MapProjection } from "terriajs-cesium";
  export default MapProjection;
}
declare module "terriajs-cesium/Source/Core/Math" {
  import { Math } from "terriajs-cesium";
  export default Math;
}
declare module "terriajs-cesium/Source/Core/Matrix2" {
  import { Matrix2 } from "terriajs-cesium";
  export default Matrix2;
}
declare module "terriajs-cesium/Source/Core/Matrix3" {
  import { Matrix3 } from "terriajs-cesium";
  export default Matrix3;
}
declare module "terriajs-cesium/Source/Core/Matrix4" {
  import { Matrix4 } from "terriajs-cesium";
  export default Matrix4;
}
declare module "terriajs-cesium/Source/Core/mergeSort" {
  import { mergeSort } from "terriajs-cesium";
  export default mergeSort;
}
declare module "terriajs-cesium/Source/Core/MorphWeightSpline" {
  import { MorphWeightSpline } from "terriajs-cesium";
  export default MorphWeightSpline;
}
declare module "terriajs-cesium/Source/Core/NearFarScalar" {
  import { NearFarScalar } from "terriajs-cesium";
  export default NearFarScalar;
}
declare module "terriajs-cesium/Source/Core/objectToQuery" {
  import { objectToQuery } from "terriajs-cesium";
  export default objectToQuery;
}
declare module "terriajs-cesium/Source/Core/Occluder" {
  import { Occluder } from "terriajs-cesium";
  export default Occluder;
}
declare module "terriajs-cesium/Source/Core/OpenCageGeocoderService" {
  import { OpenCageGeocoderService } from "terriajs-cesium";
  export default OpenCageGeocoderService;
}
declare module "terriajs-cesium/Source/Core/OrientedBoundingBox" {
  import { OrientedBoundingBox } from "terriajs-cesium";
  export default OrientedBoundingBox;
}
declare module "terriajs-cesium/Source/Core/OrthographicFrustum" {
  import { OrthographicFrustum } from "terriajs-cesium";
  export default OrthographicFrustum;
}
declare module "terriajs-cesium/Source/Core/OrthographicOffCenterFrustum" {
  import { OrthographicOffCenterFrustum } from "terriajs-cesium";
  export default OrthographicOffCenterFrustum;
}
declare module "terriajs-cesium/Source/Core/Packable" {
  import { Packable } from "terriajs-cesium";
  export default Packable;
}
declare module "terriajs-cesium/Source/Core/PackableForInterpolation" {
  import { PackableForInterpolation } from "terriajs-cesium";
  export default PackableForInterpolation;
}
declare module "terriajs-cesium/Source/Core/PeliasGeocoderService" {
  import { PeliasGeocoderService } from "terriajs-cesium";
  export default PeliasGeocoderService;
}
declare module "terriajs-cesium/Source/Core/PerspectiveFrustum" {
  import { PerspectiveFrustum } from "terriajs-cesium";
  export default PerspectiveFrustum;
}
declare module "terriajs-cesium/Source/Core/PerspectiveOffCenterFrustum" {
  import { PerspectiveOffCenterFrustum } from "terriajs-cesium";
  export default PerspectiveOffCenterFrustum;
}
declare module "terriajs-cesium/Source/Core/PinBuilder" {
  import { PinBuilder } from "terriajs-cesium";
  export default PinBuilder;
}
declare module "terriajs-cesium/Source/Core/PixelFormat" {
  import { PixelFormat } from "terriajs-cesium";
  export default PixelFormat;
}
declare module "terriajs-cesium/Source/Core/Plane" {
  import { Plane } from "terriajs-cesium";
  export default Plane;
}
declare module "terriajs-cesium/Source/Core/PlaneGeometry" {
  import { PlaneGeometry } from "terriajs-cesium";
  export default PlaneGeometry;
}
declare module "terriajs-cesium/Source/Core/PlaneOutlineGeometry" {
  import { PlaneOutlineGeometry } from "terriajs-cesium";
  export default PlaneOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/pointInsideTriangle" {
  import { pointInsideTriangle } from "terriajs-cesium";
  export default pointInsideTriangle;
}
declare module "terriajs-cesium/Source/Core/PolygonGeometry" {
  import { PolygonGeometry } from "terriajs-cesium";
  export default PolygonGeometry;
}
declare module "terriajs-cesium/Source/Core/PolygonHierarchy" {
  import { PolygonHierarchy } from "terriajs-cesium";
  export default PolygonHierarchy;
}
declare module "terriajs-cesium/Source/Core/PolygonOutlineGeometry" {
  import { PolygonOutlineGeometry } from "terriajs-cesium";
  export default PolygonOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/PolylineGeometry" {
  import { PolylineGeometry } from "terriajs-cesium";
  export default PolylineGeometry;
}
declare module "terriajs-cesium/Source/Core/PolylineVolumeGeometry" {
  import { PolylineVolumeGeometry } from "terriajs-cesium";
  export default PolylineVolumeGeometry;
}
declare module "terriajs-cesium/Source/Core/PolylineVolumeOutlineGeometry" {
  import { PolylineVolumeOutlineGeometry } from "terriajs-cesium";
  export default PolylineVolumeOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/PrimitiveType" {
  import { PrimitiveType } from "terriajs-cesium";
  export default PrimitiveType;
}
declare module "terriajs-cesium/Source/Core/Proxy" {
  import { Proxy } from "terriajs-cesium";
  export default Proxy;
}
declare module "terriajs-cesium/Source/Core/QuadraticRealPolynomial" {
  import { QuadraticRealPolynomial } from "terriajs-cesium";
  export default QuadraticRealPolynomial;
}
declare module "terriajs-cesium/Source/Core/QuantizedMeshTerrainData" {
  import { QuantizedMeshTerrainData } from "terriajs-cesium";
  export default QuantizedMeshTerrainData;
}
declare module "terriajs-cesium/Source/Core/QuarticRealPolynomial" {
  import { QuarticRealPolynomial } from "terriajs-cesium";
  export default QuarticRealPolynomial;
}
declare module "terriajs-cesium/Source/Core/Quaternion" {
  import { Quaternion } from "terriajs-cesium";
  export default Quaternion;
}
declare module "terriajs-cesium/Source/Core/QuaternionSpline" {
  import { QuaternionSpline } from "terriajs-cesium";
  export default QuaternionSpline;
}
declare module "terriajs-cesium/Source/Core/queryToObject" {
  import { queryToObject } from "terriajs-cesium";
  export default queryToObject;
}
declare module "terriajs-cesium/Source/Core/Queue" {
  import { Queue } from "terriajs-cesium";
  export default Queue;
}
declare module "terriajs-cesium/Source/Core/Ray" {
  import { Ray } from "terriajs-cesium";
  export default Ray;
}
declare module "terriajs-cesium/Source/Core/Rectangle" {
  import { Rectangle } from "terriajs-cesium";
  export default Rectangle;
}
declare module "terriajs-cesium/Source/Core/RectangleGeometry" {
  import { RectangleGeometry } from "terriajs-cesium";
  export default RectangleGeometry;
}
declare module "terriajs-cesium/Source/Core/RectangleOutlineGeometry" {
  import { RectangleOutlineGeometry } from "terriajs-cesium";
  export default RectangleOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/ReferenceFrame" {
  import { ReferenceFrame } from "terriajs-cesium";
  export default ReferenceFrame;
}
declare module "terriajs-cesium/Source/Core/Request" {
  import { Request } from "terriajs-cesium";
  export default Request;
}
declare module "terriajs-cesium/Source/Core/RequestErrorEvent" {
  import { RequestErrorEvent } from "terriajs-cesium";
  export default RequestErrorEvent;
}
declare module "terriajs-cesium/Source/Core/RequestScheduler" {
  import { RequestScheduler } from "terriajs-cesium";
  export default RequestScheduler;
}
declare module "terriajs-cesium/Source/Core/RequestState" {
  import { RequestState } from "terriajs-cesium";
  export default RequestState;
}
declare module "terriajs-cesium/Source/Core/RequestType" {
  import { RequestType } from "terriajs-cesium";
  export default RequestType;
}
declare module "terriajs-cesium/Source/Core/Resource" {
  import { Resource } from "terriajs-cesium";
  export default Resource;
}
declare module "terriajs-cesium/Source/Core/RuntimeError" {
  import { RuntimeError } from "terriajs-cesium";
  export default RuntimeError;
}
declare module "terriajs-cesium/Source/Core/sampleTerrain" {
  import { sampleTerrain } from "terriajs-cesium";
  export default sampleTerrain;
}
declare module "terriajs-cesium/Source/Core/sampleTerrainMostDetailed" {
  import { sampleTerrainMostDetailed } from "terriajs-cesium";
  export default sampleTerrainMostDetailed;
}
declare module "terriajs-cesium/Source/Core/ScreenSpaceEventHandler" {
  import { ScreenSpaceEventHandler } from "terriajs-cesium";
  export default ScreenSpaceEventHandler;
}
declare module "terriajs-cesium/Source/Core/ScreenSpaceEventType" {
  import { ScreenSpaceEventType } from "terriajs-cesium";
  export default ScreenSpaceEventType;
}
declare module "terriajs-cesium/Source/Core/ShowGeometryInstanceAttribute" {
  import { ShowGeometryInstanceAttribute } from "terriajs-cesium";
  export default ShowGeometryInstanceAttribute;
}
declare module "terriajs-cesium/Source/Core/Simon1994PlanetaryPositions" {
  import { Simon1994PlanetaryPositions } from "terriajs-cesium";
  export default Simon1994PlanetaryPositions;
}
declare module "terriajs-cesium/Source/Core/SimplePolylineGeometry" {
  import { SimplePolylineGeometry } from "terriajs-cesium";
  export default SimplePolylineGeometry;
}
declare module "terriajs-cesium/Source/Core/SphereGeometry" {
  import { SphereGeometry } from "terriajs-cesium";
  export default SphereGeometry;
}
declare module "terriajs-cesium/Source/Core/SphereOutlineGeometry" {
  import { SphereOutlineGeometry } from "terriajs-cesium";
  export default SphereOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/Spherical" {
  import { Spherical } from "terriajs-cesium";
  export default Spherical;
}
declare module "terriajs-cesium/Source/Core/Spline" {
  import { Spline } from "terriajs-cesium";
  export default Spline;
}
declare module "terriajs-cesium/Source/Core/SteppedSpline" {
  import { SteppedSpline } from "terriajs-cesium";
  export default SteppedSpline;
}
declare module "terriajs-cesium/Source/Core/subdivideArray" {
  import { subdivideArray } from "terriajs-cesium";
  export default subdivideArray;
}
declare module "terriajs-cesium/Source/Core/TaskProcessor" {
  import { TaskProcessor } from "terriajs-cesium";
  export default TaskProcessor;
}
declare module "terriajs-cesium/Source/Core/TerrainData" {
  import { TerrainData } from "terriajs-cesium";
  export default TerrainData;
}
declare module "terriajs-cesium/Source/Core/TerrainProvider" {
  import { TerrainProvider } from "terriajs-cesium";
  export default TerrainProvider;
}
declare module "terriajs-cesium/Source/Core/TileAvailability" {
  import { TileAvailability } from "terriajs-cesium";
  export default TileAvailability;
}
declare module "terriajs-cesium/Source/Core/TileProviderError" {
  import { TileProviderError } from "terriajs-cesium";
  export default TileProviderError;
}
declare module "terriajs-cesium/Source/Core/TilingScheme" {
  import { TilingScheme } from "terriajs-cesium";
  export default TilingScheme;
}
declare module "terriajs-cesium/Source/Core/TimeInterval" {
  import { TimeInterval } from "terriajs-cesium";
  export default TimeInterval;
}
declare module "terriajs-cesium/Source/Core/TimeIntervalCollection" {
  import { TimeIntervalCollection } from "terriajs-cesium";
  export default TimeIntervalCollection;
}
declare module "terriajs-cesium/Source/Core/TimeStandard" {
  import { TimeStandard } from "terriajs-cesium";
  export default TimeStandard;
}
declare module "terriajs-cesium/Source/Core/Transforms" {
  import { Transforms } from "terriajs-cesium";
  export default Transforms;
}
declare module "terriajs-cesium/Source/Core/TranslationRotationScale" {
  import { TranslationRotationScale } from "terriajs-cesium";
  export default TranslationRotationScale;
}
declare module "terriajs-cesium/Source/Core/TridiagonalSystemSolver" {
  import { TridiagonalSystemSolver } from "terriajs-cesium";
  export default TridiagonalSystemSolver;
}
declare module "terriajs-cesium/Source/Core/TrustedServers" {
  import { TrustedServers } from "terriajs-cesium";
  export default TrustedServers;
}
declare module "terriajs-cesium/Source/Core/VertexFormat" {
  import { VertexFormat } from "terriajs-cesium";
  export default VertexFormat;
}
declare module "terriajs-cesium/Source/Core/VideoSynchronizer" {
  import { VideoSynchronizer } from "terriajs-cesium";
  export default VideoSynchronizer;
}
declare module "terriajs-cesium/Source/Core/Visibility" {
  import { Visibility } from "terriajs-cesium";
  export default Visibility;
}
declare module "terriajs-cesium/Source/Core/VRTheWorldTerrainProvider" {
  import { VRTheWorldTerrainProvider } from "terriajs-cesium";
  export default VRTheWorldTerrainProvider;
}
declare module "terriajs-cesium/Source/Core/WallGeometry" {
  import { WallGeometry } from "terriajs-cesium";
  export default WallGeometry;
}
declare module "terriajs-cesium/Source/Core/WallOutlineGeometry" {
  import { WallOutlineGeometry } from "terriajs-cesium";
  export default WallOutlineGeometry;
}
declare module "terriajs-cesium/Source/Core/WebGLConstants" {
  import { WebGLConstants } from "terriajs-cesium";
  export default WebGLConstants;
}
declare module "terriajs-cesium/Source/Core/WebMercatorProjection" {
  import { WebMercatorProjection } from "terriajs-cesium";
  export default WebMercatorProjection;
}
declare module "terriajs-cesium/Source/Core/WebMercatorTilingScheme" {
  import { WebMercatorTilingScheme } from "terriajs-cesium";
  export default WebMercatorTilingScheme;
}
declare module "terriajs-cesium/Source/Core/WindingOrder" {
  import { WindingOrder } from "terriajs-cesium";
  export default WindingOrder;
}
declare module "terriajs-cesium/Source/Core/writeTextToCanvas" {
  import { writeTextToCanvas } from "terriajs-cesium";
  export default writeTextToCanvas;
}
declare module "terriajs-cesium/Source/DataSources/BillboardGraphics" {
  import { BillboardGraphics } from "terriajs-cesium";
  export default BillboardGraphics;
}
declare module "terriajs-cesium/Source/DataSources/BillboardVisualizer" {
  import { BillboardVisualizer } from "terriajs-cesium";
  export default BillboardVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/BoxGeometryUpdater" {
  import { BoxGeometryUpdater } from "terriajs-cesium";
  export default BoxGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/BoxGraphics" {
  import { BoxGraphics } from "terriajs-cesium";
  export default BoxGraphics;
}
declare module "terriajs-cesium/Source/DataSources/CallbackProperty" {
  import { CallbackProperty } from "terriajs-cesium";
  export default CallbackProperty;
}
declare module "terriajs-cesium/Source/DataSources/Cesium3DTilesetGraphics" {
  import { Cesium3DTilesetGraphics } from "terriajs-cesium";
  export default Cesium3DTilesetGraphics;
}
declare module "terriajs-cesium/Source/DataSources/Cesium3DTilesetVisualizer" {
  import { Cesium3DTilesetVisualizer } from "terriajs-cesium";
  export default Cesium3DTilesetVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/CheckerboardMaterialProperty" {
  import { CheckerboardMaterialProperty } from "terriajs-cesium";
  export default CheckerboardMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/ColorMaterialProperty" {
  import { ColorMaterialProperty } from "terriajs-cesium";
  export default ColorMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/CompositeEntityCollection" {
  import { CompositeEntityCollection } from "terriajs-cesium";
  export default CompositeEntityCollection;
}
declare module "terriajs-cesium/Source/DataSources/CompositeMaterialProperty" {
  import { CompositeMaterialProperty } from "terriajs-cesium";
  export default CompositeMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/CompositePositionProperty" {
  import { CompositePositionProperty } from "terriajs-cesium";
  export default CompositePositionProperty;
}
declare module "terriajs-cesium/Source/DataSources/CompositeProperty" {
  import { CompositeProperty } from "terriajs-cesium";
  export default CompositeProperty;
}
declare module "terriajs-cesium/Source/DataSources/ConstantPositionProperty" {
  import { ConstantPositionProperty } from "terriajs-cesium";
  export default ConstantPositionProperty;
}
declare module "terriajs-cesium/Source/DataSources/ConstantProperty" {
  import { ConstantProperty } from "terriajs-cesium";
  export default ConstantProperty;
}
declare module "terriajs-cesium/Source/DataSources/CorridorGeometryUpdater" {
  import { CorridorGeometryUpdater } from "terriajs-cesium";
  export default CorridorGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/CorridorGraphics" {
  import { CorridorGraphics } from "terriajs-cesium";
  export default CorridorGraphics;
}
declare module "terriajs-cesium/Source/DataSources/CustomDataSource" {
  import { CustomDataSource } from "terriajs-cesium";
  export default CustomDataSource;
}
declare module "terriajs-cesium/Source/DataSources/CylinderGeometryUpdater" {
  import { CylinderGeometryUpdater } from "terriajs-cesium";
  export default CylinderGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/CylinderGraphics" {
  import { CylinderGraphics } from "terriajs-cesium";
  export default CylinderGraphics;
}
declare module "terriajs-cesium/Source/DataSources/CzmlDataSource" {
  import { CzmlDataSource } from "terriajs-cesium";
  export default CzmlDataSource;
}
declare module "terriajs-cesium/Source/DataSources/DataSource" {
  import { DataSource } from "terriajs-cesium";
  export default DataSource;
}
declare module "terriajs-cesium/Source/DataSources/DataSourceClock" {
  import { DataSourceClock } from "terriajs-cesium";
  export default DataSourceClock;
}
declare module "terriajs-cesium/Source/DataSources/DataSourceCollection" {
  import { DataSourceCollection } from "terriajs-cesium";
  export default DataSourceCollection;
}
declare module "terriajs-cesium/Source/DataSources/DataSourceDisplay" {
  import { DataSourceDisplay } from "terriajs-cesium";
  export default DataSourceDisplay;
}
declare module "terriajs-cesium/Source/DataSources/EllipseGeometryUpdater" {
  import { EllipseGeometryUpdater } from "terriajs-cesium";
  export default EllipseGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/EllipseGraphics" {
  import { EllipseGraphics } from "terriajs-cesium";
  export default EllipseGraphics;
}
declare module "terriajs-cesium/Source/DataSources/EllipsoidGeometryUpdater" {
  import { EllipsoidGeometryUpdater } from "terriajs-cesium";
  export default EllipsoidGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/EllipsoidGraphics" {
  import { EllipsoidGraphics } from "terriajs-cesium";
  export default EllipsoidGraphics;
}
declare module "terriajs-cesium/Source/DataSources/Entity" {
  import { Entity } from "terriajs-cesium";
  export default Entity;
}
declare module "terriajs-cesium/Source/DataSources/EntityCluster" {
  import { EntityCluster } from "terriajs-cesium";
  export default EntityCluster;
}
declare module "terriajs-cesium/Source/DataSources/EntityCollection" {
  import { EntityCollection } from "terriajs-cesium";
  export default EntityCollection;
}
declare module "terriajs-cesium/Source/DataSources/EntityView" {
  import { EntityView } from "terriajs-cesium";
  export default EntityView;
}
declare module "terriajs-cesium/Source/DataSources/exportKml" {
  import { exportKml } from "terriajs-cesium";
  export default exportKml;
}
declare module "terriajs-cesium/Source/DataSources/GeoJsonDataSource" {
  import { GeoJsonDataSource } from "terriajs-cesium";
  export default GeoJsonDataSource;
}
declare module "terriajs-cesium/Source/DataSources/GeometryUpdater" {
  import { GeometryUpdater } from "terriajs-cesium";
  export default GeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/GeometryVisualizer" {
  import { GeometryVisualizer } from "terriajs-cesium";
  export default GeometryVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/GpxDataSource" {
  import { GpxDataSource } from "terriajs-cesium";
  export default GpxDataSource;
}
declare module "terriajs-cesium/Source/DataSources/GridMaterialProperty" {
  import { GridMaterialProperty } from "terriajs-cesium";
  export default GridMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/GroundGeometryUpdater" {
  import { GroundGeometryUpdater } from "terriajs-cesium";
  export default GroundGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/ImageMaterialProperty" {
  import { ImageMaterialProperty } from "terriajs-cesium";
  export default ImageMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/KmlCamera" {
  import { KmlCamera } from "terriajs-cesium";
  export default KmlCamera;
}
declare module "terriajs-cesium/Source/DataSources/KmlDataSource" {
  import { KmlDataSource } from "terriajs-cesium";
  export default KmlDataSource;
}
declare module "terriajs-cesium/Source/DataSources/KmlLookAt" {
  import { KmlLookAt } from "terriajs-cesium";
  export default KmlLookAt;
}
declare module "terriajs-cesium/Source/DataSources/KmlTour" {
  import { KmlTour } from "terriajs-cesium";
  export default KmlTour;
}
declare module "terriajs-cesium/Source/DataSources/KmlTourFlyTo" {
  import { KmlTourFlyTo } from "terriajs-cesium";
  export default KmlTourFlyTo;
}
declare module "terriajs-cesium/Source/DataSources/KmlTourWait" {
  import { KmlTourWait } from "terriajs-cesium";
  export default KmlTourWait;
}
declare module "terriajs-cesium/Source/DataSources/LabelGraphics" {
  import { LabelGraphics } from "terriajs-cesium";
  export default LabelGraphics;
}
declare module "terriajs-cesium/Source/DataSources/LabelVisualizer" {
  import { LabelVisualizer } from "terriajs-cesium";
  export default LabelVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/MaterialProperty" {
  import { MaterialProperty } from "terriajs-cesium";
  export default MaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/ModelGraphics" {
  import { ModelGraphics } from "terriajs-cesium";
  export default ModelGraphics;
}
declare module "terriajs-cesium/Source/DataSources/ModelVisualizer" {
  import { ModelVisualizer } from "terriajs-cesium";
  export default ModelVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/NodeTransformationProperty" {
  import { NodeTransformationProperty } from "terriajs-cesium";
  export default NodeTransformationProperty;
}
declare module "terriajs-cesium/Source/DataSources/PathGraphics" {
  import { PathGraphics } from "terriajs-cesium";
  export default PathGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PathVisualizer" {
  import { PathVisualizer } from "terriajs-cesium";
  export default PathVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/PlaneGeometryUpdater" {
  import { PlaneGeometryUpdater } from "terriajs-cesium";
  export default PlaneGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/PlaneGraphics" {
  import { PlaneGraphics } from "terriajs-cesium";
  export default PlaneGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PointGraphics" {
  import { PointGraphics } from "terriajs-cesium";
  export default PointGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PointVisualizer" {
  import { PointVisualizer } from "terriajs-cesium";
  export default PointVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/PolygonGeometryUpdater" {
  import { PolygonGeometryUpdater } from "terriajs-cesium";
  export default PolygonGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/PolygonGraphics" {
  import { PolygonGraphics } from "terriajs-cesium";
  export default PolygonGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PolylineArrowMaterialProperty" {
  import { PolylineArrowMaterialProperty } from "terriajs-cesium";
  export default PolylineArrowMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/PolylineDashMaterialProperty" {
  import { PolylineDashMaterialProperty } from "terriajs-cesium";
  export default PolylineDashMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/PolylineGeometryUpdater" {
  import { PolylineGeometryUpdater } from "terriajs-cesium";
  export default PolylineGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/PolylineGlowMaterialProperty" {
  import { PolylineGlowMaterialProperty } from "terriajs-cesium";
  export default PolylineGlowMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/PolylineGraphics" {
  import { PolylineGraphics } from "terriajs-cesium";
  export default PolylineGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PolylineOutlineMaterialProperty" {
  import { PolylineOutlineMaterialProperty } from "terriajs-cesium";
  export default PolylineOutlineMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/PolylineVisualizer" {
  import { PolylineVisualizer } from "terriajs-cesium";
  export default PolylineVisualizer;
}
declare module "terriajs-cesium/Source/DataSources/PolylineVolumeGeometryUpdater" {
  import { PolylineVolumeGeometryUpdater } from "terriajs-cesium";
  export default PolylineVolumeGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/PolylineVolumeGraphics" {
  import { PolylineVolumeGraphics } from "terriajs-cesium";
  export default PolylineVolumeGraphics;
}
declare module "terriajs-cesium/Source/DataSources/PositionProperty" {
  import { PositionProperty } from "terriajs-cesium";
  export default PositionProperty;
}
declare module "terriajs-cesium/Source/DataSources/PositionPropertyArray" {
  import { PositionPropertyArray } from "terriajs-cesium";
  export default PositionPropertyArray;
}
declare module "terriajs-cesium/Source/DataSources/Property" {
  import { Property } from "terriajs-cesium";
  export default Property;
}
declare module "terriajs-cesium/Source/DataSources/PropertyArray" {
  import { PropertyArray } from "terriajs-cesium";
  export default PropertyArray;
}
declare module "terriajs-cesium/Source/DataSources/PropertyBag" {
  import { PropertyBag } from "terriajs-cesium";
  export default PropertyBag;
}
declare module "terriajs-cesium/Source/DataSources/RectangleGeometryUpdater" {
  import { RectangleGeometryUpdater } from "terriajs-cesium";
  export default RectangleGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/RectangleGraphics" {
  import { RectangleGraphics } from "terriajs-cesium";
  export default RectangleGraphics;
}
declare module "terriajs-cesium/Source/DataSources/ReferenceProperty" {
  import { ReferenceProperty } from "terriajs-cesium";
  export default ReferenceProperty;
}
declare module "terriajs-cesium/Source/DataSources/Rotation" {
  import { Rotation } from "terriajs-cesium";
  export default Rotation;
}
declare module "terriajs-cesium/Source/DataSources/SampledPositionProperty" {
  import { SampledPositionProperty } from "terriajs-cesium";
  export default SampledPositionProperty;
}
declare module "terriajs-cesium/Source/DataSources/SampledProperty" {
  import { SampledProperty } from "terriajs-cesium";
  export default SampledProperty;
}
declare module "terriajs-cesium/Source/DataSources/StripeMaterialProperty" {
  import { StripeMaterialProperty } from "terriajs-cesium";
  export default StripeMaterialProperty;
}
declare module "terriajs-cesium/Source/DataSources/StripeOrientation" {
  import { StripeOrientation } from "terriajs-cesium";
  export default StripeOrientation;
}
declare module "terriajs-cesium/Source/DataSources/TimeIntervalCollectionPositionProperty" {
  import { TimeIntervalCollectionPositionProperty } from "terriajs-cesium";
  export default TimeIntervalCollectionPositionProperty;
}
declare module "terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty" {
  import { TimeIntervalCollectionProperty } from "terriajs-cesium";
  export default TimeIntervalCollectionProperty;
}
declare module "terriajs-cesium/Source/DataSources/VelocityOrientationProperty" {
  import { VelocityOrientationProperty } from "terriajs-cesium";
  export default VelocityOrientationProperty;
}
declare module "terriajs-cesium/Source/DataSources/VelocityVectorProperty" {
  import { VelocityVectorProperty } from "terriajs-cesium";
  export default VelocityVectorProperty;
}
declare module "terriajs-cesium/Source/DataSources/Visualizer" {
  import { Visualizer } from "terriajs-cesium";
  export default Visualizer;
}
declare module "terriajs-cesium/Source/DataSources/WallGeometryUpdater" {
  import { WallGeometryUpdater } from "terriajs-cesium";
  export default WallGeometryUpdater;
}
declare module "terriajs-cesium/Source/DataSources/WallGraphics" {
  import { WallGraphics } from "terriajs-cesium";
  export default WallGraphics;
}
declare module "terriajs-cesium/Source/Renderer/PixelDatatype" {
  import { PixelDatatype } from "terriajs-cesium";
  export default PixelDatatype;
}
declare module "terriajs-cesium/Source/Renderer/TextureMagnificationFilter" {
  import { TextureMagnificationFilter } from "terriajs-cesium";
  export default TextureMagnificationFilter;
}
declare module "terriajs-cesium/Source/Renderer/TextureMinificationFilter" {
  import { TextureMinificationFilter } from "terriajs-cesium";
  export default TextureMinificationFilter;
}
declare module "terriajs-cesium/Source/Scene/Appearance" {
  import { Appearance } from "terriajs-cesium";
  export default Appearance;
}
declare module "terriajs-cesium/Source/Scene/ArcGisBaseMapType" {
  import { ArcGisBaseMapType } from "terriajs-cesium";
  export default ArcGisBaseMapType;
}
declare module "terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider" {
  import { ArcGisMapServerImageryProvider } from "terriajs-cesium";
  export default ArcGisMapServerImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/ArcGisMapService" {
  import { ArcGisMapService } from "terriajs-cesium";
  export default ArcGisMapService;
}
declare module "terriajs-cesium/Source/Scene/Axis" {
  import { Axis } from "terriajs-cesium";
  export default Axis;
}
declare module "terriajs-cesium/Source/Scene/Billboard" {
  import { Billboard } from "terriajs-cesium";
  export default Billboard;
}
declare module "terriajs-cesium/Source/Scene/BillboardCollection" {
  import { BillboardCollection } from "terriajs-cesium";
  export default BillboardCollection;
}
declare module "terriajs-cesium/Source/Scene/BingMapsImageryProvider" {
  import { BingMapsImageryProvider } from "terriajs-cesium";
  export default BingMapsImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/BingMapsStyle" {
  import { BingMapsStyle } from "terriajs-cesium";
  export default BingMapsStyle;
}
declare module "terriajs-cesium/Source/Scene/BlendEquation" {
  import { BlendEquation } from "terriajs-cesium";
  export default BlendEquation;
}
declare module "terriajs-cesium/Source/Scene/BlendFunction" {
  import { BlendFunction } from "terriajs-cesium";
  export default BlendFunction;
}
declare module "terriajs-cesium/Source/Scene/BlendingState" {
  import { BlendingState } from "terriajs-cesium";
  export default BlendingState;
}
declare module "terriajs-cesium/Source/Scene/BlendOption" {
  import { BlendOption } from "terriajs-cesium";
  export default BlendOption;
}
declare module "terriajs-cesium/Source/Scene/BoxEmitter" {
  import { BoxEmitter } from "terriajs-cesium";
  export default BoxEmitter;
}
declare module "terriajs-cesium/Source/Scene/Camera" {
  import { Camera } from "terriajs-cesium";
  export default Camera;
}
declare module "terriajs-cesium/Source/Scene/CameraEventAggregator" {
  import { CameraEventAggregator } from "terriajs-cesium";
  export default CameraEventAggregator;
}
declare module "terriajs-cesium/Source/Scene/CameraEventType" {
  import { CameraEventType } from "terriajs-cesium";
  export default CameraEventType;
}
declare module "terriajs-cesium/Source/Scene/Cesium3DTile" {
  import { Cesium3DTile } from "terriajs-cesium";
  export default Cesium3DTile;
}
declare module "terriajs-cesium/Source/Scene/Cesium3DTileColorBlendMode" {
  import { Cesium3DTileColorBlendMode } from "terriajs-cesium";
  export default Cesium3DTileColorBlendMode;
}
declare module "terriajs-cesium/Source/Scene/Cesium3DTileContent" {
  import { Cesium3DTileContent } from "terriajs-cesium";
  export default Cesium3DTileContent;
}
declare module "terriajs-cesium/Source/Scene/Cesium3DTileFeature" {
  import { Cesium3DTileFeature } from "terriajs-cesium";
  export default Cesium3DTileFeature;
}
declare module "terriajs-cesium/Source/Scene/Cesium3DTilePointFeature" {
  import { Cesium3DTilePointFeature } from "terriajs-cesium";
  export default Cesium3DTilePointFeature;
}
declare module "terriajs-cesium/Source/Scene/Cesium3DTileset" {
  import { Cesium3DTileset } from "terriajs-cesium";
  export default Cesium3DTileset;
}
declare module "terriajs-cesium/Source/Scene/Cesium3DTileStyle" {
  import { Cesium3DTileStyle } from "terriajs-cesium";
  export default Cesium3DTileStyle;
}
declare module "terriajs-cesium/Source/Scene/Cesium3DTilesVoxelProvider" {
  import { Cesium3DTilesVoxelProvider } from "terriajs-cesium";
  export default Cesium3DTilesVoxelProvider;
}
declare module "terriajs-cesium/Source/Scene/CircleEmitter" {
  import { CircleEmitter } from "terriajs-cesium";
  export default CircleEmitter;
}
declare module "terriajs-cesium/Source/Scene/ClassificationPrimitive" {
  import { ClassificationPrimitive } from "terriajs-cesium";
  export default ClassificationPrimitive;
}
declare module "terriajs-cesium/Source/Scene/ClassificationType" {
  import { ClassificationType } from "terriajs-cesium";
  export default ClassificationType;
}
declare module "terriajs-cesium/Source/Scene/ClippingPlane" {
  import { ClippingPlane } from "terriajs-cesium";
  export default ClippingPlane;
}
declare module "terriajs-cesium/Source/Scene/ClippingPlaneCollection" {
  import { ClippingPlaneCollection } from "terriajs-cesium";
  export default ClippingPlaneCollection;
}
declare module "terriajs-cesium/Source/Scene/CloudCollection" {
  import { CloudCollection } from "terriajs-cesium";
  export default CloudCollection;
}
declare module "terriajs-cesium/Source/Scene/CloudType" {
  import { CloudType } from "terriajs-cesium";
  export default CloudType;
}
declare module "terriajs-cesium/Source/Scene/ColorBlendMode" {
  import { ColorBlendMode } from "terriajs-cesium";
  export default ColorBlendMode;
}
declare module "terriajs-cesium/Source/Scene/ConditionsExpression" {
  import { ConditionsExpression } from "terriajs-cesium";
  export default ConditionsExpression;
}
declare module "terriajs-cesium/Source/Scene/ConeEmitter" {
  import { ConeEmitter } from "terriajs-cesium";
  export default ConeEmitter;
}
declare module "terriajs-cesium/Source/Scene/createElevationBandMaterial" {
  import { createElevationBandMaterial } from "terriajs-cesium";
  export default createElevationBandMaterial;
}
declare module "terriajs-cesium/Source/Scene/createGooglePhotorealistic3DTileset" {
  import { createGooglePhotorealistic3DTileset } from "terriajs-cesium";
  export default createGooglePhotorealistic3DTileset;
}
declare module "terriajs-cesium/Source/Scene/createOsmBuildingsAsync" {
  import { createOsmBuildingsAsync } from "terriajs-cesium";
  export default createOsmBuildingsAsync;
}
declare module "terriajs-cesium/Source/Scene/createTangentSpaceDebugPrimitive" {
  import { createTangentSpaceDebugPrimitive } from "terriajs-cesium";
  export default createTangentSpaceDebugPrimitive;
}
declare module "terriajs-cesium/Source/Scene/createWorldImageryAsync" {
  import { createWorldImageryAsync } from "terriajs-cesium";
  export default createWorldImageryAsync;
}
declare module "terriajs-cesium/Source/Scene/CreditDisplay" {
  import { CreditDisplay } from "terriajs-cesium";
  export default CreditDisplay;
}
declare module "terriajs-cesium/Source/Scene/CullFace" {
  import { CullFace } from "terriajs-cesium";
  export default CullFace;
}
declare module "terriajs-cesium/Source/Scene/CumulusCloud" {
  import { CumulusCloud } from "terriajs-cesium";
  export default CumulusCloud;
}
declare module "terriajs-cesium/Source/Scene/DebugAppearance" {
  import { DebugAppearance } from "terriajs-cesium";
  export default DebugAppearance;
}
declare module "terriajs-cesium/Source/Scene/DebugCameraPrimitive" {
  import { DebugCameraPrimitive } from "terriajs-cesium";
  export default DebugCameraPrimitive;
}
declare module "terriajs-cesium/Source/Scene/DebugModelMatrixPrimitive" {
  import { DebugModelMatrixPrimitive } from "terriajs-cesium";
  export default DebugModelMatrixPrimitive;
}
declare module "terriajs-cesium/Source/Scene/DepthFunction" {
  import { DepthFunction } from "terriajs-cesium";
  export default DepthFunction;
}
declare module "terriajs-cesium/Source/Scene/DirectionalLight" {
  import { DirectionalLight } from "terriajs-cesium";
  export default DirectionalLight;
}
declare module "terriajs-cesium/Source/Scene/DiscardEmptyTileImagePolicy" {
  import { DiscardEmptyTileImagePolicy } from "terriajs-cesium";
  export default DiscardEmptyTileImagePolicy;
}
declare module "terriajs-cesium/Source/Scene/DiscardMissingTileImagePolicy" {
  import { DiscardMissingTileImagePolicy } from "terriajs-cesium";
  export default DiscardMissingTileImagePolicy;
}
declare module "terriajs-cesium/Source/Scene/EllipsoidSurfaceAppearance" {
  import { EllipsoidSurfaceAppearance } from "terriajs-cesium";
  export default EllipsoidSurfaceAppearance;
}
declare module "terriajs-cesium/Source/Scene/Expression" {
  import { Expression } from "terriajs-cesium";
  export default Expression;
}
declare module "terriajs-cesium/Source/Scene/Fog" {
  import { Fog } from "terriajs-cesium";
  export default Fog;
}
declare module "terriajs-cesium/Source/Scene/FrameRateMonitor" {
  import { FrameRateMonitor } from "terriajs-cesium";
  export default FrameRateMonitor;
}
declare module "terriajs-cesium/Source/Scene/GetFeatureInfoFormat" {
  import { GetFeatureInfoFormat } from "terriajs-cesium";
  export default GetFeatureInfoFormat;
}
declare module "terriajs-cesium/Source/Scene/Globe" {
  import { Globe } from "terriajs-cesium";
  export default Globe;
}
declare module "terriajs-cesium/Source/Scene/GlobeTranslucency" {
  import { GlobeTranslucency } from "terriajs-cesium";
  export default GlobeTranslucency;
}
declare module "terriajs-cesium/Source/Scene/GltfPipeline/removeExtension" {
  import { removeExtension } from "terriajs-cesium";
  export default removeExtension;
}
declare module "terriajs-cesium/Source/Scene/GoogleEarthEnterpriseImageryProvider" {
  import { GoogleEarthEnterpriseImageryProvider } from "terriajs-cesium";
  export default GoogleEarthEnterpriseImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/GoogleEarthEnterpriseMapsProvider" {
  import { GoogleEarthEnterpriseMapsProvider } from "terriajs-cesium";
  export default GoogleEarthEnterpriseMapsProvider;
}
declare module "terriajs-cesium/Source/Scene/GridImageryProvider" {
  import { GridImageryProvider } from "terriajs-cesium";
  export default GridImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/GroundPolylinePrimitive" {
  import { GroundPolylinePrimitive } from "terriajs-cesium";
  export default GroundPolylinePrimitive;
}
declare module "terriajs-cesium/Source/Scene/GroundPrimitive" {
  import { GroundPrimitive } from "terriajs-cesium";
  export default GroundPrimitive;
}
declare module "terriajs-cesium/Source/Scene/HeightReference" {
  import { HeightReference } from "terriajs-cesium";
  export default HeightReference;
}
declare module "terriajs-cesium/Source/Scene/HorizontalOrigin" {
  import { HorizontalOrigin } from "terriajs-cesium";
  export default HorizontalOrigin;
}
declare module "terriajs-cesium/Source/Scene/I3SDataProvider" {
  import { I3SDataProvider } from "terriajs-cesium";
  export default I3SDataProvider;
}
declare module "terriajs-cesium/Source/Scene/I3SFeature" {
  import { I3SFeature } from "terriajs-cesium";
  export default I3SFeature;
}
declare module "terriajs-cesium/Source/Scene/I3SField" {
  import { I3SField } from "terriajs-cesium";
  export default I3SField;
}
declare module "terriajs-cesium/Source/Scene/I3SGeometry" {
  import { I3SGeometry } from "terriajs-cesium";
  export default I3SGeometry;
}
declare module "terriajs-cesium/Source/Scene/I3SLayer" {
  import { I3SLayer } from "terriajs-cesium";
  export default I3SLayer;
}
declare module "terriajs-cesium/Source/Scene/I3SNode" {
  import { I3SNode } from "terriajs-cesium";
  export default I3SNode;
}
declare module "terriajs-cesium/Source/Scene/ImageBasedLighting" {
  import { ImageBasedLighting } from "terriajs-cesium";
  export default ImageBasedLighting;
}
declare module "terriajs-cesium/Source/Scene/ImageryLayer" {
  import { ImageryLayer } from "terriajs-cesium";
  export default ImageryLayer;
}
declare module "terriajs-cesium/Source/Scene/ImageryLayerCollection" {
  import { ImageryLayerCollection } from "terriajs-cesium";
  export default ImageryLayerCollection;
}
declare module "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo" {
  import { ImageryLayerFeatureInfo } from "terriajs-cesium";
  export default ImageryLayerFeatureInfo;
}
declare module "terriajs-cesium/Source/Scene/ImageryProvider" {
  import { ImageryProvider } from "terriajs-cesium";
  export default ImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/IonImageryProvider" {
  import { IonImageryProvider } from "terriajs-cesium";
  export default IonImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/IonWorldImageryStyle" {
  import { IonWorldImageryStyle } from "terriajs-cesium";
  export default IonWorldImageryStyle;
}
declare module "terriajs-cesium/Source/Scene/Label" {
  import { Label } from "terriajs-cesium";
  export default Label;
}
declare module "terriajs-cesium/Source/Scene/LabelCollection" {
  import { LabelCollection } from "terriajs-cesium";
  export default LabelCollection;
}
declare module "terriajs-cesium/Source/Scene/LabelStyle" {
  import { LabelStyle } from "terriajs-cesium";
  export default LabelStyle;
}
declare module "terriajs-cesium/Source/Scene/Light" {
  import { Light } from "terriajs-cesium";
  export default Light;
}
declare module "terriajs-cesium/Source/Scene/MapboxImageryProvider" {
  import { MapboxImageryProvider } from "terriajs-cesium";
  export default MapboxImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/MapboxStyleImageryProvider" {
  import { MapboxStyleImageryProvider } from "terriajs-cesium";
  export default MapboxStyleImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/MapMode2D" {
  import { MapMode2D } from "terriajs-cesium";
  export default MapMode2D;
}
declare module "terriajs-cesium/Source/Scene/Material" {
  import { Material } from "terriajs-cesium";
  export default Material;
}
declare module "terriajs-cesium/Source/Scene/MaterialAppearance" {
  import { MaterialAppearance } from "terriajs-cesium";
  export default MaterialAppearance;
}
declare module "terriajs-cesium/Source/Scene/MetadataClass" {
  import { MetadataClass } from "terriajs-cesium";
  export default MetadataClass;
}
declare module "terriajs-cesium/Source/Scene/MetadataClassProperty" {
  import { MetadataClassProperty } from "terriajs-cesium";
  export default MetadataClassProperty;
}
declare module "terriajs-cesium/Source/Scene/MetadataComponentType" {
  import { MetadataComponentType } from "terriajs-cesium";
  export default MetadataComponentType;
}
declare module "terriajs-cesium/Source/Scene/MetadataEnum" {
  import { MetadataEnum } from "terriajs-cesium";
  export default MetadataEnum;
}
declare module "terriajs-cesium/Source/Scene/MetadataEnumValue" {
  import { MetadataEnumValue } from "terriajs-cesium";
  export default MetadataEnumValue;
}
declare module "terriajs-cesium/Source/Scene/MetadataSchema" {
  import { MetadataSchema } from "terriajs-cesium";
  export default MetadataSchema;
}
declare module "terriajs-cesium/Source/Scene/MetadataType" {
  import { MetadataType } from "terriajs-cesium";
  export default MetadataType;
}
declare module "terriajs-cesium/Source/Scene/Model/CustomShader" {
  import { CustomShader } from "terriajs-cesium";
  export default CustomShader;
}
declare module "terriajs-cesium/Source/Scene/Model/CustomShaderMode" {
  import { CustomShaderMode } from "terriajs-cesium";
  export default CustomShaderMode;
}
declare module "terriajs-cesium/Source/Scene/Model/CustomShaderTranslucencyMode" {
  import { CustomShaderTranslucencyMode } from "terriajs-cesium";
  export default CustomShaderTranslucencyMode;
}
declare module "terriajs-cesium/Source/Scene/Model/LightingModel" {
  import { LightingModel } from "terriajs-cesium";
  export default LightingModel;
}
declare module "terriajs-cesium/Source/Scene/Model/Model" {
  import { Model } from "terriajs-cesium";
  export default Model;
}
declare module "terriajs-cesium/Source/Scene/Model/ModelAnimation" {
  import { ModelAnimation } from "terriajs-cesium";
  export default ModelAnimation;
}
declare module "terriajs-cesium/Source/Scene/Model/ModelAnimationCollection" {
  import { ModelAnimationCollection } from "terriajs-cesium";
  export default ModelAnimationCollection;
}
declare module "terriajs-cesium/Source/Scene/Model/ModelFeature" {
  import { ModelFeature } from "terriajs-cesium";
  export default ModelFeature;
}
declare module "terriajs-cesium/Source/Scene/Model/ModelNode" {
  import { ModelNode } from "terriajs-cesium";
  export default ModelNode;
}
declare module "terriajs-cesium/Source/Scene/Model/TextureUniform" {
  import { TextureUniform } from "terriajs-cesium";
  export default TextureUniform;
}
declare module "terriajs-cesium/Source/Scene/Model/UniformType" {
  import { UniformType } from "terriajs-cesium";
  export default UniformType;
}
declare module "terriajs-cesium/Source/Scene/Model/VaryingType" {
  import { VaryingType } from "terriajs-cesium";
  export default VaryingType;
}
declare module "terriajs-cesium/Source/Scene/ModelAnimationLoop" {
  import { ModelAnimationLoop } from "terriajs-cesium";
  export default ModelAnimationLoop;
}
declare module "terriajs-cesium/Source/Scene/Moon" {
  import { Moon } from "terriajs-cesium";
  export default Moon;
}
declare module "terriajs-cesium/Source/Scene/NeverTileDiscardPolicy" {
  import { NeverTileDiscardPolicy } from "terriajs-cesium";
  export default NeverTileDiscardPolicy;
}
declare module "terriajs-cesium/Source/Scene/OpenStreetMapImageryProvider" {
  import { OpenStreetMapImageryProvider } from "terriajs-cesium";
  export default OpenStreetMapImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/Particle" {
  import { Particle } from "terriajs-cesium";
  export default Particle;
}
declare module "terriajs-cesium/Source/Scene/ParticleBurst" {
  import { ParticleBurst } from "terriajs-cesium";
  export default ParticleBurst;
}
declare module "terriajs-cesium/Source/Scene/ParticleEmitter" {
  import { ParticleEmitter } from "terriajs-cesium";
  export default ParticleEmitter;
}
declare module "terriajs-cesium/Source/Scene/ParticleSystem" {
  import { ParticleSystem } from "terriajs-cesium";
  export default ParticleSystem;
}
declare module "terriajs-cesium/Source/Scene/PerInstanceColorAppearance" {
  import { PerInstanceColorAppearance } from "terriajs-cesium";
  export default PerInstanceColorAppearance;
}
declare module "terriajs-cesium/Source/Scene/PointCloudShading" {
  import { PointCloudShading } from "terriajs-cesium";
  export default PointCloudShading;
}
declare module "terriajs-cesium/Source/Scene/PointPrimitive" {
  import { PointPrimitive } from "terriajs-cesium";
  export default PointPrimitive;
}
declare module "terriajs-cesium/Source/Scene/PointPrimitiveCollection" {
  import { PointPrimitiveCollection } from "terriajs-cesium";
  export default PointPrimitiveCollection;
}
declare module "terriajs-cesium/Source/Scene/Polyline" {
  import { Polyline } from "terriajs-cesium";
  export default Polyline;
}
declare module "terriajs-cesium/Source/Scene/PolylineCollection" {
  import { PolylineCollection } from "terriajs-cesium";
  export default PolylineCollection;
}
declare module "terriajs-cesium/Source/Scene/PolylineColorAppearance" {
  import { PolylineColorAppearance } from "terriajs-cesium";
  export default PolylineColorAppearance;
}
declare module "terriajs-cesium/Source/Scene/PolylineMaterialAppearance" {
  import { PolylineMaterialAppearance } from "terriajs-cesium";
  export default PolylineMaterialAppearance;
}
declare module "terriajs-cesium/Source/Scene/PostProcessStage" {
  import { PostProcessStage } from "terriajs-cesium";
  export default PostProcessStage;
}
declare module "terriajs-cesium/Source/Scene/PostProcessStageCollection" {
  import { PostProcessStageCollection } from "terriajs-cesium";
  export default PostProcessStageCollection;
}
declare module "terriajs-cesium/Source/Scene/PostProcessStageComposite" {
  import { PostProcessStageComposite } from "terriajs-cesium";
  export default PostProcessStageComposite;
}
declare module "terriajs-cesium/Source/Scene/PostProcessStageLibrary" {
  import { PostProcessStageLibrary } from "terriajs-cesium";
  export default PostProcessStageLibrary;
}
declare module "terriajs-cesium/Source/Scene/PostProcessStageSampleMode" {
  import { PostProcessStageSampleMode } from "terriajs-cesium";
  export default PostProcessStageSampleMode;
}
declare module "terriajs-cesium/Source/Scene/Primitive" {
  import { Primitive } from "terriajs-cesium";
  export default Primitive;
}
declare module "terriajs-cesium/Source/Scene/PrimitiveCollection" {
  import { PrimitiveCollection } from "terriajs-cesium";
  export default PrimitiveCollection;
}
declare module "terriajs-cesium/Source/Scene/Scene" {
  import { Scene } from "terriajs-cesium";
  export default Scene;
}
declare module "terriajs-cesium/Source/Scene/SceneMode" {
  import { SceneMode } from "terriajs-cesium";
  export default SceneMode;
}
declare module "terriajs-cesium/Source/Scene/SceneTransforms" {
  import { SceneTransforms } from "terriajs-cesium";
  export default SceneTransforms;
}
declare module "terriajs-cesium/Source/Scene/ScreenSpaceCameraController" {
  import { ScreenSpaceCameraController } from "terriajs-cesium";
  export default ScreenSpaceCameraController;
}
declare module "terriajs-cesium/Source/Scene/ShadowMap" {
  import { ShadowMap } from "terriajs-cesium";
  export default ShadowMap;
}
declare module "terriajs-cesium/Source/Scene/ShadowMode" {
  import { ShadowMode } from "terriajs-cesium";
  export default ShadowMode;
}
declare module "terriajs-cesium/Source/Scene/SingleTileImageryProvider" {
  import { SingleTileImageryProvider } from "terriajs-cesium";
  export default SingleTileImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/SkyAtmosphere" {
  import { SkyAtmosphere } from "terriajs-cesium";
  export default SkyAtmosphere;
}
declare module "terriajs-cesium/Source/Scene/SkyBox" {
  import { SkyBox } from "terriajs-cesium";
  export default SkyBox;
}
declare module "terriajs-cesium/Source/Scene/SphereEmitter" {
  import { SphereEmitter } from "terriajs-cesium";
  export default SphereEmitter;
}
declare module "terriajs-cesium/Source/Scene/SplitDirection" {
  import { SplitDirection } from "terriajs-cesium";
  export default SplitDirection;
}
declare module "terriajs-cesium/Source/Scene/StencilFunction" {
  import { StencilFunction } from "terriajs-cesium";
  export default StencilFunction;
}
declare module "terriajs-cesium/Source/Scene/StencilOperation" {
  import { StencilOperation } from "terriajs-cesium";
  export default StencilOperation;
}
declare module "terriajs-cesium/Source/Scene/StyleExpression" {
  import { StyleExpression } from "terriajs-cesium";
  export default StyleExpression;
}
declare module "terriajs-cesium/Source/Scene/Sun" {
  import { Sun } from "terriajs-cesium";
  export default Sun;
}
declare module "terriajs-cesium/Source/Scene/SunLight" {
  import { SunLight } from "terriajs-cesium";
  export default SunLight;
}
declare module "terriajs-cesium/Source/Scene/Terrain" {
  import { Terrain } from "terriajs-cesium";
  export default Terrain;
}
declare module "terriajs-cesium/Source/Scene/TileCoordinatesImageryProvider" {
  import { TileCoordinatesImageryProvider } from "terriajs-cesium";
  export default TileCoordinatesImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/TileDiscardPolicy" {
  import { TileDiscardPolicy } from "terriajs-cesium";
  export default TileDiscardPolicy;
}
declare module "terriajs-cesium/Source/Scene/TileMapServiceImageryProvider" {
  import { TileMapServiceImageryProvider } from "terriajs-cesium";
  export default TileMapServiceImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/TimeDynamicImagery" {
  import { TimeDynamicImagery } from "terriajs-cesium";
  export default TimeDynamicImagery;
}
declare module "terriajs-cesium/Source/Scene/TimeDynamicPointCloud" {
  import { TimeDynamicPointCloud } from "terriajs-cesium";
  export default TimeDynamicPointCloud;
}
declare module "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider" {
  import { UrlTemplateImageryProvider } from "terriajs-cesium";
  export default UrlTemplateImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/VerticalOrigin" {
  import { VerticalOrigin } from "terriajs-cesium";
  export default VerticalOrigin;
}
declare module "terriajs-cesium/Source/Scene/ViewportQuad" {
  import { ViewportQuad } from "terriajs-cesium";
  export default ViewportQuad;
}
declare module "terriajs-cesium/Source/Scene/VoxelPrimitive" {
  import { VoxelPrimitive } from "terriajs-cesium";
  export default VoxelPrimitive;
}
declare module "terriajs-cesium/Source/Scene/VoxelProvider" {
  import { VoxelProvider } from "terriajs-cesium";
  export default VoxelProvider;
}
declare module "terriajs-cesium/Source/Scene/VoxelShapeType" {
  import { VoxelShapeType } from "terriajs-cesium";
  export default VoxelShapeType;
}
declare module "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider" {
  import { WebMapServiceImageryProvider } from "terriajs-cesium";
  export default WebMapServiceImageryProvider;
}
declare module "terriajs-cesium/Source/Scene/WebMapTileServiceImageryProvider" {
  import { WebMapTileServiceImageryProvider } from "terriajs-cesium";
  export default WebMapTileServiceImageryProvider;
}
declare module "terriajs-cesium/Source/Widget/CesiumWidget" {
  import { CesiumWidget } from "terriajs-cesium";
  export default CesiumWidget;
}
// End Generated Declarations
