import { computed } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import PolygonGraphics from "terriajs-cesium/Source/DataSources/PolygonGraphics";
import PolylineGraphics from "terriajs-cesium/Source/DataSources/PolylineGraphics";
import Property from "terriajs-cesium/Source/DataSources/Property";
import isDefined from "../Core/isDefined";
import JsonValue, { isJsonObject, JsonObject } from "../Core/Json";
import makeRealPromise from '../Core/makeRealPromise';
import TerriaError from "../Core/TerriaError";
import AsyncMappableMixin from '../ModelMixins/AsyncMappableMixin';
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import GeoJsonCatalogItemTraits from "../Traits/GeoJsonCatalogItemTraits";
import CreateModel from './CreateModel';
import Terria from "./Terria";

const formatPropertyValue = require("../Core/formatPropertyValue");
const hashFromString = require("../Core/hashFromString");
const loadBlob = require("../Core/loadBlob");
const loadJson = require("../Core/loadJson");
const proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
const Reproject = require("../Map/Reproject");
const standardCssColors = require("../Core/standardCssColors");
const zip = require("terriajs-cesium/Source/ThirdParty/zip");

type Coordinates = number[];

const zipFileRegex = /.zip\b/i;
const geoJsonRegex = /.geojson\b/i;

const simpleStyleIdentifiers = [
    "title",
    "description", //
    "marker-size",
    "marker-symbol",
    "marker-color",
    "stroke", //
    "stroke-opacity",
    "stroke-width",
    "fill",
    "fill-opacity"
];

class GeoJsonCatalogItem
    extends AsyncMappableMixin(UrlMixin(CatalogMemberMixin(CreateModel(GeoJsonCatalogItemTraits)))) {

    private _dataSource: GeoJsonDataSource | undefined;

    constructor(id: string, terria: Terria) {
        super(id, terria);
    }

    protected get loadMapItemsPromise(): Promise<void> {
        const createLoadError = () => new TerriaError({
            sender: this,
            title: "Could not load GeoJSON",
            message: `An error occurred while retrieving JSON data from the provided link.` +
                     `<p>If you entered the link manually, please verify that the link is correct.</p>` +
                     `<p>This error may also indicate that the server does not support ` +
                     `<a href="http://enable-cors.org/" target="_blank">CORS</a>. If this is your server, ` +
                     `verify that CORS is enabled and enable it if it is not.  If you do not control the ` +
                     `server, please contact the administrator of the server and ask them to enable CORS. Or, ` +
                     `contact the ${this.terria.appName} team by emailing ` +
                     `<a href="mailto:${this.terria.supportEmail}">${this.terria.supportEmail}</a> ` +
                     `and ask us to add this server to the list of non-CORS-supporting servers that may be ` +
                     `proxied by ${this.terria.appName} itself.</p><p>If you did not enter this link manually, ` +
                     `this error may indicate that the data source you're trying to add is temporarily unavailable ` +
                     `or there is a problem with your internet connection.  Try adding the data source again, and if ` +
                     `the problem persists, please report it by sending an email to ` +
                     `<a href="mailto:${this.terria.supportEmail}">${this.terria.supportEmail}</a>.</p>`
        });

        return new Promise<JsonValue | undefined>((resolve, reject) => {
            if (isDefined(this.geoJsonData)) {
                resolve(this.geoJsonData);
            } else if (isDefined(this.geoJsonString)) {
                resolve(<JsonValue>JSON.parse(this.geoJsonString));
            } else if (isDefined(this.url)) {
                // try loading from a zip file url or a regular url
                if (zipFileRegex.test(this.url)) {
                    if (typeof FileReader === "undefined") {
                        throw new TerriaError({
                            sender: this,
                            title: "Unsupported web browser",
                            message: `Sorry, your web browser does not support the File API, which ${this.terria.appName} requires in order to load this dataset. Please upgrade your web browser.  For the best experience, we recommend the latest versions of <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, or <a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, or <a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a>.`
                        });
                    }
                    resolve(loadZipFile(proxyCatalogItemUrl(this, this.url, "1d")));
                } else {
                    resolve(makeRealPromise<JsonValue>(loadJson(proxyCatalogItemUrl(this, this.url, "1d"))));
                }
            } else {
                throw new TerriaError({
                    sender: this,
                    title: "No GeoJSON available",
                    message: `The GeoJSON catalog item cannot be loaded because it was not configured ` +
                             `with a \`url\`, \`geoJsonData\`, or \`geoJsonString\` property.`
                });
            }
        }).then((geoJson: JsonValue | undefined) => {
            if (!isJsonObject(geoJson)) {
                throw createLoadError();
            }
            return reprojectToGeographic(geoJson, this.terria.configParameters.proj4ServiceBaseUrl);
        }).then((geoJsonWgs84: JsonObject) => {
            return this.loadDataSource(geoJsonWgs84);
        }).then((dataSource) => {
            this._dataSource = dataSource;
        }).catch((e) => {
            if (e instanceof TerriaError) {
                throw e;
            } else {
                throw createLoadError();
            }
        });
    }

    @computed
    get mapItems() {
        if (this.isLoadingMapItems || this._dataSource === undefined) {
            return [];
        }

        return [this._dataSource];
    }

    protected get loadMetadataPromise(): Promise<void> {
        return Promise.resolve();
    }

    private loadDataSource(
        geoJson: JsonObject
    ): Promise<GeoJsonDataSource> {
        /* Style information is applied as follows, in decreasing priority:
           - simple-style properties set directly on individual features in the GeoJSON file
           - simple-style properties set as the 'Style' property on the catalog item
           - our 'options' set below (and point styling applied after Cesium loads the GeoJSON)
           - if anything is underspecified there, then Cesium's defaults come in.

           See https://github.com/mapbox/simplestyle-spec/tree/master/1.1.0
        */

        function defaultColor(
            colorString: string | undefined,
            name: string
        ): Color {
            if (colorString === undefined) {
                const color = Color.fromCssColorString(
                    getRandomCssColor(standardCssColors.highContrast, name)
                );
                color.alpha = 1;
                return color;
            } else {
                return Color.fromCssColorString(colorString);
            }
        }

        function getColor(color: String | string | Color): Color {
            if (typeof color === "string" || color instanceof String) {
                return Color.fromCssColorString(color.toString());
            } else {
                return color;
            }
        }

        function parseMarkerSize(sizeString?: string): number | undefined {
            const sizes: { [name: string]: number } = {
                small: 24,
                medium: 48,
                large: 64
            };

            if (sizeString === undefined) {
                return undefined;
            }

            if (sizes[sizeString] !== undefined) {
                return sizes[sizeString];
            }
            return parseInt(sizeString, 10); // SimpleStyle doesn't allow 'marker-size: 20', but people will do it.
        }

        const style = defaultValue(this.style, {});

        const options = {
            describe: describeWithoutUnderscores,
            markerSize: defaultValue(parseMarkerSize(style["marker-size"]), 20),
            markerSymbol: style["marker-symbol"], // and undefined if none
            markerColor: defaultColor(style["marker-color"], this.name || ""),
            stroke: getColor(defaultValue(style.stroke, "#000000")),
            strokeWidth: defaultValue(style["stroke-width"], 2),
            polygonStroke: getColor(defaultValue(style.stroke, "#000000")),
            polylineStroke: defaultColor(style.stroke, this.name || ""),
            markerOpacity: style["marker-opacity"], // not in SimpleStyle spec or supported by Cesium but see below
            fill: defaultColor(style.fill, (this.name || "") + " fill")
        };

        if (isDefined(style["stroke-opacity"])) {
            options.stroke.alpha = parseFloat(style["stroke-opacity"]);
        }

        if (isDefined(style["fill-opacity"])) {
            options.fill.alpha = parseFloat(style["fill-opacity"]);
        } else {
            options.fill.alpha = 0.75;
        }

        return makeRealPromise<GeoJsonDataSource>(GeoJsonDataSource.load(geoJson, options)).then(function(dataSource) {
            const entities = dataSource.entities;
            for (let i = 0; i < entities.values.length; ++i) {
                const entity = entities.values[i];

                /* If no marker symbol was provided but Cesium has generated one for a point, then turn it into
               a filled circle instead of the default marker. */
                const properties = entity.properties || {};
                if (
                    isDefined(entity.billboard) &&
                    !isDefined(properties["marker-symbol"]) &&
                    !isDefined(options.markerSymbol)
                ) {
                    entity.point = new PointGraphics({
                        color: getColor(
                            defaultValue(
                                properties["marker-color"],
                                options.markerColor
                            )
                        ),
                        pixelSize: defaultValue(
                            properties["marker-size"],
                            options.markerSize / 2
                        ),
                        outlineWidth: defaultValue(
                            properties["stroke-width"],
                            options.strokeWidth
                        ),
                        outlineColor: getColor(
                            defaultValue(
                                properties.stroke,
                                options.polygonStroke
                            )
                        )
                    });
                    if (isDefined(properties["marker-opacity"])) {
                        // not part of SimpleStyle spec, but why not?
                        const color: Color = getPropertyValue(
                            entity.point.color
                        );
                        color.alpha = parseFloat(properties["marker-opacity"]);
                    }

                    entity.billboard = (undefined as unknown) as BillboardGraphics;
                }
                if (
                    isDefined(entity.billboard) &&
                    isDefined(properties["marker-opacity"])
                ) {
                    entity.billboard.color = new ConstantProperty(
                        new Color(
                            1.0,
                            1.0,
                            1.0,
                            parseFloat(properties["marker-opacity"])
                        )
                    );
                }

                // Cesium on Windows can't render polygons with a stroke-width > 1.0.  And even on other platforms it
                // looks bad because WebGL doesn't mitre the lines together nicely.
                // As a workaround for the special case where the polygon is unfilled anyway, change it to a polyline.
                if (
                    isDefined(entity.polygon) &&
                    polygonHasWideOutline(entity.polygon) &&
                    !polygonIsFilled(entity.polygon)
                ) {
                    entity.polyline = new PolylineGraphics();
                    entity.polyline.show = entity.polygon.show;

                    if (isDefined(entity.polygon.outlineColor)) {
                        entity.polyline.material = new ColorMaterialProperty(
                            entity.polygon.outlineColor
                        );
                    }

                    const hierarchy: PolygonHierarchy = getPropertyValue(
                        entity.polygon.hierarchy
                    );

                    const positions = hierarchy.positions;
                    closePolyline(positions);

                    entity.polyline.positions = new ConstantProperty(positions);
                    entity.polyline.width = getPropertyValue(
                        entity.polygon.outlineWidth
                    );

                    createEntitiesFromHoles(entities, hierarchy.holes, entity);

                    entity.polygon = (undefined as unknown) as PolygonGraphics;
                }
            }
            return dataSource;
        });
    }
}

export default GeoJsonCatalogItem;

function reprojectToGeographic(geoJson: JsonObject, proj4ServiceBaseUrl?: string): Promise<JsonObject> {
    let code: string | undefined;

    if (!isJsonObject(geoJson.crs)) {
        code = undefined;
    } else if (geoJson.crs.type === "EPSG" && isJsonObject(geoJson.crs.properties) && geoJson.crs.properties.code) {
        code = "EPSG:" + geoJson.crs.properties.code;
    } else if (
        isJsonObject(geoJson.crs.properties) &&
        geoJson.crs.type === "name" &&
        geoJson.crs.properties.name
    ) {
        code = Reproject.crsStringToCode(geoJson.crs.properties.name);
    }

    geoJson.crs = {
        type: "EPSG",
        properties: {
            code: "4326"
        }
    };

    if (!Reproject.willNeedReprojecting(code)) {
        return Promise.resolve(geoJson);
    }

    return makeRealPromise<boolean>(Reproject.checkProjection(proj4ServiceBaseUrl, code)).then(function(
        result: boolean
    ) {
        if (result) {
            filterValue(geoJson, "coordinates", function(obj, prop) {
                obj[prop] = filterArray(obj[prop], function(pts) {
                    return reprojectPointList(pts, code);
                });
            });
            return geoJson;
        } else {
            throw new DeveloperError(
                "The crs code for this datasource is unsupported."
            );
        }
    });
}

// Reproject a point list based on the supplied crs code.
function reprojectPointList(
    pts: Coordinates | Coordinates[],
    code?: string
): Coordinates | Coordinates[] {
    if (!(pts[0] instanceof Array)) {
        return Reproject.reprojectPoint(pts, code, "EPSG:4326");
    }
    const pts_out = [];
    for (let i = 0; i < pts.length; i++) {
        pts_out.push(Reproject.reprojectPoint(pts[i], code, "EPSG:4326"));
    }
    return pts_out;
}

// Find a member by name in the gml.
function filterValue(
    obj: any,
    prop: string,
    func: (obj: any, prop: string) => void
) {
    for (let p in obj) {
        if (obj.hasOwnProperty(p) === false) {
            continue;
        } else if (p === prop) {
            if (func && typeof func === "function") {
                func(obj, prop);
            }
        } else if (typeof obj[p] === "object") {
            filterValue(obj[p], prop, func);
        }
    }
}

// Filter a geojson coordinates array structure.
function filterArray(
    pts: any[],
    func: (pts: Coordinates | Coordinates[]) => any
) {
    if (!(pts[0] instanceof Array) || !(pts[0][0] instanceof Array)) {
        pts = func(pts);
        return pts;
    }

    const result = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
        result[i] = filterArray(pts[i], func); //at array of arrays of points
    }
    return result;
}

/**
 * Get a random color for the data based on the passed string (usually dataset name).
 */
function getRandomCssColor(cssColors: string[], name: string): string {
    const index = hashFromString(name || "") % cssColors.length;
    return cssColors[index];
}

// This next function modelled on Cesium.geoJsonDataSource's defaultDescribe.
function describeWithoutUnderscores(
    properties: any,
    nameProperty?: string
): string {
    let html = "";
    for (let key in properties) {
        if (properties.hasOwnProperty(key)) {
            if (
                key === nameProperty ||
                simpleStyleIdentifiers.indexOf(key) !== -1
            ) {
                continue;
            }
            let value = properties[key];
            if (typeof value === "object") {
                value = describeWithoutUnderscores(value);
            } else {
                value = formatPropertyValue(value);
            }
            key = key.replace(/_/g, " ");
            if (isDefined(value)) {
                html += "<tr><th>" + key + "</th><td>" + value + "</td></tr>";
            }
        }
    }
    if (html.length > 0) {
        html =
            '<table class="cesium-infoBox-defaultTable"><tbody>' +
            html +
            "</tbody></table>";
    }
    return html;
}

function polygonHasWideOutline(polygon: PolygonGraphics) {
    return (
        isDefined(polygon.outlineWidth) &&
        getPropertyValue(polygon.outlineWidth) > 1
    );
}

function polygonIsFilled(polygon: PolygonGraphics) {
    let fill = true;
    if (isDefined(polygon.fill)) {
        fill = polygon.fill;
    }

    if (!fill) {
        return false;
    }

    if (!isDefined(polygon.material)) {
        // The default is solid white.
        return true;
    }

    let color;
    if (polygon.material instanceof Color) {
        color = polygon.material;
    } else {
        color = (polygon.material as ColorMaterialProperty).color;
    }

    if (color.alpha === 0.0) {
        return false;
    }

    return true;
}

function closePolyline(positions: Cartesian3[]) {
    // If the first and last positions are more than a meter apart, duplicate the first position so the polyline is closed.
    if (
        positions.length >= 2 &&
        !Cartesian3.equalsEpsilon(
            positions[0],
            positions[positions.length - 1],
            0.0,
            1.0
        )
    ) {
        positions.push(positions[0]);
    }
}

function createEntitiesFromHoles(
    entityCollection: EntityCollection,
    holes: PolygonHierarchy[],
    mainEntity: Entity
) {
    if (!isDefined(holes)) {
        return;
    }

    for (let i = 0; i < holes.length; ++i) {
        createEntityFromHole(entityCollection, holes[i], mainEntity);
    }
}

function createEntityFromHole(
    entityCollection: EntityCollection,
    hole: PolygonHierarchy,
    mainEntity: Entity
) {
    if (
        !isDefined(hole) ||
        !isDefined(hole.positions) ||
        hole.positions.length === 0
    ) {
        return;
    }

    const entity = new Entity();

    entity.name = mainEntity.name;
    entity.availability = mainEntity.availability;
    entity.description = mainEntity.description;
    entity.properties = mainEntity.properties;

    entity.polyline = new PolylineGraphics();
    entity.polyline.show = mainEntity.polyline.show;
    entity.polyline.material = mainEntity.polyline.material;
    entity.polyline.width = mainEntity.polyline.width;

    closePolyline(hole.positions);
    entity.polyline.positions = new ConstantProperty(hole.positions);

    entityCollection.add(entity);

    createEntitiesFromHoles(entityCollection, hole.holes, mainEntity);
}

function getPropertyValue<T>(property: Property): T {
    return property.getValue(JulianDate.now());
}

function loadZipFile(url: string): Promise<JsonValue> {
    return makeRealPromise<Blob>(loadBlob(url)).then(function(blob: Blob) {
        return new Promise((resolve, reject) => {
            zip.createReader(
                new zip.BlobReader(blob),
                function(reader: any) {
                    // Look for a file with a .geojson extension.
                    reader.getEntries(function(entries: any) {
                        let resolved = false;
                        for (let i = 0; i < entries.length; i++) {
                            const entry = entries[i];
                            if (geoJsonRegex.test(entry.filename)) {
                                entry.getData(new zip.Data64URIWriter(), function(uri: string) {
                                    resolve(makeRealPromise<JsonValue>(loadJson(uri)));
                                });
                                resolved = true;
                            }
                        }

                        if (!resolved) {
                            reject();
                        }
                    });
                },
                (e: Error) => reject(e)
            );
        });
    });
}

function unwrapSinglePropertyObject(obj: any) {
    let name;
    if (Object.keys(obj).length === 1) {
        name = Object.keys(obj)[0];
        obj = obj[name];
    }
    return { name, obj };
}
