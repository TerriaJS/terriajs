const i18next = require("i18next").default;

module.exports = function() {
  return {
    remoteDataType: [
      {
        value: "auto",
        name: i18next.t("core.dataType.auto")
      },
      {
        value: "wms-group",
        name: i18next.t("core.dataType.wms-group")
      },
      {
        value: "wfs-group",
        name: i18next.t("core.dataType.wfs-group")
      },
      {
        value: "esri-group",
        name: i18next.t("core.dataType.esri-group")
      },
      // esri-group is registered with ArcGisCatalogGroup, which can read REST, MapServer and FeatureServer groups.
      // So we do not need to explicitly include esri-mapServer-group or esri-featureServer-group here.
      {
        value: "esri-mapServer",
        name: i18next.t("core.dataType.esri-mapServer")
      },
      /* {
        value: "esri-mapServer-group",
        name: "Esri ArcGIS MapServer"
      }, */
      {
        value: "esri-featureServer",
        name: i18next.t("core.dataType.esri-featureServer")
      },
      // to be removed once ArcGisCatalogGroup is implemented
      /* {
        value: "esri-featureServer-group",
        name: "Esri ArcGIS FeatureServer"
      }, */
      {
        value: "3d-tiles",
        name: i18next.t("core.dataType.3d-tiles")
      },
      {
        value: "open-street-map",
        name: i18next.t("core.dataType.open-street-map")
      },
      {
        value: "geojson",
        name: i18next.t("core.dataType.geojson")
      },
      {
        value: "kml",
        name: i18next.t("core.dataType.kml")
      },
      {
        value: "csv",
        name: i18next.t("core.dataType.csv")
      },
      {
        value: "wmts-group",
        name: i18next.t("core.dataType.wmts-group")
      },
      {
        value: "carto",
        name: i18next.t("core.dataType.carto")
      },
      {
        value: "czml",
        name: i18next.t("core.dataType.czml")
      },
      {
        value: "gpx",
        name: i18next.t("core.dataType.gpx")
      },
      {
        value: "georss",
        name: i18next.t("core.dataType.geoRss")
      },
      {
        value: "shp",
        name: i18next.t("core.dataType.shp")
      },
      {
        value: "wps-getCapabilities",
        name: i18next.t("core.dataType.wps-getCapabilities")
      },
      {
        value: "sdmx-group",
        name: i18next.t("core.dataType.sdmx-group")
      },
      {
        value: "opendatasoft-group",
        name: i18next.t("core.dataType.opendatasoft-group")
      }
      // {
      //   value: "other",
      //   name: i18next.t("core.dataType.other")
      // }
    ],
    localDataType: [
      {
        value: "auto",
        name: i18next.t("core.dataType.auto")
      },
      {
        value: "geojson",
        name: i18next.t("core.dataType.geojson"),
        extensions: ["geojson"]
      },
      {
        value: "kml",
        name: i18next.t("core.dataType.kml"),
        extensions: ["kml", "kmz"]
      },
      {
        value: "csv",
        name: i18next.t("core.dataType.csv"),
        extensions: ["csv"]
      },
      {
        value: "czml",
        name: i18next.t("core.dataType.czml"),
        extensions: ["czml"]
      },
      {
        value: "gpx",
        name: i18next.t("core.dataType.gpx"),
        extensions: ["gpx"]
      },
      {
        value: "json",
        name: i18next.t("core.dataType.json"),
        extensions: ["json", "json5"]
      },
      {
        value: "georss",
        name: i18next.t("core.dataType.geoRss"),
        extensions: ["xml"]
      },
      // {
      //   value: "other",
      //   name: i18next.t("core.dataType.other")
      // }
      {
        value: "gltf",
        name: i18next.t("core.dataType.gltf"),
        extensions: ["glb"]
      },
      {
        value: "shp",
        name: i18next.t("core.dataType.shp"),
        extensions: ["zip"]
      }
    ]
  };
};
