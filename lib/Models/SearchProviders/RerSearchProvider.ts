import { makeObservable, runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import { Category } from "../../Core/AnalyticEvents/analyticEvents";
import loadJson from "../../Core/loadJson";
import LocationSearchProviderMixin from "../../ModelMixins/SearchProviders/LocationSearchProviderMixin";
import CreateModel from "../Definition/CreateModel";
import Terria from "../Terria";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";
import LocationSearchProviderTraits, {
  SearchProviderMapCenterTraits
} from "../../Traits/SearchProviders/LocationSearchProviderTraits";
import mixTraits from "../../Traits/mixTraits";

export default class RerSearchProvider extends LocationSearchProviderMixin(
  CreateModel(
    mixTraits(LocationSearchProviderTraits, SearchProviderMapCenterTraits)
  )
) {
  handle?: string;

  static readonly type = "rer-search-provider";

  get type() {
    return RerSearchProvider.type;
  }

  get urlHandle() {
    return `${this.url}?serviceType=DBServices&serviceName=Normalizzatore&message=GetHandle`;
  }

  get urlAddress() {
    return `${this.url}?serviceType=DBServices&serviceName=Normalizzatore&message=Norm_Indirizzo_Unico_Area`;
  }

  constructor(uniqueId: string | undefined, terria: Terria) {
    super(uniqueId, terria);

    makeObservable(this);
  }

  protected logEvent(searchText: string) {
    this.terria.analytics?.logEvent(Category.search, "Rer", searchText);
  }

  protected async getHandle(searchResults: SearchProviderResults) {
    const response = await loadJson(
      this.urlHandle,
      {
        soapAction: this.urlHandle
      },
      {
        GetHandleInputParams: {
          p_Username: "commercio",
          p_Userpassword: "MAy64T7cc76ASn3CaJX8"
        }
      }
    ).catch((e) => {
      console.log(e);
      searchResults.message = {
        content: "translate#viewModels.searchErrorOccurred"
      };
      return;
    });
    return response.getHandleOutput.getHandleOutputParams.p_Handle;
  }

  parseResults(results: any): any[] {
    const idSet = new Set();
    const locations: any[] = [];

    results
      .sort((a: any, b: any) => {
        return +a.gR_AFFIDABILITA - +b.gR_AFFIDABILITA;
      })
      .forEach(
        (element: {
          sTRADARIO_ID: string;
          cIVICO_X: string;
          cENTR_X: string;
          cIVICO_Y: string;
          cENTR_Y: string;
          dUG: string;
          dENOMINAZIONE: string;
          dESCRIZIONE_CIVICO: string;
          cOMUNE: string;
          pROVINCIA: string;
          gR_AFFIDABILITA: string;
        }) => {
          if (!idSet.has(element.sTRADARIO_ID)) {
            const isHouseNumber = element.cIVICO_X !== "";
            const centerX = parseFloat(
              isHouseNumber ? element.cIVICO_X : element.cENTR_X
            );
            const centerY = parseFloat(
              isHouseNumber ? element.cIVICO_Y : element.cENTR_Y
            );
            locations.push(
              new SearchResult({
                name:
                  element.dUG +
                  " " +
                  element.dENOMINAZIONE +
                  (isHouseNumber ? " " + element.dESCRIZIONE_CIVICO : "") +
                  ", " +
                  element.cOMUNE +
                  ", " +
                  element.pROVINCIA,
                isImportant: parseFloat(element.gR_AFFIDABILITA) < 1,
                location: {
                  latitude: isNaN(centerY) ? 0 : centerY,
                  longitude: isNaN(centerX) ? 0 : centerX
                },
                clickAction: createZoomToFunction(
                  this,
                  centerX,
                  centerY,
                  isHouseNumber
                )
              })
            );
            idSet.add(element.sTRADARIO_ID);
          }
        }
      );

    return locations;
  }

  protected async doSearch(
    searchText: string,
    searchResults: SearchProviderResults
  ): Promise<void> {
    searchResults.results.length = 0;
    searchResults.message = undefined;

    if (searchText === undefined || /^\s*$/.test(searchText)) {
      return Promise.resolve();
    }

    if (!this.handle) {
      this.handle = await this.getHandle(searchResults);
    }

    const rect = this.terria.currentViewer.getCurrentCameraView().rectangle;

    const results = await loadJson(
      this.urlAddress,
      {
        soapAction: this.urlAddress
      },
      {
        Norm_Indirizzo_Unico_AreaInputParams: {
          p_Indirizzo: searchText,
          p_Tipo_Coord: "WGS84",
          p_Rif_Geo_Civ: "ECIV",
          p_Handle: this.handle,
          p_minx: `${CesiumMath.toDegrees(rect.west)}`,
          p_miny: `${CesiumMath.toDegrees(rect.south)}`,
          p_maxx: `${CesiumMath.toDegrees(rect.east)}`,
          p_maxy: `${CesiumMath.toDegrees(rect.north)}`
        }
      }
    );

    const locations = this.parseResults(
      results.norm_Indirizzo_Unico_AreaOutput
        .norm_Indirizzo_Unico_AreaOutputRecordsetArray
    );

    runInAction(() => {
      searchResults.results.push(...locations);
    });

    if (searchResults.results.length === 0) {
      searchResults.message = {
        content: "translate#viewModels.searchNoLocations"
      };
    }
  }
}

function createZoomToFunction(
  model: RerSearchProvider,
  centerX: number,
  centerY: number,
  isHouseNumber: boolean
) {
  if (isNaN(centerX) || isNaN(centerY)) {
    return function () {
      console.log("Bad coordinate: can't use Nan!");
    };
  }

  const delta = isHouseNumber ? 0.0025 : 0.005;
  const rectangle = Rectangle.fromDegrees(
    centerX - delta,
    centerY - delta,
    centerX + delta,
    centerY + delta
  );

  return function () {
    const terria = model.terria;
    terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
  };
}
