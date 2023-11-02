import i18next from "i18next";
import { action, computed } from "mobx";
import RequestErrorEvent from "terriajs-cesium/Source/Core/RequestErrorEvent";
import Resource from "terriajs-cesium/Source/Core/Resource";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import flatten from "../../../Core/flatten";
import isDefined from "../../../Core/isDefined";
import { regexMatches } from "../../../Core/regexMatches";
import TerriaError from "../../../Core/TerriaError";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import ModelReference from "../../../Traits/ModelReference";
import SdmxCatalogGroupTraits from "../../../Traits/TraitsClasses/SdmxCatalogGroupTraits";
import CatalogGroup from "../CatalogGroup";
import CommonStrata from "../../Definition/CommonStrata";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumOrder from "../../Definition/StratumOrder";
import SdmxCatalogGroup from "./SdmxJsonCatalogGroup";
import SdmxJsonCatalogItem from "./SdmxJsonCatalogItem";
import {
  Agency,
  AgencyScheme,
  AgencySchemes,
  Categories,
  Categorisations,
  Category,
  CategoryScheme,
  CategorySchemes,
  Dataflow,
  Dataflows,
  SdmxJsonStructureMessage
} from "./SdmxJsonStructureMessage";

export interface SdmxServer {
  agencySchemes?: AgencySchemes;
  categorySchemes?: CategorySchemes;
  categorisations?: Categorisations;
  dataflows: Dataflows;
}

export class SdmxServerStratum extends LoadableStratum(SdmxCatalogGroupTraits) {
  static stratumName = "sdmxServer";

  static async load(
    catalogGroup: SdmxCatalogGroup
  ): Promise<SdmxServerStratum> {
    // Load agency schemes (may be undefined)
    let agencySchemes = (
      await loadSdmxJsonStructure(
        proxyCatalogItemUrl(catalogGroup, `${catalogGroup.url}/agencyscheme/`),
        true
      )
    )?.data?.agencySchemes;

    // Load category schemes (may be undefined)
    let categorySchemeResponse = await loadSdmxJsonStructure(
      proxyCatalogItemUrl(
        catalogGroup,
        `${catalogGroup.url}/categoryscheme?references=parentsandsiblings`
      ),
      true
    );

    let dataflows = categorySchemeResponse?.data?.dataflows;

    // If no dataflows from category schemes -> try getting all of them through `dataflow` endpoint
    if (!isDefined(dataflows)) {
      dataflows = (
        await loadSdmxJsonStructure(
          proxyCatalogItemUrl(catalogGroup, `${catalogGroup.url}/dataflow/`),
          true
        )
      )?.data?.dataflows;

      if (!isDefined(dataflows)) {
        throw new TerriaError({
          title: i18next.t("models.sdmxServerStratum.loadDataErrorTitle"),
          message: i18next.t("models.sdmxServerStratum.loadDataErrorMessage")
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

  duplicateLoadableStratum(model: BaseModel): this {
    return new SdmxServerStratum(
      model as SdmxCatalogGroup,
      this.sdmxServer
    ) as this;
  }

  private readonly dataflowTree: DataflowTree = {};

  constructor(
    private readonly catalogGroup: SdmxCatalogGroup,
    private readonly sdmxServer: SdmxServer
  ) {
    super();

    // If categorisations exist => organise Dataflows into a tree!
    if (isDefined(this.sdmxServer.categorisations)) {
      this.sdmxServer.categorisations.forEach((categorisiation) => {
        const categorySchemeUrn = parseSdmxUrn(categorisiation.target);

        const agencyId = categorySchemeUrn?.agencyId;
        const categorySchemeId = categorySchemeUrn?.resourceId;
        const categoryIds = categorySchemeUrn?.descendantIds; // Only support 1 level of categorisiation for now

        const dataflowId = parseSdmxUrn(categorisiation.source)?.resourceId;

        if (
          !isDefined(agencyId) ||
          !isDefined(categorySchemeId) ||
          !isDefined(categoryIds) ||
          !isDefined(dataflowId)
        )
          return;

        let agencyNode = this.dataflowTree[agencyId];

        // Create agency node if it doesn't exist
        if (!isDefined(agencyNode)) {
          const agency = this.getAgency(agencyId);
          if (!isDefined(agency)) return;

          this.dataflowTree[agencyId] = {
            type: "agencyScheme",
            item: agency,
            members: {}
          };

          agencyNode = this.dataflowTree[agencyId];
        }

        let categorySchemeNode = agencyNode.members![categorySchemeId];

        // Create categoryScheme node if it doesn't exist
        if (!isDefined(categorySchemeNode)) {
          const categoryScheme = this.getCategoryScheme(categorySchemeId);
          if (!isDefined(categoryScheme)) return;
          agencyNode.members![categorySchemeId] = {
            type: "categoryScheme",
            item: categoryScheme,
            members: {}
          };

          categorySchemeNode = agencyNode.members![categorySchemeId];
        }

        let categoryParentNode = categorySchemeNode;

        // Make category nodes (may be nested)
        categoryIds.forEach((categoryId) => {
          // Create category node if it doesn't exist
          if (!isDefined(categoryParentNode.members![categoryId])) {
            let category: Category | undefined;

            // Find current categoryId in parent categoryScheme or parent category
            if (categoryParentNode.type === "categoryScheme") {
              category = this.getCategoryFromCatagoryScheme(
                categorySchemeId,
                categoryId
              );
            } else if (categoryParentNode.type === "category") {
              category = this.getCategoryFromCategories(
                categoryParentNode.item?.categories,
                categoryId
              );
            }
            if (!isDefined(category)) return;
            categoryParentNode.members![categoryId] = {
              type: "category",
              item: category,
              members: {}
            };
          }
          // Swap parent node to newly created category node
          categoryParentNode = categoryParentNode.members![categoryId];
        });

        // Create dataflow!
        const dataflow = this.getDataflow(dataflowId);
        if (!isDefined(dataflow)) return;
        categoryParentNode.members![dataflowId] = {
          type: "dataflow",
          item: dataflow
        };
      });
      // No categorisations exist => add flat list of dataflows
    } else {
      this.dataflowTree = this.sdmxServer.dataflows.reduce<DataflowTree>(
        (tree, dataflow) => {
          if (isDefined(dataflow.id)) {
            tree[dataflow.id] = { type: "dataflow", item: dataflow };
          }
          return tree;
        },
        {}
      );
    }
  }

  @computed
  get members(): ModelReference[] {
    // Find first node in tree which has more than 1 child
    const findRootGroup = (node: DataflowTreeNode): DataflowTreeNode => {
      const children: DataflowTreeNode[] | undefined = isDefined(node?.members)
        ? Object.values(node!.members)
        : undefined;

      // If only 1 child -> keep searching
      return isDefined(children) && children.length === 1
        ? findRootGroup(children[0])
        : node;
    };

    let rootTreeNodes = Object.values(this.dataflowTree);

    // If only a single group -> try to find next nested group with more than 1 child
    if (rootTreeNodes.length === 1 && isDefined(rootTreeNodes[0])) {
      rootTreeNodes = Object.values(
        findRootGroup(rootTreeNodes[0]).members ?? this.dataflowTree
      );
    }

    return rootTreeNodes.map((node) => this.getMemberId(node));
  }

  createMembers() {
    Object.values(this.dataflowTree).forEach((node) =>
      this.createMemberFromLayer(node)
    );
  }

  @action
  createMemberFromLayer(node: DataflowTreeNode) {
    const layerId = this.getMemberId(node);

    if (!layerId) {
      return;
    }

    // Replace the stratum inherited from the parent group.

    // If has nested layers -> create model for CatalogGroup
    if (node.members && Object.keys(node.members).length > 0) {
      // Create nested layers

      Object.values(node.members).forEach((member) =>
        this.createMemberFromLayer(member)
      );

      // Create group
      const existingGroupModel = this.catalogGroup.terria.getModelById(
        CatalogGroup,
        layerId
      );

      let groupModel: CatalogGroup;
      if (existingGroupModel === undefined) {
        groupModel = new CatalogGroup(layerId, this.catalogGroup.terria);
        this.catalogGroup.terria.addModel(groupModel);
      } else {
        groupModel = existingGroupModel;
      }

      groupModel.setTrait(
        CommonStrata.definition,
        "name",
        node.item.name || node.item.id
      );
      groupModel.setTrait(
        CommonStrata.definition,
        "members",
        filterOutUndefined(
          Object.values(node.members).map((member) => this.getMemberId(member))
        )
      );

      // Set group description
      if (node.item.description) {
        groupModel.setTrait(
          CommonStrata.definition,
          "description",
          node.item.description
        );
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

    const existingItemModel = this.catalogGroup.terria.getModelById(
      SdmxJsonCatalogItem,
      layerId
    );

    let itemModel: SdmxJsonCatalogItem;
    if (existingItemModel === undefined) {
      itemModel = new SdmxJsonCatalogItem(
        layerId,
        this.catalogGroup.terria,
        undefined
      );
      this.catalogGroup.terria.addModel(itemModel);
    } else {
      itemModel = existingItemModel;
    }

    itemModel.strata.delete(CommonStrata.definition);

    itemModel.setTrait(
      CommonStrata.definition,
      "name",
      node.item.name || node.item.id
    );
    itemModel.setTrait(CommonStrata.definition, "url", this.catalogGroup.url);
    // Set group description
    if (node.item.description) {
      itemModel.setTrait(
        CommonStrata.definition,
        "description",
        node.item.description
      );
    }

    itemModel.setTrait(
      CommonStrata.definition,
      "agencyId",
      node.item.agencyID as string
    );
    itemModel.setTrait(CommonStrata.definition, "dataflowId", node.item.id);

    itemModel.setTrait(
      CommonStrata.definition,
      "modelOverrides",
      this.catalogGroup.traits.modelOverrides.toJson(
        this.catalogGroup.modelOverrides
      )
    );
  }

  getMemberId(node: DataflowTreeNode) {
    return `${this.catalogGroup.uniqueId}/${node.type}-${node.item.id}`;
  }

  getDataflow(id?: string) {
    if (!isDefined(id)) return;
    return this.sdmxServer.dataflows.find((d) => d.id === id);
  }

  getCategoryScheme(id?: string) {
    if (!isDefined(id)) return;
    return this.sdmxServer.categorySchemes?.find((d) => d.id === id);
  }

  getCategoryFromCatagoryScheme(
    categoryScheme: CategoryScheme | string | undefined,
    id?: string
  ) {
    if (!isDefined(id)) return;
    let resolvedCategoryScheme =
      typeof categoryScheme === "string"
        ? this.getCategoryScheme(categoryScheme)
        : categoryScheme;

    return this.getCategoryFromCategories(
      resolvedCategoryScheme?.categories,
      id
    );
  }

  getCategoryFromCategories(categories: Categories | undefined, id?: string) {
    return isDefined(id) ? categories?.find((c) => c.id === id) : undefined;
  }

  getAgency(id?: string) {
    if (!isDefined(id)) return;

    const agencies = this.sdmxServer.agencySchemes?.map(
      (agencyScheme) => agencyScheme.agencies
    );

    if (!isDefined(agencies)) return;

    return flatten(filterOutUndefined(agencies)).find(
      (d) => d.id === id
    ) as Agency;
  }
}

StratumOrder.addLoadStratum(SdmxServerStratum.stratumName);

export function parseSdmxUrn(urn?: string) {
  if (!isDefined(urn)) return;
  // Format urn:sdmx:org.sdmx.infomodel.xxx.xxx=AGENCY:RESOURCEID(VERSION).SUBRESOURCEID.SUBSUBRESOURCEID...
  // Example urn:sdmx:org.sdmx.infomodel.categoryscheme.Category=SPC:CAS_COM_TOPIC(1.0).ECO

  // Sub resource ID and (and sub sub...) are optional
  const matches = regexMatches(/.+=(.+):(.+)\((.+)\)\.*(.*)/g, urn);

  if (
    matches.length >= 1 &&
    matches[0].length >= 3 &&
    !isDefined([0, 1, 2].find((idx) => matches[0][idx] === null))
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
    // If SDMX server has returned an error message
    if (error instanceof RequestErrorEvent && isDefined(error.response)) {
      if (!allowNotImplemeted) {
        throw new TerriaError({
          title: i18next.t(
            "models.sdmxServerStratum.sdmxStructureLoadErrorTitle"
          ),
          message: sdmxErrorString.has(error.statusCode)
            ? `${sdmxErrorString.get(error.statusCode)}: ${error.response}`
            : `${error.response}`
        });
      }
      // Not sure what happened (maybe CORS)
    } else if (!allowNotImplemeted) {
      throw new TerriaError({
        title: i18next.t(
          "models.sdmxServerStratum.sdmxStructureLoadErrorTitle"
        ),
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

export enum SdmxHttpErrorCodes {
  // SDMX to HTTP Error Mapping - taken from https://github.com/sdmx-twg/sdmx-rest/blob/7366f56ac08fe4eed758204e32d2e1ca62c78acf/v2_1/ws/rest/docs/4_7_errors.md#sdmx-to-http-error-mapping
  NoChanges = 304,
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

export const sdmxErrorString = new Map<SdmxHttpErrorCodes, string>();
sdmxErrorString.set(SdmxHttpErrorCodes.NoChanges, "No changes");
sdmxErrorString.set(SdmxHttpErrorCodes.NoResults, "No results");
sdmxErrorString.set(SdmxHttpErrorCodes.Unauthorized, "Unauthorised");
sdmxErrorString.set(SdmxHttpErrorCodes.ReponseTooLarge, "Response too large");
sdmxErrorString.set(SdmxHttpErrorCodes.SyntaxError, "Syntax error");
sdmxErrorString.set(SdmxHttpErrorCodes.SemanticError, "Semantic error");
sdmxErrorString.set(SdmxHttpErrorCodes.UriTooLong, "URI too long");
sdmxErrorString.set(SdmxHttpErrorCodes.ServerError, "Server error");
sdmxErrorString.set(SdmxHttpErrorCodes.NotImplemented, "Not implemented");
sdmxErrorString.set(
  SdmxHttpErrorCodes.ServiceUnavailable,
  "Service unavailable"
);
