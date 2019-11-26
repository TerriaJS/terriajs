import i18next from "i18next";

module.exports = function() {
  return {
    remoteDataType: [
      {
        value: "auto",
        name: i18next.t("core.dataType.auto")
      },
      {
        value: "wms-getCapabilities",
        name: i18next.t("core.dataType.wms-getCapabilities")
      },
      {
        value: "wmts-getCapabilities",
        name: i18next.t("core.dataType.wmts-getCapabilities")
      },
      {
        value: "wfs-getCapabilities",
        name: i18next.t("core.dataType.wfs-getCapabilities")
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
      {
        value: "esri-featureServer",
        name: i18next.t("core.dataType.esri-featureServer")
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
        value: "czml",
        name: i18next.t("core.dataType.czml")
      },
      {
        value: "gpx",
        name: i18next.t("core.dataType.gpx")
      },
      {
        value: "other",
        name: i18next.t("core.dataType.other")
      }
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
        value: "other",
        name: i18next.t("core.dataType.other")
      }
    ]
  };
};
