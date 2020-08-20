import LoadableStratum from "../LoadableStratum";
import SdmxCatalogGroupTraits from "../../Traits/SdmxCatalogGroupTraits";
import SdmxCatalogGroup from "./SdmxJsonCatalogGroup";
import { BaseModel } from "../Model";
import { computed } from "mobx";
import ModelReference from "../../Traits/ModelReference";
import StratumOrder from "../StratumOrder";
import {
  SdmxJsonStructureMessage,
  AgencySchemes,
  Categorisations,
  Dataflows,
  CategorySchemes
} from "./SdmxJsonStructureMessage";
import { Resource, RequestErrorEvent } from "terriajs-cesium";
import TerriaError from "../../Core/TerriaError";
import isDefined from "../../Core/isDefined";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";

export interface SdmxServer {
  agencySchemes?: AgencySchemes;
  categorySchemes?: CategorySchemes;
  categorisations?: Categorisations;
  dataflows: Dataflows;
}

export class SdmxServerStratum extends LoadableStratum(SdmxCatalogGroupTraits) {
  static stratumName = "sdmxServer";

  constructor(
    readonly _catalogGroup: SdmxCatalogGroup,
    private readonly sdmxServer: SdmxServer
  ) {
    super();
    console.log(this.sdmxServer);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new SdmxServerStratum(
      model as SdmxCatalogGroup,
      this.sdmxServer
    ) as this;
  }

  static async load(
    catalogGroup: SdmxCatalogGroup
  ): Promise<SdmxServerStratum> {
    let agencySchemes = (
      await loadSdmxJsonStructure(
        proxyCatalogItemUrl(
          catalogGroup,
          "https://stats-nsi-stable.pacificdata.org/rest/agencyscheme/"
        ),
        true
      )
    )?.data?.agencySchemes;

    let categorySchemes = (
      await loadSdmxJsonStructure(
        proxyCatalogItemUrl(
          catalogGroup,
          "https://stats-nsi-stable.pacificdata.org/rest/categoryscheme/"
        ),
        true
      )
    )?.data?.categorySchemes;

    let categorisations = (
      await loadSdmxJsonStructure(
        proxyCatalogItemUrl(
          catalogGroup,
          "https://stats-nsi-stable.pacificdata.org/rest/categorisation/"
        ),
        true
      )
    )?.data?.categorisations;

    let dataflows = (
      await loadSdmxJsonStructure(
        proxyCatalogItemUrl(
          catalogGroup,
          "https://stats-nsi-stable.pacificdata.org/rest/dataflow/"
        ),
        true
      )
    )?.data?.dataflows;

    if (!isDefined(dataflows)) {
      throw new TerriaError({
        title: "Failed to load SDMX group",
        message: "The server has no dataflows"
      });
    }

    return new SdmxServerStratum(catalogGroup, {
      agencySchemes,
      categorySchemes,
      categorisations,
      dataflows
    });
  }

  @computed
  get members(): ModelReference[] {
    return [];
  }
}

StratumOrder.addLoadStratum(SdmxServerStratum.stratumName);

async function loadSdmxJsonStructure(
  url: string,
  allowNotImplemeted: false
): Promise<SdmxJsonStructureMessage>;
async function loadSdmxJsonStructure(
  url: string,
  allowNotImplemeted: true
): Promise<SdmxJsonStructureMessage | undefined>;
async function loadSdmxJsonStructure(url: string, allowNotImplemeted: boolean) {
  try {
    return JSON.parse(
      await new Resource({
        url,
        headers: {
          Accept:
            "application/vnd.sdmx.structure+json; charset=utf-8; version=1.0"
        }
      }).fetch()
    ) as SdmxJsonStructureMessage;
  } catch (error) {
    if (error instanceof RequestErrorEvent) {
      if (
        !allowNotImplemeted ||
        (allowNotImplemeted &&
          error.statusCode !== SdmxHttpErrorCodes.NotImplemented)
      ) {
        throw new TerriaError({
          title: "Could not load SDMX group",
          message: `Message from server: ${error.response}`
        });
      }
    } else {
      throw new TerriaError({
        title: "Could not load SDMX group",
        message: `Unkown error occurred${
          isDefined(error)
            ? typeof error === "string"
              ? `: ${error}`
              : `: ${JSON.stringify(error)}`
            : ""
        }`
      });
    }
  }
}

export enum SdmxHttpErrorCodes {
  // SDMX to HTTP Error Mapping - taken from https://github.com/sdmx-twg/sdmx-rest/blob/7366f56ac08fe4eed758204e32d2e1ca62c78acf/v2_1/ws/rest/docs/4_7_errors.md#sdmx-to-http-error-mapping
  NoChages = 304,
  // 100 No results found = 404 Not found
  NoResults = 404,
  // 110 Unauthorized = 401 Unauthorized
  Unauthorized = 401,
  // 130 Response too large due to client request = 413 Request entity too large
  // 510 Response size exceeds service limit = 413 Request entity too large
  ReponseTooLarge = 413,
  // 140 Syntax error = 400 Bad syntax
  SyntaxError = 400,
  // 150 Semantic error = 403 Forbidden
  SemanticError = 403,
  UriTooLong = 414,
  // 500 Internal Server error = 500 Internal server error
  // 1000+ = 500 Internal server error
  ServerError = 500,
  // 501 Not implemented = 501 Not implemented
  NotImplemented = 501,
  // 503 Service unavailable = 503 Service unavailable
  ServiceUnavailable = 503
}
