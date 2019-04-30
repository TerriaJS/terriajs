import Terria from "./Terria";
import ViewState from "../ReactViewModels/ViewState";
import isDefined from "../Core/isDefined";
import createCatalogItemFromUrl from "./createCatalogItemFromUrl";
import TerriaError from "../Core/TerriaError";
import upsertModelFromJson from "./upsertModelFromJson";
import CatalogMemberFactory from "./CatalogMemberFactory";
import CommonStrata from "./CommonStrata";
import { BaseModel } from "./Model";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";

export default function createCatalogItemFromFileOrUrl(
    terria: Terria,
    viewState: ViewState,
    fileOrUrl: File | string,
    dataType: any,
    confirmConversion: boolean
): Promise<BaseModel | undefined> {
    dataType = isDefined(dataType) ? dataType : "auto";

    let isUrl: boolean, name: string;
    if (typeof fileOrUrl === "string") {
        name = fileOrUrl;
        isUrl = true;
    } else {
        name = fileOrUrl.name;
        isUrl = false;
    }

    if (dataType === "auto") {
        return createCatalogItemFromUrl(name, terria, isUrl).then(newItem => {
            //##Doesn't work for file uploads
            if (!isDefined(newItem)) {
                return tryConversionService(
                    name,
                    terria,
                    viewState,
                    confirmConversion
                );
            } else {
                // It's a file or service we support directly
                // In some cases (web services), the item will already have been loaded by this point.
                return loadItem(newItem, fileOrUrl);
            }
        });
    } else if (dataType === "other") {
        // user explicitly chose "Other (use conversion service)"
        return getConfirmation(
            viewState,
            confirmConversion,
            "Ready to upload your file to the " +
                terria.appName +
                " conversion service?"
        ).then(confirmed => {
            return confirmed
                ? loadItem(
                      createCatalogMember(terria, { type: "ogr", name }),
                      fileOrUrl
                  )
                : Promise.resolve(undefined);
        });
    } else {
        // User has provided a type, so we go with that.
        return loadItem(
            createCatalogMember(terria, { type: dataType, name }),
            fileOrUrl
        );
    }
}

function createCatalogMember(
    terria: Terria,
    json: { type: string; name: string }
) {
    return upsertModelFromJson(
        CatalogMemberFactory,
        terria,
        "",
        undefined,
        CommonStrata.definition,
        json
    );
}

function tryConversionService(
    name: string,
    terria: Terria,
    viewState: ViewState,
    confirmConversion: boolean
) {
    if (!terria.configParameters.conversionServiceBaseUrl) {
        // Don't allow conversion service. Duplicated in OgrCatalogItem.js
        terria.error.raiseEvent(
            new TerriaError({
                title: "Unsupported file type",
                message:
                    "This file format is not supported by " +
                    terria.appName +
                    ". Supported file formats include: " +
                    '<ul><li>.geojson</li><li>.kml, .kmz</li><li>.csv (in <a href="https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au">csv-geo-au format</a>)</li></ul>'
            })
        );
        return undefined;
    } else if (
        name.match(
            /\.(shp|jpg|jpeg|pdf|xlsx|xls|tif|tiff|png|txt|doc|docx|xml|json)$/
        )
    ) {
        terria.error.raiseEvent(
            new TerriaError({
                title: "Unsupported file type",
                message:
                    "This file format is not supported by " +
                    terria.appName +
                    ". Directly supported file formats include: " +
                    '<ul><li>.geojson</li><li>.kml, .kmz</li><li>.csv (in <a href="https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au">csv-geo-au format</a>)</li></ul>' +
                    "File formats supported through the online conversion service include: " +
                    '<ul><li>Shapefile (.zip)</li><li>MapInfo TAB (.zip)</li><li>Possibly other <a href="http://www.gdal.org/ogr_formats.html">OGR Vector Formats</a></li></ul>'
            })
        );
        return undefined;
    }
    return getConfirmation(
        viewState,
        confirmConversion,
        "This file is not directly supported by " +
            terria.appName +
            ".\n\n" +
            "Do you want to try uploading it to the " +
            terria.appName +
            " conversion service? This may work for " +
            "small, zipped Esri Shapefiles or MapInfo TAB files."
    ).then(confirmed => {
        return undefined;
        // TODO
        // return confirmed
        //     ? loadItem(new OgrCatalogItem(terria), name, fileOrUrl)
        //     : undefined;
    });
}

/* Returns a promise that returns true if user confirms, or false if they abort. */
function getConfirmation(
    viewState: ViewState,
    confirmConversion: boolean,
    message: string
) {
    if (!confirmConversion) {
        return Promise.resolve(true);
    }

    return new Promise(resolve => {
        viewState.notifications.push({
            confirmText: "Upload",
            denyText: "Cancel",
            title: "Use conversion service?",
            message: message,
            confirmAction: function() {
                resolve(true);
            },
            denyAction: function() {
                resolve(false);
            }
        });
    });
}

function loadItem(newCatalogItem: BaseModel, fileOrUrl: File | string) {
    if (typeof fileOrUrl === "string") {
        newCatalogItem.setTrait(CommonStrata.definition, "url", fileOrUrl);
    } else {
        if (hasFileInput(newCatalogItem)) {
            newCatalogItem.setFileInput(fileOrUrl);
        }
        // TODO
        // newCatalogItem.dataSourceUrl = fileOrUrl.name;
        // newCatalogItem.dataUrlType = "local";
    }

    if (CatalogMemberMixin.isMixedInto(newCatalogItem)) {
        return newCatalogItem.loadMetadata().then(() => newCatalogItem);
    } else {
        return Promise.resolve(newCatalogItem);
    }
}

interface HasFileInput extends BaseModel {
    setFileInput(file: File): void;
}

function hasFileInput(model: BaseModel): model is HasFileInput {
    return "setFileInput" in model;
}
