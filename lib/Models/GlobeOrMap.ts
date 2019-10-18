import { Feature as GeoJSONFeature, Position } from "geojson";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import clone from "terriajs-cesium/Source/Core/clone";
import Color from "terriajs-cesium/Source/Core/Color";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";

import isDefined from "../Core/isDefined";
import featureDataToGeoJson from "../Map/featureDataToGeoJson";
import MapboxVectorTileImageryProvider from "../Map/MapboxVectorTileImageryProvider";
import CommonStrata from "./CommonStrata";
import Feature from "./Feature";
import GeoJsonCatalogItem from "./GeoJsonCatalogItem";
import Mappable from "./Mappable";
import Terria from "./Terria";
import CameraView from "./CameraView";

export default abstract class GlobeOrMap {
    abstract readonly type: string;
    abstract readonly terria: Terria;
    protected static _featureHighlightName = "___$FeatureHighlight&__";

    private _removeHighlightCallback?: () => void;
    private _highlightPromise: Promise<void> | undefined;
    protected supportsPolylinesOnTerrain?: boolean;

    abstract destroy(): void;
    abstract zoomTo(
        viewOrExtent: CameraView | Cesium.Rectangle | Mappable,
        flightDurationSeconds: number
    ): void;
    abstract getCurrentCameraView(): CameraView;

    /* Gets the current container element.
     */
    abstract getContainer(): Element | undefined;

    abstract pauseMapInteraction(): void;
    abstract resumeMapInteraction(): void;

    abstract notifyRepaintRequired(): void;

    /**
     * Creates a {@see Feature} (based on an {@see Entity}) from a {@see ImageryLayerFeatureInfo}.
     * @param imageryFeature The imagery layer feature for which to create an entity-based feature.
     * @return The created feature.
     */
    protected _createFeatureFromImageryLayerFeature(
        imageryFeature: ImageryLayerFeatureInfo
    ) {
        const feature = new Feature({
            id: imageryFeature.name
        });
        feature.name = imageryFeature.name;
        (<any>feature).description = imageryFeature.description; // already defined by the new Entity
        feature.properties = (<any>imageryFeature).properties;
        (<any>feature).data = imageryFeature.data;

        (<any>feature).imageryLayer = (<any>imageryFeature).imageryLayer;
        feature.position = Ellipsoid.WGS84.cartographicToCartesian(
            imageryFeature.position
        );
        (<any>feature).coords = (<any>imageryFeature).coords;

        return feature;
    }

    /**
     * Returns the side of the splitter the `position` lies on.
     *
     * @param The screen position.
     * @return The side of the splitter on which `position` lies.
     */
    protected _getSplitterSideForScreenPosition(
        position: Cartesian2 | Cartesian3
    ): ImagerySplitDirection | undefined {
        const container = this.terria.currentViewer.getContainer();
        if (!isDefined(container)) {
            return;
        }

        const splitterX = container.clientWidth * this.terria.splitPosition;
        if (position.x <= splitterX) {
            return ImagerySplitDirection.LEFT;
        } else {
            return ImagerySplitDirection.RIGHT;
        }
    }

    abstract _addVectorTileHighlight(
        imageryProvider: MapboxVectorTileImageryProvider,
        rectangle: Cesium.Rectangle
    ): () => void;

    _highlightFeature(feature: Feature | undefined) {
        if (isDefined(this._removeHighlightCallback)) {
            this._removeHighlightCallback();
            this._removeHighlightCallback = undefined;
            this._highlightPromise = undefined;
        }

        if (isDefined(feature)) {
            let hasGeometry = false;

            if (isDefined(feature._cesium3DTileFeature)) {
                const originalColor = feature._cesium3DTileFeature.color;
                feature._cesium3DTileFeature.color = Color.YELLOW;
                this._removeHighlightCallback = function() {
                    if (isDefined(feature._cesium3DTileFeature)) {
                        feature._cesium3DTileFeature.color = originalColor;
                    }
                };
            }

            if (isDefined(feature.polygon)) {
                hasGeometry = true;

                const cesiumPolygon = feature.cesiumEntity || feature;

                const polygonOutline = cesiumPolygon.polygon.outline;
                const polygonOutlineColor = cesiumPolygon.polygon.outlineColor;
                const polygonMaterial = cesiumPolygon.polygon.material;

                (<any>cesiumPolygon).polygon.outline = true;
                cesiumPolygon.polygon.outlineColor = Color.fromCssColorString(
                    this.terria.baseMapContrastColor
                );
                cesiumPolygon.polygon.material = Color.fromCssColorString(
                    this.terria.baseMapContrastColor
                ).withAlpha(0.75);

                this._removeHighlightCallback = function() {
                    cesiumPolygon.polygon.outline = polygonOutline;
                    cesiumPolygon.polygon.outlineColor = polygonOutlineColor;
                    cesiumPolygon.polygon.material = polygonMaterial;
                };
            }

            if (isDefined(feature.polyline)) {
                hasGeometry = true;

                const cesiumPolyline = feature.cesiumEntity || feature;

                const polylineMaterial = cesiumPolyline.polyline.material;
                const polylineWidth = cesiumPolyline.polyline.width;

                (<any>(
                    cesiumPolyline
                )).polyline.material = Color.fromCssColorString(
                    this.terria.baseMapContrastColor
                );
                cesiumPolyline.polyline.width = 2;

                this._removeHighlightCallback = function() {
                    cesiumPolyline.polyline.material = polylineMaterial;
                    cesiumPolyline.polyline.width = polylineWidth;
                };
            }

            if (!hasGeometry) {
                if (
                    feature.imageryLayer &&
                    feature.imageryLayer.imageryProvider instanceof
                        MapboxVectorTileImageryProvider
                ) {
                    const highlightImageryProvider = feature.imageryLayer.imageryProvider.createHighlightImageryProvider(
                        feature.data.id
                    );
                    this._removeHighlightCallback = this.terria.currentViewer._addVectorTileHighlight(
                        highlightImageryProvider,
                        feature.imageryLayer.imageryProvider.rectangle
                    );
                } else if (
                    !isDefined(this.supportsPolylinesOnTerrain) ||
                    this.supportsPolylinesOnTerrain
                ) {
                    let geoJson:
                        | GeoJSONFeature
                        | undefined = featureDataToGeoJson(feature.data);

                    // Show geometry associated with the feature.
                    // Don't show points; the targeting cursor is sufficient.
                    if (
                        geoJson &&
                        geoJson.geometry &&
                        geoJson.geometry.type !== "Point"
                    ) {
                        // Turn Polygons into MultiLineStrings, because we're only showing the outline.
                        if (
                            geoJson.geometry.type === "Polygon" ||
                            geoJson.geometry.type === "MultiPolygon"
                        ) {
                            geoJson = <GeoJSONFeature>clone(geoJson);
                            geoJson.geometry = clone(geoJson.geometry);

                            if (geoJson.geometry.type === "MultiPolygon") {
                                const newCoordinates: Position[][] = [];
                                geoJson.geometry.coordinates.forEach(
                                    polygon => {
                                        newCoordinates.push(...polygon);
                                    }
                                );
                                (<any>(
                                    geoJson
                                )).geometry.coordinates = newCoordinates;
                            }

                            geoJson.geometry.type = "MultiLineString";
                        }

                        const catalogItem = new GeoJsonCatalogItem(
                            GlobeOrMap._featureHighlightName,
                            this.terria
                        );

                        catalogItem.setTrait(
                            CommonStrata.user,
                            "name",
                            GlobeOrMap._featureHighlightName
                        );
                        catalogItem.setTrait(CommonStrata.user, "geoJsonData", <
                            any
                        >geoJson);
                        catalogItem.setTrait(
                            CommonStrata.user,
                            "clampToGround",
                            true
                        );
                        catalogItem.setTrait(CommonStrata.user, "style", {
                            "stroke-width": 2,
                            stroke: this.terria.baseMapContrastColor,
                            fill: undefined,
                            "fill-opacity": 0,
                            "marker-color": this.terria.baseMapContrastColor,
                            "marker-size": undefined,
                            "marker-symbol": undefined,
                            "marker-opacity": undefined,
                            "stroke-opacity": undefined
                        });

                        const removeCallback = (this._removeHighlightCallback = () => {
                            if (!isDefined(this._highlightPromise)) {
                                return;
                            }
                            this._highlightPromise
                                .then(() => {
                                    if (
                                        removeCallback !==
                                        this._removeHighlightCallback
                                    ) {
                                        return;
                                    }
                                    catalogItem.setTrait(
                                        CommonStrata.user,
                                        "show",
                                        false
                                    );
                                })
                                .catch(function() {});
                        });

                        this._highlightPromise = catalogItem
                            .loadMapItems()
                            .then(() => {
                                if (
                                    removeCallback !==
                                    this._removeHighlightCallback
                                ) {
                                    return;
                                }
                                catalogItem.setTrait(
                                    CommonStrata.user,
                                    "show",
                                    true
                                );
                            });
                    }
                }
            }
        }
    }

    /**
     * Captures a screenshot of the map.
     * @return A promise that resolves to a data URL when the screenshot is ready.
     */
    captureScreenshot(): Promise<string> {
        throw new DeveloperError(
            "captureScreenshot must be implemented in the derived class."
        );
    }
}
