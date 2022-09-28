import i18next from "i18next";
import { action, computed, runInAction } from "mobx";
import containsAny from "../../../Core/containsAny";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import runLater from "../../../Core/runLater";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GetCapabilitiesMixin from "../../../ModelMixins/GetCapabilitiesMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import ModelReference from "../../../Traits/ModelReference";
import WebMapTileServiceCatalogGroupTraits from "../../../Traits/TraitsClasses/WebMapTileServiceCatalogGroupTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import WebMapTileServiceCapabilities, {
  WmtsLayer
} from "./WebMapTileServiceCapabilities";
import WebMapTileServiceCatalogItem from "./WebMapTileServiceCatalogItem";

class GetCapabilitiesStratum extends LoadableStratum(
  WebMapTileServiceCatalogGroupTraits
) {
  static async load(
    catalogItem: WebMapTileServiceCatalogGroup
  ): Promise<GetCapabilitiesStratum> {
    if (catalogItem.getCapabilitiesUrl === undefined) {
      throw networkRequestError({
        title: i18next.t(
          "models.webMapTileServiceCatalogGroup.invalidWMTSServerTitle"
        ),
        message: i18next.t(
          "models.webMapTileServiceCatalogGroup.invalidWMTSServerMessage",
          this
        )
      });
    }

    const capabilities = await WebMapTileServiceCapabilities.fromUrl(
      proxyCatalogItemUrl(
        catalogItem,
        catalogItem.getCapabilitiesUrl,
        catalogItem.getCapabilitiesCacheDuration
      )
    );
    return new GetCapabilitiesStratum(catalogItem, capabilities);
  }

  constructor(
    readonly catalogGroup: WebMapTileServiceCatalogGroup,
    readonly capabilities: WebMapTileServiceCapabilities
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new GetCapabilitiesStratum(
      model as WebMapTileServiceCatalogGroup,
      this.capabilities
    ) as this;
  }

  @computed
  get name() {
    if (
      this.capabilities &&
      this.capabilities.ServiceIdentification &&
      this.capabilities.ServiceIdentification.Title
    ) {
      return replaceUnderscores(this.capabilities.ServiceIdentification.Title);
    }
  }

  @computed
  get info() {
    const result: StratumFromTraits<InfoSectionTraits>[] = [];
    const service = this.capabilities.ServiceIdentification;
    if (!isDefined(service)) {
      return result;
    }
    if (
      service.Abstract &&
      !containsAny(
        service.Abstract,
        WebMapTileServiceCatalogItem.abstractsToIgnore
      )
    ) {
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t("models.webMapTileServiceCatalogGroup.abstract"),
          content: service.Abstract
        })
      );
    }

    if (
      service.AccessConstraints &&
      !/^none$/i.test(service.AccessConstraints)
    ) {
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t(
            "models.webMapTileServiceCatalogGroup.accessConstraints"
          ),
          content: service.AccessConstraints
        })
      );
    }

    // Show the Fees if it isn't "none".
    if (service.Fees && !/^none$/i.test(service.Fees)) {
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t("models.webMapTileServiceCatalogGroup.fees"),
          content: service.Fees
        })
      );
    }

    return result;
  }

  // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).

  @computed
  get members(): ModelReference[] {
    return filterOutUndefined(
      this.capabilities.layers.map((layer) => this.getLayerId(layer))
    );
  }

  @action
  createMembersFromLayers() {
    this.capabilities.layers.forEach((layer) =>
      this.createMemberFromLayer(layer)
    );
  }

  @action
  createMemberFromLayer(layer: WmtsLayer) {
    const layerId = this.getLayerId(layer);
    if (!layerId) {
      return;
    }

    // Create model for WMTSCatalogItem
    const existingModel = this.catalogGroup.terria.getModelById(
      WebMapTileServiceCatalogItem,
      layerId
    );

    let model: WebMapTileServiceCatalogItem;

    if (existingModel === undefined) {
      model = new WebMapTileServiceCatalogItem(
        layerId,
        this.catalogGroup.terria
      );

      this.catalogGroup.terria.addModel(model);
    } else {
      model = existingModel;
    }

    // Replace the stratum inherited from the parent group.
    model.strata.delete(CommonStrata.definition);

    model.setTrait(CommonStrata.definition, "name", layer.Title);

    model.setTrait(CommonStrata.definition, "url", this.catalogGroup.url);
    model.setTrait(
      CommonStrata.definition,
      "getCapabilitiesUrl",
      this.catalogGroup.getCapabilitiesUrl
    );
    model.setTrait(
      CommonStrata.definition,
      "getCapabilitiesCacheDuration",
      this.catalogGroup.getCapabilitiesCacheDuration
    );
    model.setTrait(CommonStrata.definition, "layer", layer.Title);
    model.setTrait(
      CommonStrata.definition,
      "hideSource",
      this.catalogGroup.hideSource
    );
    model.setTrait(
      CommonStrata.definition,
      "isOpenInWorkbench",
      this.catalogGroup.isOpenInWorkbench
    );
    model.setTrait(
      CommonStrata.definition,
      "isExperiencingIssues",
      this.catalogGroup.isExperiencingIssues
    );
    model.createGetCapabilitiesStratumFromParent(this.capabilities);
  }

  getLayerId(layer: WmtsLayer) {
    if (!isDefined(this.catalogGroup.uniqueId)) {
      return;
    }
    return `${this.catalogGroup.uniqueId}/${layer.Title || layer.Identifier}`;
  }
}

export default class WebMapTileServiceCatalogGroup extends GetCapabilitiesMixin(
  UrlMixin(
    GroupMixin(
      CatalogMemberMixin(CreateModel(WebMapTileServiceCatalogGroupTraits))
    )
  )
) {
  static readonly type = "wmts-group";

  get type() {
    return WebMapTileServiceCatalogGroup.type;
  }

  protected async forceLoadMetadata() {
    if (
      this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName) !==
      undefined
    )
      return;
    const stratum = await GetCapabilitiesStratum.load(this);
    runInAction(() => {
      this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, stratum);
    });
  }

  protected async forceLoadMembers(): Promise<void> {
    const getCapabilitiesStratum = <GetCapabilitiesStratum | undefined>(
      this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName)
    );
    if (getCapabilitiesStratum) {
      await runLater(() => getCapabilitiesStratum.createMembersFromLayers());
    }
  }

  protected get defaultGetCapabilitiesUrl(): string | undefined {
    if (this.uri) {
      return this.uri
        .clone()
        .setSearch({
          service: "WMTS",
          version: "1.0.0",
          request: "GetCapabilities"
        })
        .toString();
    } else {
      return undefined;
    }
  }
}
