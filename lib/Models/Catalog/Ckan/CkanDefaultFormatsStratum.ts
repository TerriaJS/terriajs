import CkanResourceFormatTraits from "../../../Traits/TraitsClasses/CkanResourceFormatTraits";
import CkanSharedTraits from "../../../Traits/TraitsClasses/CkanSharedTraits";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";

export default class CkanDefaultFormatsStratum extends LoadableStratum(
  CkanSharedTraits
) {
  static stratumName = "ckanDefaultFormats";

  duplicateLoadableStratum(newModel: BaseModel): this {
    return new CkanDefaultFormatsStratum() as this;
  }

  get supportedResourceFormats() {
    return [
      {
        id: "GeoJson",
        formatRegex: "^geojson$",
        // Limit geojson files to 150 MB
        maxFileSize: 150,
        definition: {
          type: "geojson"
        }
      },
      {
        id: "Shapefile",
        formatRegex: "shapefile|shp|zip (shp)",
        urlRegex: ".zip$",
        // Limit shapefiles to 100 MB
        maxFileSize: 100,
        definition: {
          type: "shp"
        }
      },
      {
        id: "WMS",
        formatRegex: "^wms$",
        definition: {
          type: "wms"
        }
      },
      {
        id: "ArcGIS MapServer",
        formatRegex: "^esri rest$|^arcgis geoservices rest api$",
        urlRegex: "MapServer",
        definition: {
          type: "esri-mapServer"
        }
      },
      {
        id: "Czml",
        formatRegex: "^czml$",
        // Limit CZML files to 50 MB
        maxFileSize: 50,
        definition: {
          type: "czml"
        }
      },
      {
        id: "ArcGIS FeatureServer",
        formatRegex: "^esri rest$|^arcgis geoservices rest api$",
        urlRegex: "FeatureServer",
        definition: {
          type: "esri-featureServer"
        }
      },
      {
        id: "CSV",
        formatRegex: "^csv-geo-",
        definition: {
          type: "csv"
        }
      },
      {
        id: "Kml",
        formatRegex: "^km[lz]$",
        // Limit KML files to 30 MB
        maxFileSize: 30,
        definition: {
          type: "kml"
        }
      }
    ].map((format) => createStratumInstance(CkanResourceFormatTraits, format));
  }
}

StratumOrder.addDefaultStratum(CkanDefaultFormatsStratum.stratumName);
