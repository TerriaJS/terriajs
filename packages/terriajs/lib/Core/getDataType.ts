import i18next, { keyFromSelector, SelectorKey } from "i18next";
import { action, observable, ObservableMap } from "mobx";
import { type ComponentType } from "react";

interface DataType {
  value: string;
  name: string | SelectorKey;
  description?: string | SelectorKey;
  customComponent?: ComponentType;
}

export interface RemoteDataType extends DataType {}

export interface LocalDataType extends DataType {
  extensions?: string[];
}

interface GetDataTypes {
  remoteDataType: RemoteDataType[];
  localDataType: LocalDataType[];
}

/**
 * List of builtin remote upload types
 */
const builtinRemoteDataTypes: RemoteDataType[] = [
  {
    value: "auto",
    name: keyFromSelector(($) => $.core.dataType.auto)
  },
  {
    value: "wms-group",
    name: keyFromSelector(($) => $.core.dataType["wms-group"]) //"core.dataType.wms-group"
  },
  {
    value: "wfs-group",
    name: keyFromSelector(($) => $.core.dataType["wfs-group"])
  },
  {
    value: "esri-group",
    name: keyFromSelector(($) => $.core.dataType["esri-group"])
  },
  // esri-group is registered with ArcGisCatalogGroup, which can read REST, MapServer and FeatureServer groups.
  // So we do not need to explicitly include esri-mapServer-group or esri-featureServer-group here.
  {
    value: "esri-mapServer",
    name: keyFromSelector(($) => $.core.dataType["esri-mapServer"])
  },
  {
    value: "esri-imageServer",
    name: keyFromSelector(($) => $.core.dataType["esri-imageServer"])
  },
  /* {
        value: "esri-mapServer-group",
        name: "Esri ArcGIS MapServer"
      }, */
  {
    value: "esri-featureServer",
    name: keyFromSelector(($) => $.core.dataType["esri-featureServer"])
  },
  // to be removed once ArcGisCatalogGroup is implemented
  /* {
        value: "esri-featureServer-group",
        name: "Esri ArcGIS FeatureServer"
      }, */
  {
    value: "3d-tiles",
    name: keyFromSelector(($) => $.core.dataType["3d-tiles"])
  },
  {
    value: "open-street-map",
    name: keyFromSelector(($) => $.core.dataType["open-street-map"])
  },
  {
    value: "geojson",
    name: keyFromSelector(($) => $.core.dataType.geojson)
  },
  {
    value: "kml",
    name: keyFromSelector(($) => $.core.dataType.kml)
  },
  {
    value: "csv",
    name: keyFromSelector(($) => $.core.dataType.csv)
  },
  {
    value: "wmts-group",
    name: keyFromSelector(($) => $.core.dataType["wmts-group"])
  },
  {
    value: "carto",
    name: keyFromSelector(($) => $.core.dataType.carto)
  },
  {
    value: "czml",
    name: keyFromSelector(($) => $.core.dataType.czml)
  },
  {
    value: "gpx",
    name: keyFromSelector(($) => $.core.dataType.gpx)
  },
  {
    value: "georss",
    name: keyFromSelector(($) => $.core.dataType.geoRss)
  },
  {
    value: "shp",
    name: keyFromSelector(($) => $.core.dataType.shp)
  },
  {
    value: "wps-getCapabilities",
    name: keyFromSelector(($) => $.core.dataType["wps-getCapabilities"])
  },
  {
    value: "sdmx-group",
    name: keyFromSelector(($) => $.core.dataType["sdmx-group"])
  },
  {
    value: "opendatasoft-group",
    name: keyFromSelector(($) => $.core.dataType["opendatasoft-group"])
  },
  {
    value: "socrata-group",
    name: keyFromSelector(($) => $.core.dataType["socrata-group"])
  },
  {
    value: "gltf",
    name: keyFromSelector(($) => $.core.dataType.gltf)
  },
  {
    value: "json",
    name: keyFromSelector(($) => $.core.dataType.json)
  },
  {
    value: "cog",
    name: keyFromSelector(($) => $.core.dataType.cog)
  },
  {
    value: "i3s",
    name: keyFromSelector(($) => $.core.dataType.i3s)
  }
  // Add next builtin remote upload type
];

/**
 * List of builtin local upload types
 */
const builtinLocalDataTypes: LocalDataType[] = [
  {
    value: "auto",
    name: keyFromSelector(($) => $.core.dataType.auto)
  },
  {
    value: "geojson",
    name: keyFromSelector(($) => $.core.dataType.geojson),
    extensions: ["geojson"]
  },
  {
    value: "kml",
    name: keyFromSelector(($) => $.core.dataType.kml),
    extensions: ["kml", "kmz"]
  },
  {
    value: "csv",
    name: keyFromSelector(($) => $.core.dataType.csv),
    extensions: ["csv"]
  },
  {
    value: "czml",
    name: keyFromSelector(($) => $.core.dataType.czml),
    extensions: ["czml"]
  },
  {
    value: "gpx",
    name: keyFromSelector(($) => $.core.dataType.gpx),
    extensions: ["gpx"]
  },
  {
    value: "json",
    name: keyFromSelector(($) => $.core.dataType.json),
    extensions: ["json", "json5"]
  },
  {
    value: "georss",
    name: keyFromSelector(($) => $.core.dataType.geoRss),
    extensions: ["xml"]
  },
  {
    value: "gltf",
    name: keyFromSelector(($) => $.core.dataType.gltf),
    extensions: ["glb"]
  },
  {
    value: "shp",
    name: keyFromSelector(($) => $.core.dataType.shp),
    extensions: ["zip"]
  }

  // Add next builtin local upload type
];

/**
 * Custom remote data types. Add to it by calling addOrReplaceRemoteFileUploadType().
 */
export const customRemoteDataTypes: ObservableMap<string, RemoteDataType> =
  observable(new Map());

/**
 * Custom local data types. Add by calling addOrReplaceLocalFileUploadType().
 */
export const customLocalDataTypes: ObservableMap<string, LocalDataType> =
  observable(new Map());

export default function getDataTypes(): GetDataTypes {
  const uniqueRemoteDataTypes: Map<string, RemoteDataType> = new Map([
    ...(builtinRemoteDataTypes.map((dtype) => [dtype.value, dtype]) as [
      string,
      RemoteDataType
    ][]),
    ...customRemoteDataTypes.entries()
  ]);

  const uniqueLocalDataTypes: Map<string, LocalDataType> = new Map([
    ...(builtinLocalDataTypes.map((dtype) => [dtype.value, dtype]) as [
      string,
      LocalDataType
    ][]),
    ...customLocalDataTypes.entries()
  ]);

  return {
    remoteDataType: [...uniqueRemoteDataTypes.values()].map(translateDataType),
    localDataType: [...uniqueLocalDataTypes.values()].map(translateDataType)
  };
}

/**
 * Add a new data type to show in the supported file type listing when
 * uploading a file from the a remote server. If a data type with the same
 * `value` already exists, we replace it with the new one.
 *
 * @param key A key to use for identifying this upload type. To override a built-in type, pass `type` of the entry as key.
 * @param newRemoteDataType The new remote data type to be added.
 */
export const addOrReplaceRemoteFileUploadType = action(
  (key: string, newRemoteDataType: RemoteDataType) => {
    customRemoteDataTypes.set(key, newRemoteDataType);
  }
);

/**
 * Add a new data type to show in the supported file type listing when
 * uploading a file from the users local machine. If a data type with the same
 * `value` already exists, we replace it with the new one.
 *
 * @param key A key to use for identifying this upload type. To override a built-in type, pass `type` of the entry as key.
 * @param newLocalDataType The new local data type to be added.
 */
export const addOrReplaceLocalFileUploadType = action(
  (key: string, newLocalDataType: LocalDataType) => {
    customLocalDataTypes.set(key, newLocalDataType);
  }
);

function translateDataType<T extends DataType>(dataType: T): T {
  return {
    ...dataType,
    value: dataType.value,
    name: i18next.t(dataType.name as SelectorKey, {
      defaultValue: dataType.name
    }),
    description: dataType.description
      ? i18next.t(dataType.description as SelectorKey, {
          defaultValue: dataType.description
        })
      : undefined,
    customComponent: dataType.customComponent
  };
}
