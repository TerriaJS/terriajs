import { computed, observable } from "mobx";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import defined from "terriajs-cesium/Source/Core/defined";
import GeoJsonCatalogItemTraits from "../Traits/GeoJsonCatalogItemTraits";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import GetCapabilitiesMixin from "../ModelMixins/GetCapabilitiesMixin";
import Mappable from "./Mappable";
import Model from "./Model";
import TerriaError from "../Core/TerriaError";
import UrlMixin from "../ModelMixins/UrlMixin";
import when from "terriajs-cesium/Source/ThirdParty/when";

var loadBlob = require("../Core/loadBlob");
var loadJson = require("../Core/loadJson");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var readJson = require("../Core/readJson");
var { updateModelFromData, getJson } = require("./loadGeoJson");
var zip = require("terriajs-cesium/Source/ThirdParty/zip");

var zipFileRegex = /.zip\b/i;
var geoJsonRegex = /.geojson\b/i;

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
                                "\
An error occurred parsing the provided data as JSON.  This may indicate that the file is invalid or that it \
is not supported by " +
                                that.terria.appName +
                                '.  If you would like assistance or further information, please email us \
at <a href="mailto:' +
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
                            "\
An error occurred while loading a GeoJSON file.  This may indicate that the file is invalid or that it \
is not supported by " +
                            that.terria.appName +
                            '.  If you would like assistance or further information, please email us \
at <a href="mailto:' +
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
                            "\
Sorry, your web browser does not support the File API, which " +
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
                .otherwise(function(e?: TerriaError) {
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
