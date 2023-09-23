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


// Begin Generated Declarations
declare module "terriajs-cesium/Source/Core/ArcGISTiledElevationTerrainProvider" { import { ArcGISTiledElevationTerrainProvider } from '@cesium/engine'; export default ArcGISTiledElevationTerrainProvider; }
declare module "terriajs-cesium/Source/Core/ArcType" { import { ArcType } from '@cesium/engine'; export default ArcType; }
declare module "terriajs-cesium/Source/Core/AssociativeArray" { import { AssociativeArray } from '@cesium/engine'; export default AssociativeArray; }
declare module "terriajs-cesium/Source/Core/AxisAlignedBoundingBox" { import { AxisAlignedBoundingBox } from '@cesium/engine'; export default AxisAlignedBoundingBox; }
declare module "terriajs-cesium/Source/Core/barycentricCoordinates" { import { barycentricCoordinates } from '@cesium/engine'; export default barycentricCoordinates; }
declare module "terriajs-cesium/Source/Core/binarySearch" { import { binarySearch } from '@cesium/engine'; export default binarySearch; }
declare module "terriajs-cesium/Source/Core/BingMapsGeocoderService" { import { BingMapsGeocoderService } from '@cesium/engine'; export default BingMapsGeocoderService; }
declare module "terriajs-cesium/Source/Core/BoundingRectangle" { import { BoundingRectangle } from '@cesium/engine'; export default BoundingRectangle; }
declare module "terriajs-cesium/Source/Core/BoundingSphere" { import { BoundingSphere } from '@cesium/engine'; export default BoundingSphere; }
declare module "terriajs-cesium/Source/Core/BoxGeometry" { import { BoxGeometry } from '@cesium/engine'; export default BoxGeometry; }
declare module "terriajs-cesium/Source/Core/BoxOutlineGeometry" { import { BoxOutlineGeometry } from '@cesium/engine'; export default BoxOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/buildModuleUrl" { import { buildModuleUrl } from '@cesium/engine'; export default buildModuleUrl; }
declare module "terriajs-cesium/Source/Core/Cartesian2" { import { Cartesian2 } from '@cesium/engine'; export default Cartesian2; }
declare module "terriajs-cesium/Source/Core/Cartesian3" { import { Cartesian3 } from '@cesium/engine'; export default Cartesian3; }
declare module "terriajs-cesium/Source/Core/Cartesian4" { import { Cartesian4 } from '@cesium/engine'; export default Cartesian4; }
declare module "terriajs-cesium/Source/Core/Cartographic" { import { Cartographic } from '@cesium/engine'; export default Cartographic; }
declare module "terriajs-cesium/Source/Core/CartographicGeocoderService" { import { CartographicGeocoderService } from '@cesium/engine'; export default CartographicGeocoderService; }
declare module "terriajs-cesium/Source/Core/CatmullRomSpline" { import { CatmullRomSpline } from '@cesium/engine'; export default CatmullRomSpline; }
declare module "terriajs-cesium/Source/Core/CesiumTerrainProvider" { import { CesiumTerrainProvider } from '@cesium/engine'; export default CesiumTerrainProvider; }
declare module "terriajs-cesium/Source/Core/CircleGeometry" { import { CircleGeometry } from '@cesium/engine'; export default CircleGeometry; }
declare module "terriajs-cesium/Source/Core/CircleOutlineGeometry" { import { CircleOutlineGeometry } from '@cesium/engine'; export default CircleOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/Clock" { import { Clock } from '@cesium/engine'; export default Clock; }
declare module "terriajs-cesium/Source/Core/ClockRange" { import { ClockRange } from '@cesium/engine'; export default ClockRange; }
declare module "terriajs-cesium/Source/Core/ClockStep" { import { ClockStep } from '@cesium/engine'; export default ClockStep; }
declare module "terriajs-cesium/Source/Core/clone" { import { clone } from '@cesium/engine'; export default clone; }
declare module "terriajs-cesium/Source/Core/Color" { import { Color } from '@cesium/engine'; export default Color; }
declare module "terriajs-cesium/Source/Core/ColorGeometryInstanceAttribute" { import { ColorGeometryInstanceAttribute } from '@cesium/engine'; export default ColorGeometryInstanceAttribute; }
declare module "terriajs-cesium/Source/Core/combine" { import { combine } from '@cesium/engine'; export default combine; }
declare module "terriajs-cesium/Source/Core/ComponentDatatype" { import { ComponentDatatype } from '@cesium/engine'; export default ComponentDatatype; }
declare module "terriajs-cesium/Source/Core/CompressedTextureBuffer" { import { CompressedTextureBuffer } from '@cesium/engine'; export default CompressedTextureBuffer; }
declare module "terriajs-cesium/Source/Core/ConstantSpline" { import { ConstantSpline } from '@cesium/engine'; export default ConstantSpline; }
declare module "terriajs-cesium/Source/Core/CoplanarPolygonGeometry" { import { CoplanarPolygonGeometry } from '@cesium/engine'; export default CoplanarPolygonGeometry; }
declare module "terriajs-cesium/Source/Core/CoplanarPolygonOutlineGeometry" { import { CoplanarPolygonOutlineGeometry } from '@cesium/engine'; export default CoplanarPolygonOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/CornerType" { import { CornerType } from '@cesium/engine'; export default CornerType; }
declare module "terriajs-cesium/Source/Core/CorridorGeometry" { import { CorridorGeometry } from '@cesium/engine'; export default CorridorGeometry; }
declare module "terriajs-cesium/Source/Core/CorridorOutlineGeometry" { import { CorridorOutlineGeometry } from '@cesium/engine'; export default CorridorOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/createGuid" { import { createGuid } from '@cesium/engine'; export default createGuid; }
declare module "terriajs-cesium/Source/Core/createWorldTerrainAsync" { import { createWorldTerrainAsync } from '@cesium/engine'; export default createWorldTerrainAsync; }
declare module "terriajs-cesium/Source/Core/Credit" { import { Credit } from '@cesium/engine'; export default Credit; }
declare module "terriajs-cesium/Source/Core/CubicRealPolynomial" { import { CubicRealPolynomial } from '@cesium/engine'; export default CubicRealPolynomial; }
declare module "terriajs-cesium/Source/Core/CullingVolume" { import { CullingVolume } from '@cesium/engine'; export default CullingVolume; }
declare module "terriajs-cesium/Source/Core/CustomHeightmapTerrainProvider" { import { CustomHeightmapTerrainProvider } from '@cesium/engine'; export default CustomHeightmapTerrainProvider; }
declare module "terriajs-cesium/Source/Core/CylinderGeometry" { import { CylinderGeometry } from '@cesium/engine'; export default CylinderGeometry; }
declare module "terriajs-cesium/Source/Core/CylinderOutlineGeometry" { import { CylinderOutlineGeometry } from '@cesium/engine'; export default CylinderOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/DefaultProxy" { import { DefaultProxy } from '@cesium/engine'; export default DefaultProxy; }
declare module "terriajs-cesium/Source/Core/defaultValue" { import { defaultValue } from '@cesium/engine'; export default defaultValue; }
declare module "terriajs-cesium/Source/Core/defined" { import { defined } from '@cesium/engine'; export default defined; }
declare module "terriajs-cesium/Source/Core/destroyObject" { import { destroyObject } from '@cesium/engine'; export default destroyObject; }
declare module "terriajs-cesium/Source/Core/DeveloperError" { import { DeveloperError } from '@cesium/engine'; export default DeveloperError; }
declare module "terriajs-cesium/Source/Core/DistanceDisplayCondition" { import { DistanceDisplayCondition } from '@cesium/engine'; export default DistanceDisplayCondition; }
declare module "terriajs-cesium/Source/Core/DistanceDisplayConditionGeometryInstanceAttribute" { import { DistanceDisplayConditionGeometryInstanceAttribute } from '@cesium/engine'; export default DistanceDisplayConditionGeometryInstanceAttribute; }
declare module "terriajs-cesium/Source/Core/EasingFunction" { import { EasingFunction } from '@cesium/engine'; export default EasingFunction; }
declare module "terriajs-cesium/Source/Core/EllipseGeometry" { import { EllipseGeometry } from '@cesium/engine'; export default EllipseGeometry; }
declare module "terriajs-cesium/Source/Core/EllipseOutlineGeometry" { import { EllipseOutlineGeometry } from '@cesium/engine'; export default EllipseOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/Ellipsoid" { import { Ellipsoid } from '@cesium/engine'; export default Ellipsoid; }
declare module "terriajs-cesium/Source/Core/EllipsoidGeodesic" { import { EllipsoidGeodesic } from '@cesium/engine'; export default EllipsoidGeodesic; }
declare module "terriajs-cesium/Source/Core/EllipsoidGeometry" { import { EllipsoidGeometry } from '@cesium/engine'; export default EllipsoidGeometry; }
declare module "terriajs-cesium/Source/Core/EllipsoidOutlineGeometry" { import { EllipsoidOutlineGeometry } from '@cesium/engine'; export default EllipsoidOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/EllipsoidRhumbLine" { import { EllipsoidRhumbLine } from '@cesium/engine'; export default EllipsoidRhumbLine; }
declare module "terriajs-cesium/Source/Core/EllipsoidTangentPlane" { import { EllipsoidTangentPlane } from '@cesium/engine'; export default EllipsoidTangentPlane; }
declare module "terriajs-cesium/Source/Core/EllipsoidTerrainProvider" { import { EllipsoidTerrainProvider } from '@cesium/engine'; export default EllipsoidTerrainProvider; }
declare module "terriajs-cesium/Source/Core/Event" { import { Event } from '@cesium/engine'; export default Event; }
declare module "terriajs-cesium/Source/Core/EventHelper" { import { EventHelper } from '@cesium/engine'; export default EventHelper; }
declare module "terriajs-cesium/Source/Core/ExtrapolationType" { import { ExtrapolationType } from '@cesium/engine'; export default ExtrapolationType; }
declare module "terriajs-cesium/Source/Core/FeatureDetection" { import { FeatureDetection } from '@cesium/engine'; export default FeatureDetection; }
declare module "terriajs-cesium/Source/Core/formatError" { import { formatError } from '@cesium/engine'; export default formatError; }
declare module "terriajs-cesium/Source/Core/FrustumGeometry" { import { FrustumGeometry } from '@cesium/engine'; export default FrustumGeometry; }
declare module "terriajs-cesium/Source/Core/FrustumOutlineGeometry" { import { FrustumOutlineGeometry } from '@cesium/engine'; export default FrustumOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/Fullscreen" { import { Fullscreen } from '@cesium/engine'; export default Fullscreen; }
declare module "terriajs-cesium/Source/Core/GeocoderService" { import { GeocoderService } from '@cesium/engine'; export default GeocoderService; }
declare module "terriajs-cesium/Source/Core/GeocodeType" { import { GeocodeType } from '@cesium/engine'; export default GeocodeType; }
declare module "terriajs-cesium/Source/Core/GeographicProjection" { import { GeographicProjection } from '@cesium/engine'; export default GeographicProjection; }
declare module "terriajs-cesium/Source/Core/GeographicTilingScheme" { import { GeographicTilingScheme } from '@cesium/engine'; export default GeographicTilingScheme; }
declare module "terriajs-cesium/Source/Core/Geometry" { import { Geometry } from '@cesium/engine'; export default Geometry; }
declare module "terriajs-cesium/Source/Core/GeometryAttribute" { import { GeometryAttribute } from '@cesium/engine'; export default GeometryAttribute; }
declare module "terriajs-cesium/Source/Core/GeometryAttributes" { import { GeometryAttributes } from '@cesium/engine'; export default GeometryAttributes; }
declare module "terriajs-cesium/Source/Core/GeometryFactory" { import { GeometryFactory } from '@cesium/engine'; export default GeometryFactory; }
declare module "terriajs-cesium/Source/Core/GeometryInstance" { import { GeometryInstance } from '@cesium/engine'; export default GeometryInstance; }
declare module "terriajs-cesium/Source/Core/GeometryInstanceAttribute" { import { GeometryInstanceAttribute } from '@cesium/engine'; export default GeometryInstanceAttribute; }
declare module "terriajs-cesium/Source/Core/GeometryPipeline" { import { GeometryPipeline } from '@cesium/engine'; export default GeometryPipeline; }
declare module "terriajs-cesium/Source/Core/getAbsoluteUri" { import { getAbsoluteUri } from '@cesium/engine'; export default getAbsoluteUri; }
declare module "terriajs-cesium/Source/Core/getBaseUri" { import { getBaseUri } from '@cesium/engine'; export default getBaseUri; }
declare module "terriajs-cesium/Source/Core/getExtensionFromUri" { import { getExtensionFromUri } from '@cesium/engine'; export default getExtensionFromUri; }
declare module "terriajs-cesium/Source/Core/getFilenameFromUri" { import { getFilenameFromUri } from '@cesium/engine'; export default getFilenameFromUri; }
declare module "terriajs-cesium/Source/Core/getImagePixels" { import { getImagePixels } from '@cesium/engine'; export default getImagePixels; }
declare module "terriajs-cesium/Source/Core/getTimestamp" { import { getTimestamp } from '@cesium/engine'; export default getTimestamp; }
declare module "terriajs-cesium/Source/Core/GoogleEarthEnterpriseMetadata" { import { GoogleEarthEnterpriseMetadata } from '@cesium/engine'; export default GoogleEarthEnterpriseMetadata; }
declare module "terriajs-cesium/Source/Core/GoogleEarthEnterpriseTerrainData" { import { GoogleEarthEnterpriseTerrainData } from '@cesium/engine'; export default GoogleEarthEnterpriseTerrainData; }
declare module "terriajs-cesium/Source/Core/GoogleEarthEnterpriseTerrainProvider" { import { GoogleEarthEnterpriseTerrainProvider } from '@cesium/engine'; export default GoogleEarthEnterpriseTerrainProvider; }
declare module "terriajs-cesium/Source/Core/GoogleMaps" { import { GoogleMaps } from '@cesium/engine'; export default GoogleMaps; }
declare module "terriajs-cesium/Source/Core/GregorianDate" { import { GregorianDate } from '@cesium/engine'; export default GregorianDate; }
declare module "terriajs-cesium/Source/Core/GroundPolylineGeometry" { import { GroundPolylineGeometry } from '@cesium/engine'; export default GroundPolylineGeometry; }
declare module "terriajs-cesium/Source/Core/HeadingPitchRange" { import { HeadingPitchRange } from '@cesium/engine'; export default HeadingPitchRange; }
declare module "terriajs-cesium/Source/Core/HeadingPitchRoll" { import { HeadingPitchRoll } from '@cesium/engine'; export default HeadingPitchRoll; }
declare module "terriajs-cesium/Source/Core/HeightmapEncoding" { import { HeightmapEncoding } from '@cesium/engine'; export default HeightmapEncoding; }
declare module "terriajs-cesium/Source/Core/HeightmapTerrainData" { import { HeightmapTerrainData } from '@cesium/engine'; export default HeightmapTerrainData; }
declare module "terriajs-cesium/Source/Core/HermitePolynomialApproximation" { import { HermitePolynomialApproximation } from '@cesium/engine'; export default HermitePolynomialApproximation; }
declare module "terriajs-cesium/Source/Core/HermiteSpline" { import { HermiteSpline } from '@cesium/engine'; export default HermiteSpline; }
declare module "terriajs-cesium/Source/Core/HilbertOrder" { import { HilbertOrder } from '@cesium/engine'; export default HilbertOrder; }
declare module "terriajs-cesium/Source/Core/IndexDatatype" { import { IndexDatatype } from '@cesium/engine'; export default IndexDatatype; }
declare module "terriajs-cesium/Source/Core/InterpolationAlgorithm" { import { InterpolationAlgorithm } from '@cesium/engine'; export default InterpolationAlgorithm; }
declare module "terriajs-cesium/Source/Core/Intersect" { import { Intersect } from '@cesium/engine'; export default Intersect; }
declare module "terriajs-cesium/Source/Core/Intersections2D" { import { Intersections2D } from '@cesium/engine'; export default Intersections2D; }
declare module "terriajs-cesium/Source/Core/IntersectionTests" { import { IntersectionTests } from '@cesium/engine'; export default IntersectionTests; }
declare module "terriajs-cesium/Source/Core/Interval" { import { Interval } from '@cesium/engine'; export default Interval; }
declare module "terriajs-cesium/Source/Core/Ion" { import { Ion } from '@cesium/engine'; export default Ion; }
declare module "terriajs-cesium/Source/Core/IonGeocoderService" { import { IonGeocoderService } from '@cesium/engine'; export default IonGeocoderService; }
declare module "terriajs-cesium/Source/Core/IonResource" { import { IonResource } from '@cesium/engine'; export default IonResource; }
declare module "terriajs-cesium/Source/Core/isLeapYear" { import { isLeapYear } from '@cesium/engine'; export default isLeapYear; }
declare module "terriajs-cesium/Source/Core/Iso8601" { import { Iso8601 } from '@cesium/engine'; export default Iso8601; }
declare module "terriajs-cesium/Source/Core/JulianDate" { import { JulianDate } from '@cesium/engine'; export default JulianDate; }
declare module "terriajs-cesium/Source/Core/KeyboardEventModifier" { import { KeyboardEventModifier } from '@cesium/engine'; export default KeyboardEventModifier; }
declare module "terriajs-cesium/Source/Core/LagrangePolynomialApproximation" { import { LagrangePolynomialApproximation } from '@cesium/engine'; export default LagrangePolynomialApproximation; }
declare module "terriajs-cesium/Source/Core/LeapSecond" { import { LeapSecond } from '@cesium/engine'; export default LeapSecond; }
declare module "terriajs-cesium/Source/Core/LinearApproximation" { import { LinearApproximation } from '@cesium/engine'; export default LinearApproximation; }
declare module "terriajs-cesium/Source/Core/LinearSpline" { import { LinearSpline } from '@cesium/engine'; export default LinearSpline; }
declare module "terriajs-cesium/Source/Core/MapProjection" { import { MapProjection } from '@cesium/engine'; export default MapProjection; }
declare module "terriajs-cesium/Source/Core/Math" { import { Math } from '@cesium/engine'; export default Math; }
declare module "terriajs-cesium/Source/Core/Matrix2" { import { Matrix2 } from '@cesium/engine'; export default Matrix2; }
declare module "terriajs-cesium/Source/Core/Matrix3" { import { Matrix3 } from '@cesium/engine'; export default Matrix3; }
declare module "terriajs-cesium/Source/Core/Matrix4" { import { Matrix4 } from '@cesium/engine'; export default Matrix4; }
declare module "terriajs-cesium/Source/Core/mergeSort" { import { mergeSort } from '@cesium/engine'; export default mergeSort; }
declare module "terriajs-cesium/Source/Core/MorphWeightSpline" { import { MorphWeightSpline } from '@cesium/engine'; export default MorphWeightSpline; }
declare module "terriajs-cesium/Source/Core/NearFarScalar" { import { NearFarScalar } from '@cesium/engine'; export default NearFarScalar; }
declare module "terriajs-cesium/Source/Core/objectToQuery" { import { objectToQuery } from '@cesium/engine'; export default objectToQuery; }
declare module "terriajs-cesium/Source/Core/Occluder" { import { Occluder } from '@cesium/engine'; export default Occluder; }
declare module "terriajs-cesium/Source/Core/OpenCageGeocoderService" { import { OpenCageGeocoderService } from '@cesium/engine'; export default OpenCageGeocoderService; }
declare module "terriajs-cesium/Source/Core/OrientedBoundingBox" { import { OrientedBoundingBox } from '@cesium/engine'; export default OrientedBoundingBox; }
declare module "terriajs-cesium/Source/Core/OrthographicFrustum" { import { OrthographicFrustum } from '@cesium/engine'; export default OrthographicFrustum; }
declare module "terriajs-cesium/Source/Core/OrthographicOffCenterFrustum" { import { OrthographicOffCenterFrustum } from '@cesium/engine'; export default OrthographicOffCenterFrustum; }
declare module "terriajs-cesium/Source/Core/Packable" { import { Packable } from '@cesium/engine'; export default Packable; }
declare module "terriajs-cesium/Source/Core/PackableForInterpolation" { import { PackableForInterpolation } from '@cesium/engine'; export default PackableForInterpolation; }
declare module "terriajs-cesium/Source/Core/PeliasGeocoderService" { import { PeliasGeocoderService } from '@cesium/engine'; export default PeliasGeocoderService; }
declare module "terriajs-cesium/Source/Core/PerspectiveFrustum" { import { PerspectiveFrustum } from '@cesium/engine'; export default PerspectiveFrustum; }
declare module "terriajs-cesium/Source/Core/PerspectiveOffCenterFrustum" { import { PerspectiveOffCenterFrustum } from '@cesium/engine'; export default PerspectiveOffCenterFrustum; }
declare module "terriajs-cesium/Source/Core/PinBuilder" { import { PinBuilder } from '@cesium/engine'; export default PinBuilder; }
declare module "terriajs-cesium/Source/Core/PixelFormat" { import { PixelFormat } from '@cesium/engine'; export default PixelFormat; }
declare module "terriajs-cesium/Source/Core/Plane" { import { Plane } from '@cesium/engine'; export default Plane; }
declare module "terriajs-cesium/Source/Core/PlaneGeometry" { import { PlaneGeometry } from '@cesium/engine'; export default PlaneGeometry; }
declare module "terriajs-cesium/Source/Core/PlaneOutlineGeometry" { import { PlaneOutlineGeometry } from '@cesium/engine'; export default PlaneOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/pointInsideTriangle" { import { pointInsideTriangle } from '@cesium/engine'; export default pointInsideTriangle; }
declare module "terriajs-cesium/Source/Core/PolygonGeometry" { import { PolygonGeometry } from '@cesium/engine'; export default PolygonGeometry; }
declare module "terriajs-cesium/Source/Core/PolygonHierarchy" { import { PolygonHierarchy } from '@cesium/engine'; export default PolygonHierarchy; }
declare module "terriajs-cesium/Source/Core/PolygonOutlineGeometry" { import { PolygonOutlineGeometry } from '@cesium/engine'; export default PolygonOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/PolylineGeometry" { import { PolylineGeometry } from '@cesium/engine'; export default PolylineGeometry; }
declare module "terriajs-cesium/Source/Core/PolylineVolumeGeometry" { import { PolylineVolumeGeometry } from '@cesium/engine'; export default PolylineVolumeGeometry; }
declare module "terriajs-cesium/Source/Core/PolylineVolumeOutlineGeometry" { import { PolylineVolumeOutlineGeometry } from '@cesium/engine'; export default PolylineVolumeOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/PrimitiveType" { import { PrimitiveType } from '@cesium/engine'; export default PrimitiveType; }
declare module "terriajs-cesium/Source/Core/Proxy" { import { Proxy } from '@cesium/engine'; export default Proxy; }
declare module "terriajs-cesium/Source/Core/QuadraticRealPolynomial" { import { QuadraticRealPolynomial } from '@cesium/engine'; export default QuadraticRealPolynomial; }
declare module "terriajs-cesium/Source/Core/QuantizedMeshTerrainData" { import { QuantizedMeshTerrainData } from '@cesium/engine'; export default QuantizedMeshTerrainData; }
declare module "terriajs-cesium/Source/Core/QuarticRealPolynomial" { import { QuarticRealPolynomial } from '@cesium/engine'; export default QuarticRealPolynomial; }
declare module "terriajs-cesium/Source/Core/Quaternion" { import { Quaternion } from '@cesium/engine'; export default Quaternion; }
declare module "terriajs-cesium/Source/Core/QuaternionSpline" { import { QuaternionSpline } from '@cesium/engine'; export default QuaternionSpline; }
declare module "terriajs-cesium/Source/Core/queryToObject" { import { queryToObject } from '@cesium/engine'; export default queryToObject; }
declare module "terriajs-cesium/Source/Core/Queue" { import { Queue } from '@cesium/engine'; export default Queue; }
declare module "terriajs-cesium/Source/Core/Ray" { import { Ray } from '@cesium/engine'; export default Ray; }
declare module "terriajs-cesium/Source/Core/Rectangle" { import { Rectangle } from '@cesium/engine'; export default Rectangle; }
declare module "terriajs-cesium/Source/Core/RectangleGeometry" { import { RectangleGeometry } from '@cesium/engine'; export default RectangleGeometry; }
declare module "terriajs-cesium/Source/Core/RectangleOutlineGeometry" { import { RectangleOutlineGeometry } from '@cesium/engine'; export default RectangleOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/ReferenceFrame" { import { ReferenceFrame } from '@cesium/engine'; export default ReferenceFrame; }
declare module "terriajs-cesium/Source/Core/Request" { import { Request } from '@cesium/engine'; export default Request; }
declare module "terriajs-cesium/Source/Core/RequestErrorEvent" { import { RequestErrorEvent } from '@cesium/engine'; export default RequestErrorEvent; }
declare module "terriajs-cesium/Source/Core/RequestScheduler" { import { RequestScheduler } from '@cesium/engine'; export default RequestScheduler; }
declare module "terriajs-cesium/Source/Core/RequestState" { import { RequestState } from '@cesium/engine'; export default RequestState; }
declare module "terriajs-cesium/Source/Core/RequestType" { import { RequestType } from '@cesium/engine'; export default RequestType; }
declare module "terriajs-cesium/Source/Core/Resource" { import { Resource } from '@cesium/engine'; export default Resource; }
declare module "terriajs-cesium/Source/Core/RuntimeError" { import { RuntimeError } from '@cesium/engine'; export default RuntimeError; }
declare module "terriajs-cesium/Source/Core/sampleTerrain" { import { sampleTerrain } from '@cesium/engine'; export default sampleTerrain; }
declare module "terriajs-cesium/Source/Core/sampleTerrainMostDetailed" { import { sampleTerrainMostDetailed } from '@cesium/engine'; export default sampleTerrainMostDetailed; }
declare module "terriajs-cesium/Source/Core/ScreenSpaceEventHandler" { import { ScreenSpaceEventHandler } from '@cesium/engine'; export default ScreenSpaceEventHandler; }
declare module "terriajs-cesium/Source/Core/ScreenSpaceEventType" { import { ScreenSpaceEventType } from '@cesium/engine'; export default ScreenSpaceEventType; }
declare module "terriajs-cesium/Source/Core/ShowGeometryInstanceAttribute" { import { ShowGeometryInstanceAttribute } from '@cesium/engine'; export default ShowGeometryInstanceAttribute; }
declare module "terriajs-cesium/Source/Core/Simon1994PlanetaryPositions" { import { Simon1994PlanetaryPositions } from '@cesium/engine'; export default Simon1994PlanetaryPositions; }
declare module "terriajs-cesium/Source/Core/SimplePolylineGeometry" { import { SimplePolylineGeometry } from '@cesium/engine'; export default SimplePolylineGeometry; }
declare module "terriajs-cesium/Source/Core/SphereGeometry" { import { SphereGeometry } from '@cesium/engine'; export default SphereGeometry; }
declare module "terriajs-cesium/Source/Core/SphereOutlineGeometry" { import { SphereOutlineGeometry } from '@cesium/engine'; export default SphereOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/Spherical" { import { Spherical } from '@cesium/engine'; export default Spherical; }
declare module "terriajs-cesium/Source/Core/Spline" { import { Spline } from '@cesium/engine'; export default Spline; }
declare module "terriajs-cesium/Source/Core/SteppedSpline" { import { SteppedSpline } from '@cesium/engine'; export default SteppedSpline; }
declare module "terriajs-cesium/Source/Core/subdivideArray" { import { subdivideArray } from '@cesium/engine'; export default subdivideArray; }
declare module "terriajs-cesium/Source/Core/TaskProcessor" { import { TaskProcessor } from '@cesium/engine'; export default TaskProcessor; }
declare module "terriajs-cesium/Source/Core/TerrainData" { import { TerrainData } from '@cesium/engine'; export default TerrainData; }
declare module "terriajs-cesium/Source/Core/TerrainProvider" { import { TerrainProvider } from '@cesium/engine'; export default TerrainProvider; }
declare module "terriajs-cesium/Source/Core/TileAvailability" { import { TileAvailability } from '@cesium/engine'; export default TileAvailability; }
declare module "terriajs-cesium/Source/Core/TileProviderError" { import { TileProviderError } from '@cesium/engine'; export default TileProviderError; }
declare module "terriajs-cesium/Source/Core/TilingScheme" { import { TilingScheme } from '@cesium/engine'; export default TilingScheme; }
declare module "terriajs-cesium/Source/Core/TimeInterval" { import { TimeInterval } from '@cesium/engine'; export default TimeInterval; }
declare module "terriajs-cesium/Source/Core/TimeIntervalCollection" { import { TimeIntervalCollection } from '@cesium/engine'; export default TimeIntervalCollection; }
declare module "terriajs-cesium/Source/Core/TimeStandard" { import { TimeStandard } from '@cesium/engine'; export default TimeStandard; }
declare module "terriajs-cesium/Source/Core/Transforms" { import { Transforms } from '@cesium/engine'; export default Transforms; }
declare module "terriajs-cesium/Source/Core/TranslationRotationScale" { import { TranslationRotationScale } from '@cesium/engine'; export default TranslationRotationScale; }
declare module "terriajs-cesium/Source/Core/TridiagonalSystemSolver" { import { TridiagonalSystemSolver } from '@cesium/engine'; export default TridiagonalSystemSolver; }
declare module "terriajs-cesium/Source/Core/TrustedServers" { import { TrustedServers } from '@cesium/engine'; export default TrustedServers; }
declare module "terriajs-cesium/Source/Core/VertexFormat" { import { VertexFormat } from '@cesium/engine'; export default VertexFormat; }
declare module "terriajs-cesium/Source/Core/VideoSynchronizer" { import { VideoSynchronizer } from '@cesium/engine'; export default VideoSynchronizer; }
declare module "terriajs-cesium/Source/Core/Visibility" { import { Visibility } from '@cesium/engine'; export default Visibility; }
declare module "terriajs-cesium/Source/Core/VRTheWorldTerrainProvider" { import { VRTheWorldTerrainProvider } from '@cesium/engine'; export default VRTheWorldTerrainProvider; }
declare module "terriajs-cesium/Source/Core/WallGeometry" { import { WallGeometry } from '@cesium/engine'; export default WallGeometry; }
declare module "terriajs-cesium/Source/Core/WallOutlineGeometry" { import { WallOutlineGeometry } from '@cesium/engine'; export default WallOutlineGeometry; }
declare module "terriajs-cesium/Source/Core/WebGLConstants" { import { WebGLConstants } from '@cesium/engine'; export default WebGLConstants; }
declare module "terriajs-cesium/Source/Core/WebMercatorProjection" { import { WebMercatorProjection } from '@cesium/engine'; export default WebMercatorProjection; }
declare module "terriajs-cesium/Source/Core/WebMercatorTilingScheme" { import { WebMercatorTilingScheme } from '@cesium/engine'; export default WebMercatorTilingScheme; }
declare module "terriajs-cesium/Source/Core/WindingOrder" { import { WindingOrder } from '@cesium/engine'; export default WindingOrder; }
declare module "terriajs-cesium/Source/Core/writeTextToCanvas" { import { writeTextToCanvas } from '@cesium/engine'; export default writeTextToCanvas; }
declare module "terriajs-cesium/Source/DataSources/BillboardGraphics" { import { BillboardGraphics } from '@cesium/engine'; export default BillboardGraphics; }
declare module "terriajs-cesium/Source/DataSources/BillboardVisualizer" { import { BillboardVisualizer } from '@cesium/engine'; export default BillboardVisualizer; }
declare module "terriajs-cesium/Source/DataSources/BoxGeometryUpdater" { import { BoxGeometryUpdater } from '@cesium/engine'; export default BoxGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/BoxGraphics" { import { BoxGraphics } from '@cesium/engine'; export default BoxGraphics; }
declare module "terriajs-cesium/Source/DataSources/CallbackProperty" { import { CallbackProperty } from '@cesium/engine'; export default CallbackProperty; }
declare module "terriajs-cesium/Source/DataSources/Cesium3DTilesetGraphics" { import { Cesium3DTilesetGraphics } from '@cesium/engine'; export default Cesium3DTilesetGraphics; }
declare module "terriajs-cesium/Source/DataSources/Cesium3DTilesetVisualizer" { import { Cesium3DTilesetVisualizer } from '@cesium/engine'; export default Cesium3DTilesetVisualizer; }
declare module "terriajs-cesium/Source/DataSources/CheckerboardMaterialProperty" { import { CheckerboardMaterialProperty } from '@cesium/engine'; export default CheckerboardMaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/ColorMaterialProperty" { import { ColorMaterialProperty } from '@cesium/engine'; export default ColorMaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/CompositeEntityCollection" { import { CompositeEntityCollection } from '@cesium/engine'; export default CompositeEntityCollection; }
declare module "terriajs-cesium/Source/DataSources/CompositeMaterialProperty" { import { CompositeMaterialProperty } from '@cesium/engine'; export default CompositeMaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/CompositePositionProperty" { import { CompositePositionProperty } from '@cesium/engine'; export default CompositePositionProperty; }
declare module "terriajs-cesium/Source/DataSources/CompositeProperty" { import { CompositeProperty } from '@cesium/engine'; export default CompositeProperty; }
declare module "terriajs-cesium/Source/DataSources/ConstantPositionProperty" { import { ConstantPositionProperty } from '@cesium/engine'; export default ConstantPositionProperty; }
declare module "terriajs-cesium/Source/DataSources/ConstantProperty" { import { ConstantProperty } from '@cesium/engine'; export default ConstantProperty; }
declare module "terriajs-cesium/Source/DataSources/CorridorGeometryUpdater" { import { CorridorGeometryUpdater } from '@cesium/engine'; export default CorridorGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/CorridorGraphics" { import { CorridorGraphics } from '@cesium/engine'; export default CorridorGraphics; }
declare module "terriajs-cesium/Source/DataSources/CustomDataSource" { import { CustomDataSource } from '@cesium/engine'; export default CustomDataSource; }
declare module "terriajs-cesium/Source/DataSources/CylinderGeometryUpdater" { import { CylinderGeometryUpdater } from '@cesium/engine'; export default CylinderGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/CylinderGraphics" { import { CylinderGraphics } from '@cesium/engine'; export default CylinderGraphics; }
declare module "terriajs-cesium/Source/DataSources/CzmlDataSource" { import { CzmlDataSource } from '@cesium/engine'; export default CzmlDataSource; }
declare module "terriajs-cesium/Source/DataSources/DataSource" { import { DataSource } from '@cesium/engine'; export default DataSource; }
declare module "terriajs-cesium/Source/DataSources/DataSourceClock" { import { DataSourceClock } from '@cesium/engine'; export default DataSourceClock; }
declare module "terriajs-cesium/Source/DataSources/DataSourceCollection" { import { DataSourceCollection } from '@cesium/engine'; export default DataSourceCollection; }
declare module "terriajs-cesium/Source/DataSources/DataSourceDisplay" { import { DataSourceDisplay } from '@cesium/engine'; export default DataSourceDisplay; }
declare module "terriajs-cesium/Source/DataSources/EllipseGeometryUpdater" { import { EllipseGeometryUpdater } from '@cesium/engine'; export default EllipseGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/EllipseGraphics" { import { EllipseGraphics } from '@cesium/engine'; export default EllipseGraphics; }
declare module "terriajs-cesium/Source/DataSources/EllipsoidGeometryUpdater" { import { EllipsoidGeometryUpdater } from '@cesium/engine'; export default EllipsoidGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/EllipsoidGraphics" { import { EllipsoidGraphics } from '@cesium/engine'; export default EllipsoidGraphics; }
declare module "terriajs-cesium/Source/DataSources/Entity" { import { Entity } from '@cesium/engine'; export default Entity; }
declare module "terriajs-cesium/Source/DataSources/EntityCluster" { import { EntityCluster } from '@cesium/engine'; export default EntityCluster; }
declare module "terriajs-cesium/Source/DataSources/EntityCollection" { import { EntityCollection } from '@cesium/engine'; export default EntityCollection; }
declare module "terriajs-cesium/Source/DataSources/EntityView" { import { EntityView } from '@cesium/engine'; export default EntityView; }
declare module "terriajs-cesium/Source/DataSources/exportKml" { import { exportKml } from '@cesium/engine'; export default exportKml; }
declare module "terriajs-cesium/Source/DataSources/GeoJsonDataSource" { import { GeoJsonDataSource } from '@cesium/engine'; export default GeoJsonDataSource; }
declare module "terriajs-cesium/Source/DataSources/GeometryUpdater" { import { GeometryUpdater } from '@cesium/engine'; export default GeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/GeometryVisualizer" { import { GeometryVisualizer } from '@cesium/engine'; export default GeometryVisualizer; }
declare module "terriajs-cesium/Source/DataSources/GpxDataSource" { import { GpxDataSource } from '@cesium/engine'; export default GpxDataSource; }
declare module "terriajs-cesium/Source/DataSources/GridMaterialProperty" { import { GridMaterialProperty } from '@cesium/engine'; export default GridMaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/GroundGeometryUpdater" { import { GroundGeometryUpdater } from '@cesium/engine'; export default GroundGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/ImageMaterialProperty" { import { ImageMaterialProperty } from '@cesium/engine'; export default ImageMaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/KmlCamera" { import { KmlCamera } from '@cesium/engine'; export default KmlCamera; }
declare module "terriajs-cesium/Source/DataSources/KmlDataSource" { import { KmlDataSource } from '@cesium/engine'; export default KmlDataSource; }
declare module "terriajs-cesium/Source/DataSources/KmlLookAt" { import { KmlLookAt } from '@cesium/engine'; export default KmlLookAt; }
declare module "terriajs-cesium/Source/DataSources/KmlTour" { import { KmlTour } from '@cesium/engine'; export default KmlTour; }
declare module "terriajs-cesium/Source/DataSources/KmlTourFlyTo" { import { KmlTourFlyTo } from '@cesium/engine'; export default KmlTourFlyTo; }
declare module "terriajs-cesium/Source/DataSources/KmlTourWait" { import { KmlTourWait } from '@cesium/engine'; export default KmlTourWait; }
declare module "terriajs-cesium/Source/DataSources/LabelGraphics" { import { LabelGraphics } from '@cesium/engine'; export default LabelGraphics; }
declare module "terriajs-cesium/Source/DataSources/LabelVisualizer" { import { LabelVisualizer } from '@cesium/engine'; export default LabelVisualizer; }
declare module "terriajs-cesium/Source/DataSources/MaterialProperty" { import { MaterialProperty } from '@cesium/engine'; export default MaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/ModelGraphics" { import { ModelGraphics } from '@cesium/engine'; export default ModelGraphics; }
declare module "terriajs-cesium/Source/DataSources/ModelVisualizer" { import { ModelVisualizer } from '@cesium/engine'; export default ModelVisualizer; }
declare module "terriajs-cesium/Source/DataSources/NodeTransformationProperty" { import { NodeTransformationProperty } from '@cesium/engine'; export default NodeTransformationProperty; }
declare module "terriajs-cesium/Source/DataSources/PathGraphics" { import { PathGraphics } from '@cesium/engine'; export default PathGraphics; }
declare module "terriajs-cesium/Source/DataSources/PathVisualizer" { import { PathVisualizer } from '@cesium/engine'; export default PathVisualizer; }
declare module "terriajs-cesium/Source/DataSources/PlaneGeometryUpdater" { import { PlaneGeometryUpdater } from '@cesium/engine'; export default PlaneGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/PlaneGraphics" { import { PlaneGraphics } from '@cesium/engine'; export default PlaneGraphics; }
declare module "terriajs-cesium/Source/DataSources/PointGraphics" { import { PointGraphics } from '@cesium/engine'; export default PointGraphics; }
declare module "terriajs-cesium/Source/DataSources/PointVisualizer" { import { PointVisualizer } from '@cesium/engine'; export default PointVisualizer; }
declare module "terriajs-cesium/Source/DataSources/PolygonGeometryUpdater" { import { PolygonGeometryUpdater } from '@cesium/engine'; export default PolygonGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/PolygonGraphics" { import { PolygonGraphics } from '@cesium/engine'; export default PolygonGraphics; }
declare module "terriajs-cesium/Source/DataSources/PolylineArrowMaterialProperty" { import { PolylineArrowMaterialProperty } from '@cesium/engine'; export default PolylineArrowMaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/PolylineDashMaterialProperty" { import { PolylineDashMaterialProperty } from '@cesium/engine'; export default PolylineDashMaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/PolylineGeometryUpdater" { import { PolylineGeometryUpdater } from '@cesium/engine'; export default PolylineGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/PolylineGlowMaterialProperty" { import { PolylineGlowMaterialProperty } from '@cesium/engine'; export default PolylineGlowMaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/PolylineGraphics" { import { PolylineGraphics } from '@cesium/engine'; export default PolylineGraphics; }
declare module "terriajs-cesium/Source/DataSources/PolylineOutlineMaterialProperty" { import { PolylineOutlineMaterialProperty } from '@cesium/engine'; export default PolylineOutlineMaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/PolylineVisualizer" { import { PolylineVisualizer } from '@cesium/engine'; export default PolylineVisualizer; }
declare module "terriajs-cesium/Source/DataSources/PolylineVolumeGeometryUpdater" { import { PolylineVolumeGeometryUpdater } from '@cesium/engine'; export default PolylineVolumeGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/PolylineVolumeGraphics" { import { PolylineVolumeGraphics } from '@cesium/engine'; export default PolylineVolumeGraphics; }
declare module "terriajs-cesium/Source/DataSources/PositionProperty" { import { PositionProperty } from '@cesium/engine'; export default PositionProperty; }
declare module "terriajs-cesium/Source/DataSources/PositionPropertyArray" { import { PositionPropertyArray } from '@cesium/engine'; export default PositionPropertyArray; }
declare module "terriajs-cesium/Source/DataSources/Property" { import { Property } from '@cesium/engine'; export default Property; }
declare module "terriajs-cesium/Source/DataSources/PropertyArray" { import { PropertyArray } from '@cesium/engine'; export default PropertyArray; }
declare module "terriajs-cesium/Source/DataSources/PropertyBag" { import { PropertyBag } from '@cesium/engine'; export default PropertyBag; }
declare module "terriajs-cesium/Source/DataSources/RectangleGeometryUpdater" { import { RectangleGeometryUpdater } from '@cesium/engine'; export default RectangleGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/RectangleGraphics" { import { RectangleGraphics } from '@cesium/engine'; export default RectangleGraphics; }
declare module "terriajs-cesium/Source/DataSources/ReferenceProperty" { import { ReferenceProperty } from '@cesium/engine'; export default ReferenceProperty; }
declare module "terriajs-cesium/Source/DataSources/Rotation" { import { Rotation } from '@cesium/engine'; export default Rotation; }
declare module "terriajs-cesium/Source/DataSources/SampledPositionProperty" { import { SampledPositionProperty } from '@cesium/engine'; export default SampledPositionProperty; }
declare module "terriajs-cesium/Source/DataSources/SampledProperty" { import { SampledProperty } from '@cesium/engine'; export default SampledProperty; }
declare module "terriajs-cesium/Source/DataSources/StripeMaterialProperty" { import { StripeMaterialProperty } from '@cesium/engine'; export default StripeMaterialProperty; }
declare module "terriajs-cesium/Source/DataSources/StripeOrientation" { import { StripeOrientation } from '@cesium/engine'; export default StripeOrientation; }
declare module "terriajs-cesium/Source/DataSources/TimeIntervalCollectionPositionProperty" { import { TimeIntervalCollectionPositionProperty } from '@cesium/engine'; export default TimeIntervalCollectionPositionProperty; }
declare module "terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty" { import { TimeIntervalCollectionProperty } from '@cesium/engine'; export default TimeIntervalCollectionProperty; }
declare module "terriajs-cesium/Source/DataSources/VelocityOrientationProperty" { import { VelocityOrientationProperty } from '@cesium/engine'; export default VelocityOrientationProperty; }
declare module "terriajs-cesium/Source/DataSources/VelocityVectorProperty" { import { VelocityVectorProperty } from '@cesium/engine'; export default VelocityVectorProperty; }
declare module "terriajs-cesium/Source/DataSources/Visualizer" { import { Visualizer } from '@cesium/engine'; export default Visualizer; }
declare module "terriajs-cesium/Source/DataSources/WallGeometryUpdater" { import { WallGeometryUpdater } from '@cesium/engine'; export default WallGeometryUpdater; }
declare module "terriajs-cesium/Source/DataSources/WallGraphics" { import { WallGraphics } from '@cesium/engine'; export default WallGraphics; }
declare module "terriajs-cesium/Source/Renderer/PixelDatatype" { import { PixelDatatype } from '@cesium/engine'; export default PixelDatatype; }
declare module "terriajs-cesium/Source/Renderer/TextureMagnificationFilter" { import { TextureMagnificationFilter } from '@cesium/engine'; export default TextureMagnificationFilter; }
declare module "terriajs-cesium/Source/Renderer/TextureMinificationFilter" { import { TextureMinificationFilter } from '@cesium/engine'; export default TextureMinificationFilter; }
declare module "terriajs-cesium/Source/Scene/Appearance" { import { Appearance } from '@cesium/engine'; export default Appearance; }
declare module "terriajs-cesium/Source/Scene/ArcGisBaseMapType" { import { ArcGisBaseMapType } from '@cesium/engine'; export default ArcGisBaseMapType; }
declare module "terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider" { import { ArcGisMapServerImageryProvider } from '@cesium/engine'; export default ArcGisMapServerImageryProvider; }
declare module "terriajs-cesium/Source/Scene/ArcGisMapService" { import { ArcGisMapService } from '@cesium/engine'; export default ArcGisMapService; }
declare module "terriajs-cesium/Source/Scene/Axis" { import { Axis } from '@cesium/engine'; export default Axis; }
declare module "terriajs-cesium/Source/Scene/Billboard" { import { Billboard } from '@cesium/engine'; export default Billboard; }
declare module "terriajs-cesium/Source/Scene/BillboardCollection" { import { BillboardCollection } from '@cesium/engine'; export default BillboardCollection; }
declare module "terriajs-cesium/Source/Scene/BingMapsImageryProvider" { import { BingMapsImageryProvider } from '@cesium/engine'; export default BingMapsImageryProvider; }
declare module "terriajs-cesium/Source/Scene/BingMapsStyle" { import { BingMapsStyle } from '@cesium/engine'; export default BingMapsStyle; }
declare module "terriajs-cesium/Source/Scene/BlendEquation" { import { BlendEquation } from '@cesium/engine'; export default BlendEquation; }
declare module "terriajs-cesium/Source/Scene/BlendFunction" { import { BlendFunction } from '@cesium/engine'; export default BlendFunction; }
declare module "terriajs-cesium/Source/Scene/BlendingState" { import { BlendingState } from '@cesium/engine'; export default BlendingState; }
declare module "terriajs-cesium/Source/Scene/BlendOption" { import { BlendOption } from '@cesium/engine'; export default BlendOption; }
declare module "terriajs-cesium/Source/Scene/BoxEmitter" { import { BoxEmitter } from '@cesium/engine'; export default BoxEmitter; }
declare module "terriajs-cesium/Source/Scene/Camera" { import { Camera } from '@cesium/engine'; export default Camera; }
declare module "terriajs-cesium/Source/Scene/CameraEventAggregator" { import { CameraEventAggregator } from '@cesium/engine'; export default CameraEventAggregator; }
declare module "terriajs-cesium/Source/Scene/CameraEventType" { import { CameraEventType } from '@cesium/engine'; export default CameraEventType; }
declare module "terriajs-cesium/Source/Scene/Cesium3DTile" { import { Cesium3DTile } from '@cesium/engine'; export default Cesium3DTile; }
declare module "terriajs-cesium/Source/Scene/Cesium3DTileColorBlendMode" { import { Cesium3DTileColorBlendMode } from '@cesium/engine'; export default Cesium3DTileColorBlendMode; }
declare module "terriajs-cesium/Source/Scene/Cesium3DTileContent" { import { Cesium3DTileContent } from '@cesium/engine'; export default Cesium3DTileContent; }
declare module "terriajs-cesium/Source/Scene/Cesium3DTileFeature" { import { Cesium3DTileFeature } from '@cesium/engine'; export default Cesium3DTileFeature; }
declare module "terriajs-cesium/Source/Scene/Cesium3DTilePointFeature" { import { Cesium3DTilePointFeature } from '@cesium/engine'; export default Cesium3DTilePointFeature; }
declare module "terriajs-cesium/Source/Scene/Cesium3DTileset" { import { Cesium3DTileset } from '@cesium/engine'; export default Cesium3DTileset; }
declare module "terriajs-cesium/Source/Scene/Cesium3DTileStyle" { import { Cesium3DTileStyle } from '@cesium/engine'; export default Cesium3DTileStyle; }
declare module "terriajs-cesium/Source/Scene/Cesium3DTilesVoxelProvider" { import { Cesium3DTilesVoxelProvider } from '@cesium/engine'; export default Cesium3DTilesVoxelProvider; }
declare module "terriajs-cesium/Source/Scene/CircleEmitter" { import { CircleEmitter } from '@cesium/engine'; export default CircleEmitter; }
declare module "terriajs-cesium/Source/Scene/ClassificationPrimitive" { import { ClassificationPrimitive } from '@cesium/engine'; export default ClassificationPrimitive; }
declare module "terriajs-cesium/Source/Scene/ClassificationType" { import { ClassificationType } from '@cesium/engine'; export default ClassificationType; }
declare module "terriajs-cesium/Source/Scene/ClippingPlane" { import { ClippingPlane } from '@cesium/engine'; export default ClippingPlane; }
declare module "terriajs-cesium/Source/Scene/ClippingPlaneCollection" { import { ClippingPlaneCollection } from '@cesium/engine'; export default ClippingPlaneCollection; }
declare module "terriajs-cesium/Source/Scene/CloudCollection" { import { CloudCollection } from '@cesium/engine'; export default CloudCollection; }
declare module "terriajs-cesium/Source/Scene/CloudType" { import { CloudType } from '@cesium/engine'; export default CloudType; }
declare module "terriajs-cesium/Source/Scene/ColorBlendMode" { import { ColorBlendMode } from '@cesium/engine'; export default ColorBlendMode; }
declare module "terriajs-cesium/Source/Scene/ConditionsExpression" { import { ConditionsExpression } from '@cesium/engine'; export default ConditionsExpression; }
declare module "terriajs-cesium/Source/Scene/ConeEmitter" { import { ConeEmitter } from '@cesium/engine'; export default ConeEmitter; }
declare module "terriajs-cesium/Source/Scene/createElevationBandMaterial" { import { createElevationBandMaterial } from '@cesium/engine'; export default createElevationBandMaterial; }
declare module "terriajs-cesium/Source/Scene/createGooglePhotorealistic3DTileset" { import { createGooglePhotorealistic3DTileset } from '@cesium/engine'; export default createGooglePhotorealistic3DTileset; }
declare module "terriajs-cesium/Source/Scene/createOsmBuildingsAsync" { import { createOsmBuildingsAsync } from '@cesium/engine'; export default createOsmBuildingsAsync; }
declare module "terriajs-cesium/Source/Scene/createTangentSpaceDebugPrimitive" { import { createTangentSpaceDebugPrimitive } from '@cesium/engine'; export default createTangentSpaceDebugPrimitive; }
declare module "terriajs-cesium/Source/Scene/createWorldImageryAsync" { import { createWorldImageryAsync } from '@cesium/engine'; export default createWorldImageryAsync; }
declare module "terriajs-cesium/Source/Scene/CreditDisplay" { import { CreditDisplay } from '@cesium/engine'; export default CreditDisplay; }
declare module "terriajs-cesium/Source/Scene/CullFace" { import { CullFace } from '@cesium/engine'; export default CullFace; }
declare module "terriajs-cesium/Source/Scene/CumulusCloud" { import { CumulusCloud } from '@cesium/engine'; export default CumulusCloud; }
declare module "terriajs-cesium/Source/Scene/DebugAppearance" { import { DebugAppearance } from '@cesium/engine'; export default DebugAppearance; }
declare module "terriajs-cesium/Source/Scene/DebugCameraPrimitive" { import { DebugCameraPrimitive } from '@cesium/engine'; export default DebugCameraPrimitive; }
declare module "terriajs-cesium/Source/Scene/DebugModelMatrixPrimitive" { import { DebugModelMatrixPrimitive } from '@cesium/engine'; export default DebugModelMatrixPrimitive; }
declare module "terriajs-cesium/Source/Scene/DepthFunction" { import { DepthFunction } from '@cesium/engine'; export default DepthFunction; }
declare module "terriajs-cesium/Source/Scene/DirectionalLight" { import { DirectionalLight } from '@cesium/engine'; export default DirectionalLight; }
declare module "terriajs-cesium/Source/Scene/DiscardEmptyTileImagePolicy" { import { DiscardEmptyTileImagePolicy } from '@cesium/engine'; export default DiscardEmptyTileImagePolicy; }
declare module "terriajs-cesium/Source/Scene/DiscardMissingTileImagePolicy" { import { DiscardMissingTileImagePolicy } from '@cesium/engine'; export default DiscardMissingTileImagePolicy; }
declare module "terriajs-cesium/Source/Scene/EllipsoidSurfaceAppearance" { import { EllipsoidSurfaceAppearance } from '@cesium/engine'; export default EllipsoidSurfaceAppearance; }
declare module "terriajs-cesium/Source/Scene/Expression" { import { Expression } from '@cesium/engine'; export default Expression; }
declare module "terriajs-cesium/Source/Scene/Fog" { import { Fog } from '@cesium/engine'; export default Fog; }
declare module "terriajs-cesium/Source/Scene/FrameRateMonitor" { import { FrameRateMonitor } from '@cesium/engine'; export default FrameRateMonitor; }
declare module "terriajs-cesium/Source/Scene/GetFeatureInfoFormat" { import { GetFeatureInfoFormat } from '@cesium/engine'; export default GetFeatureInfoFormat; }
declare module "terriajs-cesium/Source/Scene/Globe" { import { Globe } from '@cesium/engine'; export default Globe; }
declare module "terriajs-cesium/Source/Scene/GlobeTranslucency" { import { GlobeTranslucency } from '@cesium/engine'; export default GlobeTranslucency; }
declare module "terriajs-cesium/Source/Scene/GltfPipeline/removeExtension" { import { removeExtension } from '@cesium/engine'; export default removeExtension; }
declare module "terriajs-cesium/Source/Scene/GoogleEarthEnterpriseImageryProvider" { import { GoogleEarthEnterpriseImageryProvider } from '@cesium/engine'; export default GoogleEarthEnterpriseImageryProvider; }
declare module "terriajs-cesium/Source/Scene/GoogleEarthEnterpriseMapsProvider" { import { GoogleEarthEnterpriseMapsProvider } from '@cesium/engine'; export default GoogleEarthEnterpriseMapsProvider; }
declare module "terriajs-cesium/Source/Scene/GridImageryProvider" { import { GridImageryProvider } from '@cesium/engine'; export default GridImageryProvider; }
declare module "terriajs-cesium/Source/Scene/GroundPolylinePrimitive" { import { GroundPolylinePrimitive } from '@cesium/engine'; export default GroundPolylinePrimitive; }
declare module "terriajs-cesium/Source/Scene/GroundPrimitive" { import { GroundPrimitive } from '@cesium/engine'; export default GroundPrimitive; }
declare module "terriajs-cesium/Source/Scene/HeightReference" { import { HeightReference } from '@cesium/engine'; export default HeightReference; }
declare module "terriajs-cesium/Source/Scene/HorizontalOrigin" { import { HorizontalOrigin } from '@cesium/engine'; export default HorizontalOrigin; }
declare module "terriajs-cesium/Source/Scene/I3SDataProvider" { import { I3SDataProvider } from '@cesium/engine'; export default I3SDataProvider; }
declare module "terriajs-cesium/Source/Scene/I3SFeature" { import { I3SFeature } from '@cesium/engine'; export default I3SFeature; }
declare module "terriajs-cesium/Source/Scene/I3SField" { import { I3SField } from '@cesium/engine'; export default I3SField; }
declare module "terriajs-cesium/Source/Scene/I3SGeometry" { import { I3SGeometry } from '@cesium/engine'; export default I3SGeometry; }
declare module "terriajs-cesium/Source/Scene/I3SLayer" { import { I3SLayer } from '@cesium/engine'; export default I3SLayer; }
declare module "terriajs-cesium/Source/Scene/I3SNode" { import { I3SNode } from '@cesium/engine'; export default I3SNode; }
declare module "terriajs-cesium/Source/Scene/ImageBasedLighting" { import { ImageBasedLighting } from '@cesium/engine'; export default ImageBasedLighting; }
declare module "terriajs-cesium/Source/Scene/ImageryLayer" { import { ImageryLayer } from '@cesium/engine'; export default ImageryLayer; }
declare module "terriajs-cesium/Source/Scene/ImageryLayerCollection" { import { ImageryLayerCollection } from '@cesium/engine'; export default ImageryLayerCollection; }
declare module "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo" { import { ImageryLayerFeatureInfo } from '@cesium/engine'; export default ImageryLayerFeatureInfo; }
declare module "terriajs-cesium/Source/Scene/ImageryProvider" { import { ImageryProvider } from '@cesium/engine'; export default ImageryProvider; }
declare module "terriajs-cesium/Source/Scene/IonImageryProvider" { import { IonImageryProvider } from '@cesium/engine'; export default IonImageryProvider; }
declare module "terriajs-cesium/Source/Scene/IonWorldImageryStyle" { import { IonWorldImageryStyle } from '@cesium/engine'; export default IonWorldImageryStyle; }
declare module "terriajs-cesium/Source/Scene/Label" { import { Label } from '@cesium/engine'; export default Label; }
declare module "terriajs-cesium/Source/Scene/LabelCollection" { import { LabelCollection } from '@cesium/engine'; export default LabelCollection; }
declare module "terriajs-cesium/Source/Scene/LabelStyle" { import { LabelStyle } from '@cesium/engine'; export default LabelStyle; }
declare module "terriajs-cesium/Source/Scene/Light" { import { Light } from '@cesium/engine'; export default Light; }
declare module "terriajs-cesium/Source/Scene/MapboxImageryProvider" { import { MapboxImageryProvider } from '@cesium/engine'; export default MapboxImageryProvider; }
declare module "terriajs-cesium/Source/Scene/MapboxStyleImageryProvider" { import { MapboxStyleImageryProvider } from '@cesium/engine'; export default MapboxStyleImageryProvider; }
declare module "terriajs-cesium/Source/Scene/MapMode2D" { import { MapMode2D } from '@cesium/engine'; export default MapMode2D; }
declare module "terriajs-cesium/Source/Scene/Material" { import { Material } from '@cesium/engine'; export default Material; }
declare module "terriajs-cesium/Source/Scene/MaterialAppearance" { import { MaterialAppearance } from '@cesium/engine'; export default MaterialAppearance; }
declare module "terriajs-cesium/Source/Scene/MetadataClass" { import { MetadataClass } from '@cesium/engine'; export default MetadataClass; }
declare module "terriajs-cesium/Source/Scene/MetadataClassProperty" { import { MetadataClassProperty } from '@cesium/engine'; export default MetadataClassProperty; }
declare module "terriajs-cesium/Source/Scene/MetadataComponentType" { import { MetadataComponentType } from '@cesium/engine'; export default MetadataComponentType; }
declare module "terriajs-cesium/Source/Scene/MetadataEnum" { import { MetadataEnum } from '@cesium/engine'; export default MetadataEnum; }
declare module "terriajs-cesium/Source/Scene/MetadataEnumValue" { import { MetadataEnumValue } from '@cesium/engine'; export default MetadataEnumValue; }
declare module "terriajs-cesium/Source/Scene/MetadataSchema" { import { MetadataSchema } from '@cesium/engine'; export default MetadataSchema; }
declare module "terriajs-cesium/Source/Scene/MetadataType" { import { MetadataType } from '@cesium/engine'; export default MetadataType; }
declare module "terriajs-cesium/Source/Scene/Model/CustomShader" { import { CustomShader } from '@cesium/engine'; export default CustomShader; }
declare module "terriajs-cesium/Source/Scene/Model/CustomShaderMode" { import { CustomShaderMode } from '@cesium/engine'; export default CustomShaderMode; }
declare module "terriajs-cesium/Source/Scene/Model/CustomShaderTranslucencyMode" { import { CustomShaderTranslucencyMode } from '@cesium/engine'; export default CustomShaderTranslucencyMode; }
declare module "terriajs-cesium/Source/Scene/Model/LightingModel" { import { LightingModel } from '@cesium/engine'; export default LightingModel; }
declare module "terriajs-cesium/Source/Scene/Model/Model" { import { Model } from '@cesium/engine'; export default Model; }
declare module "terriajs-cesium/Source/Scene/Model/ModelAnimation" { import { ModelAnimation } from '@cesium/engine'; export default ModelAnimation; }
declare module "terriajs-cesium/Source/Scene/Model/ModelAnimationCollection" { import { ModelAnimationCollection } from '@cesium/engine'; export default ModelAnimationCollection; }
declare module "terriajs-cesium/Source/Scene/Model/ModelFeature" { import { ModelFeature } from '@cesium/engine'; export default ModelFeature; }
declare module "terriajs-cesium/Source/Scene/Model/ModelNode" { import { ModelNode } from '@cesium/engine'; export default ModelNode; }
declare module "terriajs-cesium/Source/Scene/Model/TextureUniform" { import { TextureUniform } from '@cesium/engine'; export default TextureUniform; }
declare module "terriajs-cesium/Source/Scene/Model/UniformType" { import { UniformType } from '@cesium/engine'; export default UniformType; }
declare module "terriajs-cesium/Source/Scene/Model/VaryingType" { import { VaryingType } from '@cesium/engine'; export default VaryingType; }
declare module "terriajs-cesium/Source/Scene/ModelAnimationLoop" { import { ModelAnimationLoop } from '@cesium/engine'; export default ModelAnimationLoop; }
declare module "terriajs-cesium/Source/Scene/Moon" { import { Moon } from '@cesium/engine'; export default Moon; }
declare module "terriajs-cesium/Source/Scene/NeverTileDiscardPolicy" { import { NeverTileDiscardPolicy } from '@cesium/engine'; export default NeverTileDiscardPolicy; }
declare module "terriajs-cesium/Source/Scene/OpenStreetMapImageryProvider" { import { OpenStreetMapImageryProvider } from '@cesium/engine'; export default OpenStreetMapImageryProvider; }
declare module "terriajs-cesium/Source/Scene/Particle" { import { Particle } from '@cesium/engine'; export default Particle; }
declare module "terriajs-cesium/Source/Scene/ParticleBurst" { import { ParticleBurst } from '@cesium/engine'; export default ParticleBurst; }
declare module "terriajs-cesium/Source/Scene/ParticleEmitter" { import { ParticleEmitter } from '@cesium/engine'; export default ParticleEmitter; }
declare module "terriajs-cesium/Source/Scene/ParticleSystem" { import { ParticleSystem } from '@cesium/engine'; export default ParticleSystem; }
declare module "terriajs-cesium/Source/Scene/PerInstanceColorAppearance" { import { PerInstanceColorAppearance } from '@cesium/engine'; export default PerInstanceColorAppearance; }
declare module "terriajs-cesium/Source/Scene/PointCloudShading" { import { PointCloudShading } from '@cesium/engine'; export default PointCloudShading; }
declare module "terriajs-cesium/Source/Scene/PointPrimitive" { import { PointPrimitive } from '@cesium/engine'; export default PointPrimitive; }
declare module "terriajs-cesium/Source/Scene/PointPrimitiveCollection" { import { PointPrimitiveCollection } from '@cesium/engine'; export default PointPrimitiveCollection; }
declare module "terriajs-cesium/Source/Scene/Polyline" { import { Polyline } from '@cesium/engine'; export default Polyline; }
declare module "terriajs-cesium/Source/Scene/PolylineCollection" { import { PolylineCollection } from '@cesium/engine'; export default PolylineCollection; }
declare module "terriajs-cesium/Source/Scene/PolylineColorAppearance" { import { PolylineColorAppearance } from '@cesium/engine'; export default PolylineColorAppearance; }
declare module "terriajs-cesium/Source/Scene/PolylineMaterialAppearance" { import { PolylineMaterialAppearance } from '@cesium/engine'; export default PolylineMaterialAppearance; }
declare module "terriajs-cesium/Source/Scene/PostProcessStage" { import { PostProcessStage } from '@cesium/engine'; export default PostProcessStage; }
declare module "terriajs-cesium/Source/Scene/PostProcessStageCollection" { import { PostProcessStageCollection } from '@cesium/engine'; export default PostProcessStageCollection; }
declare module "terriajs-cesium/Source/Scene/PostProcessStageComposite" { import { PostProcessStageComposite } from '@cesium/engine'; export default PostProcessStageComposite; }
declare module "terriajs-cesium/Source/Scene/PostProcessStageLibrary" { import { PostProcessStageLibrary } from '@cesium/engine'; export default PostProcessStageLibrary; }
declare module "terriajs-cesium/Source/Scene/PostProcessStageSampleMode" { import { PostProcessStageSampleMode } from '@cesium/engine'; export default PostProcessStageSampleMode; }
declare module "terriajs-cesium/Source/Scene/Primitive" { import { Primitive } from '@cesium/engine'; export default Primitive; }
declare module "terriajs-cesium/Source/Scene/PrimitiveCollection" { import { PrimitiveCollection } from '@cesium/engine'; export default PrimitiveCollection; }
declare module "terriajs-cesium/Source/Scene/Scene" { import { Scene } from '@cesium/engine'; export default Scene; }
declare module "terriajs-cesium/Source/Scene/SceneMode" { import { SceneMode } from '@cesium/engine'; export default SceneMode; }
declare module "terriajs-cesium/Source/Scene/SceneTransforms" { import { SceneTransforms } from '@cesium/engine'; export default SceneTransforms; }
declare module "terriajs-cesium/Source/Scene/ScreenSpaceCameraController" { import { ScreenSpaceCameraController } from '@cesium/engine'; export default ScreenSpaceCameraController; }
declare module "terriajs-cesium/Source/Scene/ShadowMap" { import { ShadowMap } from '@cesium/engine'; export default ShadowMap; }
declare module "terriajs-cesium/Source/Scene/ShadowMode" { import { ShadowMode } from '@cesium/engine'; export default ShadowMode; }
declare module "terriajs-cesium/Source/Scene/SingleTileImageryProvider" { import { SingleTileImageryProvider } from '@cesium/engine'; export default SingleTileImageryProvider; }
declare module "terriajs-cesium/Source/Scene/SkyAtmosphere" { import { SkyAtmosphere } from '@cesium/engine'; export default SkyAtmosphere; }
declare module "terriajs-cesium/Source/Scene/SkyBox" { import { SkyBox } from '@cesium/engine'; export default SkyBox; }
declare module "terriajs-cesium/Source/Scene/SphereEmitter" { import { SphereEmitter } from '@cesium/engine'; export default SphereEmitter; }
declare module "terriajs-cesium/Source/Scene/SplitDirection" { import { SplitDirection } from '@cesium/engine'; export default SplitDirection; }
declare module "terriajs-cesium/Source/Scene/StencilFunction" { import { StencilFunction } from '@cesium/engine'; export default StencilFunction; }
declare module "terriajs-cesium/Source/Scene/StencilOperation" { import { StencilOperation } from '@cesium/engine'; export default StencilOperation; }
declare module "terriajs-cesium/Source/Scene/StyleExpression" { import { StyleExpression } from '@cesium/engine'; export default StyleExpression; }
declare module "terriajs-cesium/Source/Scene/Sun" { import { Sun } from '@cesium/engine'; export default Sun; }
declare module "terriajs-cesium/Source/Scene/SunLight" { import { SunLight } from '@cesium/engine'; export default SunLight; }
declare module "terriajs-cesium/Source/Scene/Terrain" { import { Terrain } from '@cesium/engine'; export default Terrain; }
declare module "terriajs-cesium/Source/Scene/TileCoordinatesImageryProvider" { import { TileCoordinatesImageryProvider } from '@cesium/engine'; export default TileCoordinatesImageryProvider; }
declare module "terriajs-cesium/Source/Scene/TileDiscardPolicy" { import { TileDiscardPolicy } from '@cesium/engine'; export default TileDiscardPolicy; }
declare module "terriajs-cesium/Source/Scene/TileMapServiceImageryProvider" { import { TileMapServiceImageryProvider } from '@cesium/engine'; export default TileMapServiceImageryProvider; }
declare module "terriajs-cesium/Source/Scene/TimeDynamicImagery" { import { TimeDynamicImagery } from '@cesium/engine'; export default TimeDynamicImagery; }
declare module "terriajs-cesium/Source/Scene/TimeDynamicPointCloud" { import { TimeDynamicPointCloud } from '@cesium/engine'; export default TimeDynamicPointCloud; }
declare module "terriajs-cesium/Source/Scene/UrlTemplateImageryProvider" { import { UrlTemplateImageryProvider } from '@cesium/engine'; export default UrlTemplateImageryProvider; }
declare module "terriajs-cesium/Source/Scene/VerticalOrigin" { import { VerticalOrigin } from '@cesium/engine'; export default VerticalOrigin; }
declare module "terriajs-cesium/Source/Scene/ViewportQuad" { import { ViewportQuad } from '@cesium/engine'; export default ViewportQuad; }
declare module "terriajs-cesium/Source/Scene/VoxelPrimitive" { import { VoxelPrimitive } from '@cesium/engine'; export default VoxelPrimitive; }
declare module "terriajs-cesium/Source/Scene/VoxelProvider" { import { VoxelProvider } from '@cesium/engine'; export default VoxelProvider; }
declare module "terriajs-cesium/Source/Scene/VoxelShapeType" { import { VoxelShapeType } from '@cesium/engine'; export default VoxelShapeType; }
declare module "terriajs-cesium/Source/Scene/WebMapServiceImageryProvider" { import { WebMapServiceImageryProvider } from '@cesium/engine'; export default WebMapServiceImageryProvider; }
declare module "terriajs-cesium/Source/Scene/WebMapTileServiceImageryProvider" { import { WebMapTileServiceImageryProvider } from '@cesium/engine'; export default WebMapTileServiceImageryProvider; }
declare module "terriajs-cesium/Source/Widget/CesiumWidget" { import { CesiumWidget } from '@cesium/engine'; export default CesiumWidget; }
// End Generated Declarations
