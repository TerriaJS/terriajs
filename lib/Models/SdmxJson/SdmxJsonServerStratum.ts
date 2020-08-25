import LoadableStratum from "../LoadableStratum";
import SdmxCatalogGroupTraits, {
  SdmxCommonTraits
} from "../../Traits/SdmxCatalogGroupTraits";
import SdmxCatalogGroup from "./SdmxJsonCatalogGroup";
import { BaseModel } from "../Model";
import { computed, action, toJS } from "mobx";
import ModelReference from "../../Traits/ModelReference";
import StratumOrder from "../StratumOrder";
import {
  SdmxJsonStructureMessage,
  AgencySchemes,
  Categorisations,
  Dataflows,
  CategorySchemes,
  Dataflow,
  CategoryScheme,
  AgencyScheme,
  Category,
  Agency
} from "./SdmxJsonStructureMessage";
import TerriaError from "../../Core/TerriaError";
import isDefined from "../../Core/isDefined";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import filterOutUndefined from "../../Core/filterOutUndefined";
import CatalogGroup from "../CatalogGroupNew";
import CommonStrata from "../CommonStrata";
import createInfoSection from "../createInfoSection";
import { regexMatches } from "../../Core/regexMatches";
import flatten from "../../Core/flatten";
import SdmxJsonCatalogItem from "./SdmxJsonCatalogItem";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import Resource from "terriajs-cesium/Source/Core/Resource";

export interface SdmxServer {
  agencySchemes?: AgencySchemes;
  categorySchemes?: CategorySchemes;
  categorisations?: Categorisations;
  dataflows: Dataflows;
}

export class SdmxServerStratum extends LoadableStratum(SdmxCatalogGroupTraits) {
  static stratumName = "sdmxServer";
  private readonly dataflowTree: DataflowTree = {};

  constructor(
    private readonly catalogGroup: SdmxCatalogGroup,
    private readonly sdmxServer: SdmxServer
  ) {
    super();

    // TODO: move this stuff somewhere else (similar to WebMapServiceGetCapabilities)
    // If categorisations exist => organise Dataflows into a tree!
    if (isDefined(this.sdmxServer.categorisations)) {
      this.sdmxServer.categorisations.forEach(categorisiation => {
        const categorySchemeUrn = parseSdmxUrn(categorisiation.target);

        const agencyId = categorySchemeUrn?.agencyId;
        const categorySchemeId = categorySchemeUrn?.resourceId;
        const categoryId = categorySchemeUrn?.descendantIds?.[0]; // Only support 1 level of categorisiation for now

        const dataflowId = parseSdmxUrn(categorisiation.source)?.resourceId;

        if (
          !isDefined(agencyId) ||
          !isDefined(categorySchemeId) ||
          !isDefined(categoryId) ||
          !isDefined(dataflowId)
        )
          return;

        // Create agency node if it doesn't exist
        if (!isDefined(this.dataflowTree[agencyId])) {
          const agency = this.getAgency(agencyId);
          if (!isDefined(agency)) return;
          agency;
          this.dataflowTree[agencyId] = {
            type: "agencyScheme",
            item: agency,
            members: {}
          };
        }

        // Create categoryScheme node if it doesn't exist
        if (
          !isDefined(this.dataflowTree[agencyId].members![categorySchemeId])
        ) {
          const categoryScheme = this.getCategoryScheme(categorySchemeId);
          if (!isDefined(categoryScheme)) return;
          this.dataflowTree[agencyId].members![categorySchemeId] = {
            type: "categoryScheme",
            item: categoryScheme,
            members: {}
          };
        }

        // Create category node if it doesn't exist
        if (
          !isDefined(
            this.dataflowTree[agencyId].members![categorySchemeId].members![
              categoryId
            ]
          )
        ) {
          const category = this.getCategory(categorySchemeId, categoryId);
          if (!isDefined(category)) return;
          this.dataflowTree[agencyId].members![categorySchemeId].members![
            categoryId
          ] = { type: "category", item: category, members: {} };
        }

        // Create dataflow!
        const dataflow = this.getDataflow(dataflowId);
        if (!isDefined(dataflow)) return;
        this.dataflowTree[agencyId].members![categorySchemeId].members![
          categoryId
        ].members![dataflowId] = { type: "dataflow", item: dataflow };
      });
    }
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
        proxyCatalogItemUrl(catalogGroup, `${catalogGroup.url}/agencyscheme/`),
        true
      )
    )?.data?.agencySchemes;

    let categorySchemeResponse = await loadSdmxJsonStructure(
      proxyCatalogItemUrl(
        catalogGroup,
        `${catalogGroup.url}/categoryscheme?references=parentsandsiblings`
      ),
      true
    );

    let dataflows = categorySchemeResponse?.data?.dataflows;

    // If no dataflows -> try getting all of them through `dataflow` endpoint
    if (!isDefined(dataflows)) {
      dataflows = (
        await loadSdmxJsonStructure(
          proxyCatalogItemUrl(catalogGroup, `${catalogGroup.url}/dataflow/`),
          true
        )
      )?.data?.dataflows;

      if (!isDefined(dataflows)) {
        throw new TerriaError({
          title: "Failed to load SDMX group",
          message: "The server has no dataflows"
        });
      }
    }

    return new SdmxServerStratum(catalogGroup, {
      agencySchemes,
      categorySchemes: categorySchemeResponse?.data?.categorySchemes,
      categorisations: categorySchemeResponse?.data?.categorisations,
      dataflows
    });
  }

  @computed
  get members(): ModelReference[] {
    return Object.values(this.dataflowTree).map(node => this.getLayerId(node));
  }

  createMembers() {
    Object.values(this.dataflowTree).forEach(node =>
      this.createMemberFromLayer(node)
    );
  }

  @action
  createMemberFromLayer(node: DataflowTreeNode) {
    const layerId = this.getLayerId(node);

    if (!layerId) {
      return;
    }

    // If has nested layers -> create model for CatalogGroup
    if (node.members && Object.keys(node.members).length > 0) {
      // Create nested layers

      Object.values(node.members).forEach(member =>
        this.createMemberFromLayer(member)
      );

      // Create group
      const existingModel = this.catalogGroup.terria.getModelById(
        CatalogGroup,
        layerId
      );

      let model: CatalogGroup;
      if (existingModel === undefined) {
        model = new CatalogGroup(layerId, this.catalogGroup.terria);
        this.catalogGroup.terria.addModel(model);
      } else {
        model = existingModel;
      }

      model.setTrait(
        CommonStrata.underride,
        "name",
        node.item.name || node.item.id
      );
      model.setTrait(
        CommonStrata.underride,
        "members",
        filterOutUndefined(
          Object.values(node.members).map(member => this.getLayerId(member))
        )
      );

      // Set group `info` trait if applicable
      if (node.item.description) {
        model.setTrait(CommonStrata.underride, "info", [
          createInfoSection("Description", node.item.description)
        ]);
      }

      return;
    }

    // No nested layers (and type is dataflow) -> create model for SdmxJsonCatalogItem
    if (
      node.type !== "dataflow" ||
      !isDefined(node.item.id) ||
      !isDefined(node.item.agencyID)
    )
      return;

    const existingModel = this.catalogGroup.terria.getModelById(
      SdmxJsonCatalogItem,
      layerId
    );

    let model: SdmxJsonCatalogItem;
    if (existingModel === undefined) {
      model = new SdmxJsonCatalogItem(
        layerId,
        this.catalogGroup.terria,
        undefined
      );
      this.catalogGroup.terria.addModel(model);
    } else {
      model = existingModel;
    }

    // Replace the stratum inherited from the parent group.
    const stratum = CommonStrata.underride;

    model.strata.delete(stratum);

    model.setTrait(stratum, "name", node.item.name || node.item.id);
    model.setTrait(stratum, "url", this.catalogGroup.url);
    model.setTrait(stratum, "agencyId", node.item.agencyID as string);
    model.setTrait(stratum, "dataflowId", node.item.id);

    console.log(this.catalogGroup.regionTypeMap);
    // Copy over common traits
    model.setTrait(
      stratum,
      "regionTypeMap",
      this.catalogGroup.traits["regionTypeMap"].toJson(
        this.catalogGroup.regionTypeMap
      )
    );

    model.setTrait(stratum, "info", [
      createInfoSection("Description", node.item.description)
    ]);
  }

  getLayerId(node: DataflowTreeNode) {
    return `${this.catalogGroup.uniqueId}/${node.type}-${node.item.id}`;
  }

  // get categorySchemes(agencyId?:string) {
  //   this.sdmxServer.categorySchemes
  // }

  // get dataflowsForCategory(categorySchemeUrn:string) {
  //   const sources = this.sdmxServer.categorisations?.filter(cat => cat.target === categorySchemeUrn)?.map(cat => cat.source)
  //   return isDefined(sources) ? filterOutUndefined(sources) : []
  // }

  getDataflow(id?: string) {
    if (!isDefined(id)) return;
    return this.sdmxServer.dataflows.find(d => d.id === id);
  }

  getCategoryScheme(id?: string) {
    if (!isDefined(id)) return;
    return this.sdmxServer.categorySchemes?.find(d => d.id === id);
  }

  getCategory(
    categoryScheme: CategoryScheme | string | undefined,
    id?: string
  ) {
    if (!isDefined(id)) return;
    let resolvedCategoryScheme =
      typeof categoryScheme === "string"
        ? this.getCategoryScheme(categoryScheme)
        : categoryScheme;

    return resolvedCategoryScheme?.categories?.find(d => d.id === id);
  }

  getAgency(id?: string) {
    if (!isDefined(id)) return;

    const agencies = this.sdmxServer.agencySchemes?.map(
      agencyScheme => agencyScheme.agencies
    );

    if (!isDefined(agencies)) return;

    return flatten(filterOutUndefined(agencies)).find(
      d => d.id === id
    ) as Agency;
  }
}

type DataflowTreeNodeBase<T, I> = {
  type: T;
  item: I;
  members?: DataflowTree;
};

type DataflowTreeNodeAgencyScheme = DataflowTreeNodeBase<
  "agencyScheme",
  AgencyScheme
>;
type DataflowTreeNodeCategoryScheme = DataflowTreeNodeBase<
  "categoryScheme",
  CategoryScheme
>;
type DataflowTreeNodeCategory = DataflowTreeNodeBase<"category", Category>;
type DataflowTreeNodeDataflow = DataflowTreeNodeBase<"dataflow", Dataflow>;

type DataflowTreeNode =
  | DataflowTreeNodeAgencyScheme
  | DataflowTreeNodeCategoryScheme
  | DataflowTreeNodeCategory
  | DataflowTreeNodeDataflow;

type DataflowTree = { [key: string]: DataflowTreeNode };

StratumOrder.addLoadStratum(SdmxServerStratum.stratumName);

// function categorySchemeToUrn()

export function parseSdmxUrn(urn?: string) {
  if (!isDefined(urn)) return;
  // Format urn:sdmx:org.sdmx.infomodel.xxx.xxx=AGENCY:RESOURCEID(VERSION).SUBRESOURCEID.SUBSUBRESOURCEID...
  // Example urn:sdmx:org.sdmx.infomodel.categoryscheme.Category=SPC:CAS_COM_TOPIC(1.0).ECO

  // Sub resource ID and (and sub sub...) are optional
  const matches = regexMatches(/.+=(.+):(.+)\((.+)\)\.*(.*)/g, urn);

  if (
    matches.length >= 1 &&
    matches[0].length >= 3 &&
    !isDefined([0, 1, 2].find(idx => matches[0][idx] === null))
  ) {
    return {
      agencyId: matches[0][0],
      resourceId: matches[0][1],
      version: matches[0][2],
      descendantIds:
        matches[0][3] !== null ? matches[0][3].split(".") : undefined
    };
  }
}

export async function loadSdmxJsonStructure(
  url: string,
  allowNotImplemeted: false
): Promise<SdmxJsonStructureMessage>;
export async function loadSdmxJsonStructure(
  url: string,
  allowNotImplemeted: true
): Promise<SdmxJsonStructureMessage | undefined>;
export async function loadSdmxJsonStructure(
  url: string,
  allowNotImplemeted: boolean
) {
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
          title: `Could not load SDMX`,
          message: `Message from server: ${error.response}`
        });
      }
    } else {
      throw new TerriaError({
        title: `Could not load SDMX`,
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
