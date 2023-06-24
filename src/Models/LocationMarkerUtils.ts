import i18next from "i18next";
import markerIcon from "./markerIcon";
import prettifyCoordinates from "../Map/Vector/prettifyCoordinates";
import CommonStrata from "./Definition/CommonStrata";
import CzmlCatalogItem from "./Catalog/CatalogItems/CzmlCatalogItem";
import Terria from "./Terria";
import LatLonHeight from "../Core/LatLonHeight";
import { toJS } from "mobx";

export const LOCATION_MARKER_DATA_SOURCE_NAME =
  "TerriaJS Location Marker Points";
export const MARKER_UNIQUE_ID = "__TERRRIAJS-LOCATIONMARKER__";

export interface MarkerDetails {
  name: string;
  location: { longitude: number; latitude: number; height?: number };
  heightReference?: "NONE" | "CLAMP_TO_GROUND" | "RELATIVE_TO_GROUND";
  customMarkerIcon?: string;
}
/**
 * Adds a location marker to the map with the position supplied in the result, adding a data source to terria if one hasn't
 * already been added, and removing all previously added markers in that data source. This data source is stored in
 * terria.locationMarker.
 */
export function addMarker(
  terria: Terria,
  details: MarkerDetails
): CzmlCatalogItem {
  const location = details.location;

  const displayCoords = prettifyCoordinates(
    details.location.longitude,
    details.location.latitude,
    { digits: 5 }
  );

  const billboard: any = {
    image: details.customMarkerIcon || markerIcon,
    scale: details.customMarkerIcon ? 1 : 0.5,
    verticalOrigin: "BOTTOM",
    heightReference:
      details.heightReference ||
      (details.location.height === undefined ? "CLAMP_TO_GROUND" : "NONE")
  };

  const document = {
    id: "document",
    name: LOCATION_MARKER_DATA_SOURCE_NAME,
    version: "1.0"
  };

  const marker = {
    name: details.name,
    position: {
      cartographicDegrees: [
        location.longitude,
        location.latitude,
        location.height || 0.0
      ]
    },
    description: `<table><tr><td>${i18next.t("featureInfo.latLon")}</td><td>${
      displayCoords.latitude
    }, ${displayCoords.longitude}</td></tr></table>`,
    billboard: billboard
  };

  let catalogItem = terria.getModelById(CzmlCatalogItem, MARKER_UNIQUE_ID);
  if (catalogItem === undefined) {
    catalogItem = new CzmlCatalogItem(MARKER_UNIQUE_ID, terria);
    catalogItem.setTrait(
      CommonStrata.definition,
      "name",
      LOCATION_MARKER_DATA_SOURCE_NAME
    );
    terria.addModel(catalogItem);
  }
  catalogItem.setTrait(CommonStrata.user, "czmlData", [document, marker]);

  terria.overlays.add(catalogItem);

  return catalogItem;
}

/** Removes a marker previously added in {@link #addMarker}. */
export function removeMarker(terria: Terria) {
  const catalogItem = terria.getModelById(CzmlCatalogItem, MARKER_UNIQUE_ID);
  if (catalogItem !== undefined) {
    terria.overlays.remove(catalogItem);
  }
}

/** Determines whether the location marker is visible previously added in {@link #addMarker}. */
export function isMarkerVisible(terria: Terria): boolean {
  const catalogItem = terria.getModelById(CzmlCatalogItem, MARKER_UNIQUE_ID);
  return catalogItem !== undefined && terria.overlays.contains(catalogItem);
}

export function getMarkerLocation(terria: Terria): LatLonHeight | undefined {
  const catalogItem = terria.getModelById(CzmlCatalogItem, MARKER_UNIQUE_ID);
  if (catalogItem === undefined || !terria.overlays.contains(catalogItem)) {
    return;
  }
  const marker: any = catalogItem.czmlData[1];
  const position = marker?.position?.cartographicDegrees;
  if (Array.isArray(toJS(position))) {
    const [longitude, latitude, height] = position;
    if (longitude !== undefined && latitude !== undefined) {
      return { longitude, latitude, height };
    }
  }
  return undefined;
}
