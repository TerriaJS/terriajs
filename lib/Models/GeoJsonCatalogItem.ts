import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import { computed, observable } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import Color from "terriajs-cesium/Source/Core/Color";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import defined from "terriajs-cesium/Source/Core/defined";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
import GeoJsonCatalogItemTraits from "../Traits/GeoJsonCatalogItemTraits";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import GetCapabilitiesMixin from "../ModelMixins/GetCapabilitiesMixin";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Mappable from "./Mappable";
import Model from "./Model";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import PolygonGraphics from "terriajs-cesium/Source/DataSources/PolygonGraphics";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import PolylineGraphics from "terriajs-cesium/Source/DataSources/PolylineGraphics";
import Property from "terriajs-cesium/Source/DataSources/Property";
import TerriaError from "../Core/TerriaError";
import UrlMixin from "../ModelMixins/UrlMixin";
import when from "terriajs-cesium/Source/ThirdParty/when";

var formatPropertyValue = require("../Core/formatPropertyValue");
var hashFromString = require("../Core/hashFromString");
var loadBlob = require("../Core/loadBlob");
var loadJson = require("../Core/loadJson");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var readJson = require("../Core/readJson");
var Reproject = require("../Map/Reproject");
var standardCssColors = require("../Core/standardCssColors");
var zip = require("terriajs-cesium/Source/ThirdParty/zip");

type Coordinates = number[];

var zipFileRegex = /.zip\b/i;
var geoJsonRegex = /.geojson\b/i;

var simpleStyleIdentifiers = [
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

export default class GeoJsonCatalogItem
    extends UrlMixin(CatalogMemberMixin(Model(GeoJsonCatalogItemTraits)))
    implements Mappable {
    @observable dataSource?: GeoJsonDataSource;

    @observable
    show: boolean = true;

    data: any;

    @computed
    get mapItems() {
        if (this.dataSource === undefined) {
            return [];
        }
        this.dataSource.show = this.show;
        return [this.dataSource];
    }

    loadMetadata(): Promise<void> {
        return Promise.resolve();
    }

    loadData(): Promise<void> {
        let that = this;
        this.dataSource = new GeoJsonDataSource(this.name);
        if (defined(that.data)) {
            return when(that.data, function(data: any) {
                var promise;
                if (typeof Blob !== "undefined" && data instanceof Blob) {
                    promise = readJson(data);
                } else if (data instanceof String || typeof data === "string") {
                    try {
                        promise = JSON.parse(data.toString());
                    } catch (e) {
                        throw new TerriaError({
                            sender: that,
                            title: "Error loading GeoJSON",
                            message:
                                "An error occurred parsing the provided data as JSON.  This may indicate that the file is invalid or that it " +
                                "is not supported by " +
                                that.terria.appName +
                                '.  If you would like assistance or further information, please email us at <a href="mailto:' +
                                that.terria.supportEmail +
                                '">' +
                                that.terria.supportEmail +
                                "</a>."
                        });
                    }
                } else {
                    promise = data;
                }

                return when(promise, function(json: any) {
                    that.data = json;
                    return updateModelFromData(that, json);
                }).otherwise(function() {
                    throw new TerriaError({
                        sender: that,
                        title: "Error loading GeoJSON",
                        message:
                            "An error occurred while loading a GeoJSON file.  This may indicate that the file is invalid or that it " +
                            "is not supported by " +
                            that.terria.appName +
                            '.  If you would like assistance or further information, please email us at <a href="mailto:' +
                            that.terria.supportEmail +
                            '">' +
                            that.terria.supportEmail +
                            "</a>."
                    });
                });
            });
        } else {
            var jsonPromise;
            if (that.url !== undefined && zipFileRegex.test(that.url)) {
                if (typeof FileReader === "undefined") {
                    throw new TerriaError({
                        sender: that,
                        title: "Unsupported web browser",
                        message:
                            "Sorry, your web browser does not support the File API, which " +
                            that.terria.appName +
                            ' requires in order to \
load this dataset.  Please upgrade your web browser.  For the best experience, we recommend the latest versions of \
<a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, or \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, or \
<a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a>.'
                    });
                }

                jsonPromise = loadBlob(
                    proxyCatalogItemUrl(that, that.url, "1d")
                ).then(function(blob?: Blob) {
                    var deferred = when.defer();
                    zip.createReader(
                        new zip.BlobReader(blob),
                        function(reader: any) {
                            // Look for a file with a .geojson extension.
                            reader.getEntries(function(entries: any) {
                                var resolved = false;
                                for (var i = 0; i < entries.length; i++) {
                                    var entry = entries[i];
                                    if (geoJsonRegex.test(entry.filename)) {
                                        getJson(entry, deferred);
                                        resolved = true;
                                    }
                                }

                                if (!resolved) {
                                    deferred.reject();
                                }
                            });
                        },
                        function(e: any) {
                            deferred.reject(e);
                        }
                    );
                    return deferred.promise;
                });
            } else {
                jsonPromise = loadJson(
                    proxyCatalogItemUrl(that, that.url, "1d")
                );
            }

            return jsonPromise
                .then(function(json: any) {
                    return updateModelFromData(that, json);
                })
                .otherwise(function(e: any) {
                    if (e instanceof TerriaError) {
                        throw e;
                    }

                    throw new TerriaError({
                        sender: that,
                        title: "Could not load JSON",
                        message:
                            '\
An error occurred while retrieving JSON data from the provided link.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the ' +
                            that.terria.appName +
                            ' \
team by emailing <a href="mailto:' +
                            that.terria.supportEmail +
                            '">' +
                            that.terria.supportEmail +
                            "</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by " +
                            that.terria.appName +
                            " \
itself.</p>\
<p>If you did not enter this link manually, this error may indicate that the data source you're trying to add is temporarily unavailable or there is a \
problem with your internet connection.  Try adding the data source again, and if the problem persists, please report it by \
sending an email to <a href=\"mailto:" +
                            that.terria.supportEmail +
                            '">' +
                            that.terria.supportEmail +
                            "</a>.</p>"
                    });
                });
        }
    }
}

function updateModelFromData(geoJsonItem: GeoJsonCatalogItem, geoJson: any) {
    // If this GeoJSON data is an object literal with a single property, treat that
    // property as the name of the data source, and the property's value as the
    // actual GeoJSON.
    var numProperties = 0;
    var propertyName;
    for (propertyName in geoJson) {
        if (geoJson.hasOwnProperty(propertyName)) {
            ++numProperties;
            if (numProperties > 1) {
                break; // no need to count past 2 properties.
            }
        }
    }

    var name;
    if (numProperties === 1 && propertyName !== undefined) {
        name = propertyName;
        geoJson = geoJson[propertyName];

        // If we don't already have a name, or our name is just derived from our URL, update the name.
        if (
            geoJsonItem.name === undefined ||
            geoJsonItem.name.length === 0 ||
            nameIsDerivedFromUrl(geoJsonItem.name, geoJsonItem.url)
        ) {
            //geoJsonItem.name = name; TODO: set name
        }
    }

    // Reproject the features if they're not already EPSG:4326.
    var promise = reprojectToGeographic(geoJsonItem, geoJson);

    return when(promise, function() {
        return loadGeoJson(geoJsonItem, geoJson);
    });
}

function nameIsDerivedFromUrl(name: string, url?: string) {
    if (name === url) {
        return true;
    }

    if (!url) {
        return false;
    }

    // Is the name just the end of the URL?
    var indexOfNameInUrl = url.lastIndexOf(name);
    if (
        indexOfNameInUrl >= 0 &&
        indexOfNameInUrl === url.length - name.length
    ) {
        return true;
    }

    return false;
}

function reprojectToGeographic(geoJsonItem: GeoJsonCatalogItem, geoJson: any) {
    var code: string | undefined;

    if (!defined(geoJson.crs)) {
        code = undefined;
    } else if (geoJson.crs.type === "EPSG") {
        code = "EPSG:" + geoJson.crs.properties.code;
    } else if (
        geoJson.crs.type === "name" &&
        defined(geoJson.crs.properties) &&
        defined(geoJson.crs.properties.name)
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
        return true;
    }

    return when(
        Reproject.checkProjection(
            geoJsonItem.terria.configParameters.proj4ServiceBaseUrl,
            code
        ),
        function(result: boolean) {
            if (result) {
                filterValue(geoJson, "coordinates", function(obj, prop) {
                    obj[prop] = filterArray(obj[prop], function(pts) {
                        return reprojectPointList(pts, code);
                    });
                });
            } else {
                throw new DeveloperError(
                    "The crs code for this datasource is unsupported."
                );
            }
        }
    );
}

// Reproject a point list based on the supplied crs code.
function reprojectPointList(
    pts: Coordinates | Coordinates[],
    code?: string
): Coordinates | Coordinates[] {
    if (!(pts[0] instanceof Array)) {
        return Reproject.reprojectPoint(pts, code, "EPSG:4326");
    }
    var pts_out = [];
    for (var i = 0; i < pts.length; i++) {
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
    for (var p in obj) {
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

    var result = new Array(pts.length);
    for (var i = 0; i < pts.length; i++) {
        result[i] = filterArray(pts[i], func); //at array of arrays of points
    }
    return result;
}

function getJson(entry: any, deferred: any) {
    entry.getData(new zip.Data64URIWriter(), function(uri: string) {
        deferred.resolve(loadJson(uri));
    });
}

function loadGeoJson(geoJsonItem: GeoJsonCatalogItem, geoJson: any) {
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
            var color = Color.fromCssColorString(
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
        var sizes: { [name: string]: number } = {
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

    var dataSource = geoJsonItem.dataSource;

    if (dataSource === undefined) {
        return;
    }

    var style = defaultValue(geoJsonItem.style, {});

    var options = {
        describe: describeWithoutUnderscores,
        markerSize: defaultValue(parseMarkerSize(style["marker-size"]), 20),
        markerSymbol: style["marker-symbol"], // and undefined if none
        markerColor: defaultColor(
            style["marker-color"],
            geoJsonItem.name || ""
        ),
        stroke: getColor(defaultValue(style.stroke, "#000000")),
        strokeWidth: defaultValue(style["stroke-width"], 2),
        polygonStroke: getColor(defaultValue(style.stroke, "#000000")),
        polylineStroke: defaultColor(style.stroke, geoJsonItem.name || ""),
        markerOpacity: style["marker-opacity"], // not in SimpleStyle spec or supported by Cesium but see below
        fill: defaultColor(style.fill, (geoJsonItem.name || "") + " fill")
    };

    if (defined(style["stroke-opacity"])) {
        options.stroke.alpha = parseFloat(style["stroke-opacity"]);
    }

    if (defined(style["fill-opacity"])) {
        options.fill.alpha = parseFloat(style["fill-opacity"]);
    } else {
        options.fill.alpha = 0.75;
    }

    var entities = dataSource.entities;
    return dataSource.load(geoJson, options).then(function() {
        for (var i = 0; i < entities.values.length; ++i) {
            var entity = entities.values[i];

            /* If no marker symbol was provided but Cesium has generated one for a point, then turn it into
               a filled circle instead of the default marker. */
            var properties = entity.properties || {};
            if (
                defined(entity.billboard) &&
                !defined(properties["marker-symbol"]) &&
                !defined(options.markerSymbol)
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
                        defaultValue(properties.stroke, options.polygonStroke)
                    )
                });
                if (defined(properties["marker-opacity"])) {
                    // not part of SimpleStyle spec, but why not?
                    const color: Color = getPropertyValue(entity.point.color);
                    color.alpha = parseFloat(properties["marker-opacity"]);
                }

                entity.billboard = (undefined as unknown) as BillboardGraphics;
            }
            if (
                defined(entity.billboard) &&
                defined(properties["marker-opacity"])
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
                defined(entity.polygon) &&
                polygonHasWideOutline(entity.polygon) &&
                !polygonIsFilled(entity.polygon)
            ) {
                entity.polyline = new PolylineGraphics();
                entity.polyline.show = entity.polygon.show;

                if (defined(entity.polygon.outlineColor)) {
                    entity.polyline.material = new ColorMaterialProperty(
                        entity.polygon.outlineColor
                    );
                }

                var hierarchy: PolygonHierarchy = getPropertyValue(
                    entity.polygon.hierarchy
                );

                var positions = hierarchy.positions;
                closePolyline(positions);

                entity.polyline.positions = new ConstantProperty(positions);
                entity.polyline.width = getPropertyValue(
                    entity.polygon.outlineWidth
                );

                createEntitiesFromHoles(entities, hierarchy.holes, entity);

                entity.polygon = (undefined as unknown) as PolygonGraphics;
            }
        }
    });
}

/**
 * Get a random color for the data based on the passed string (usually dataset name).
 */
function getRandomCssColor(cssColors: string[], name: string): string {
    var index = hashFromString(name || "") % cssColors.length;
    return cssColors[index];
}

// This next function modelled on Cesium.geoJsonDataSource's defaultDescribe.
function describeWithoutUnderscores(
    properties: any,
    nameProperty?: string
): string {
    var html = "";
    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            if (
                key === nameProperty ||
                simpleStyleIdentifiers.indexOf(key) !== -1
            ) {
                continue;
            }
            var value = properties[key];
            if (typeof value === "object") {
                value = describeWithoutUnderscores(value);
            } else {
                value = formatPropertyValue(value);
            }
            key = key.replace(/_/g, " ");
            if (defined(value)) {
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
        defined(polygon.outlineWidth) &&
        getPropertyValue(polygon.outlineWidth) > 1
    );
}

function polygonIsFilled(polygon: PolygonGraphics) {
    var fill = true;
    if (defined(polygon.fill)) {
        fill = polygon.fill;
    }

    if (!fill) {
        return false;
    }

    if (!defined(polygon.material)) {
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
    if (!defined(holes)) {
        return;
    }

    for (var i = 0; i < holes.length; ++i) {
        createEntityFromHole(entityCollection, holes[i], mainEntity);
    }
}

function createEntityFromHole(
    entityCollection: EntityCollection,
    hole: PolygonHierarchy,
    mainEntity: Entity
) {
    if (
        !defined(hole) ||
        !defined(hole.positions) ||
        hole.positions.length === 0
    ) {
        return;
    }

    var entity = new Entity();

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
