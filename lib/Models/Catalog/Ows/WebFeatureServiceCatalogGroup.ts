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
import WebFeatureServiceCatalogGroupTraits from "../../../Traits/TraitsClasses/WebFeatureServiceCatalogGroupTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import WebFeatureServiceCapabilities, {
  FeatureType
} from "./WebFeatureServiceCapabilities";
import WebFeatureServiceCatalogItem from "./WebFeatureServiceCatalogItem";

class GetCapabilitiesStratum extends LoadableStratum(
  WebFeatureServiceCatalogGroupTraits
) {
  static async load(
    catalogItem: WebFeatureServiceCatalogGroup
  ): Promise<GetCapabilitiesStratum> {
    if (catalogItem.getCapabilitiesUrl === undefined) {
      throw networkRequestError({
        title: i18next.t(
          "models.webFeatureServiceCatalogGroup.invalidWFSServerTitle"
        ),
        message: i18next.t(
          "models.webFeatureServiceCatalogGroup.invalidWFSServerMessage",
          this
        )
      });
    }

    const capabilities = await WebFeatureServiceCapabilities.fromUrl(
      proxyCatalogItemUrl(
        catalogItem,
        catalogItem.getCapabilitiesUrl,
        catalogItem.getCapabilitiesCacheDuration
      )
    );
    return new GetCapabilitiesStratum(catalogItem, capabilities);
  }

  constructor(
    readonly catalogGroup: WebFeatureServiceCatalogGroup,
    readonly capabilities: WebFeatureServiceCapabilities
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new GetCapabilitiesStratum(
      model as WebFeatureServiceCatalogGroup,
      this.capabilities
    ) as this;
  }

  @computed get name() {
    if (
      this.capabilities &&
      this.capabilities.service &&
      this.capabilities.service.Title
    ) {
      return replaceUnderscores(this.capabilities.service.Title);
    }
  }

  @computed get info() {
    const result: StratumFromTraits<InfoSectionTraits>[] = [];

    const service = this.capabilities && this.capabilities.service;
    if (service) {
      // Show the service abstract if there is one and if it isn't the Geoserver default "A compliant implementation..."
      if (
        service &&
        service.Abstract &&
        !containsAny(
          service.Abstract,
          WebFeatureServiceCatalogItem.abstractsToIgnore
        )
      ) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t("models.webFeatureServiceCatalogGroup.abstract"),
            content: this.capabilities.service.Abstract
          })
        );
      }

      // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
      if (
        service &&
        service.AccessConstraints &&
        !/^none$/i.test(service.AccessConstraints)
      ) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t(
              "models.webFeatureServiceCatalogGroup.accessConstraints"
            ),
            content: this.capabilities.service.AccessConstraints
          })
        );
      }

      // Show the Fees if it isn't "none".
      if (service && service.Fees && !/^none$/i.test(service.Fees)) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t("models.webFeatureServiceCatalogGroup.fees"),
            content: this.capabilities.service.Fees
          })
        );
      }
    }

    return result;
  }

  @computed
  get members(): ModelReference[] {
    return filterOutUndefined(
      this.capabilities.featureTypes.map((layer) => this.getLayerId(layer))
    );
  }

  @action
  createMembersFromLayers() {
    this.capabilities.featureTypes.forEach((layer) =>
      this.createMemberFromLayer(layer)
    );
  }

  @action
  createMemberFromLayer(layer: FeatureType) {
    const layerId = this.getLayerId(layer);

    if (!layerId) {
      return;
    }

    // Create model for WebFeatureServiceCatalogItem
    const existingModel = this.catalogGroup.terria.getModelById(
      WebFeatureServiceCatalogItem,
      layerId
    );

    let model: WebFeatureServiceCatalogItem;
    if (existingModel === undefined) {
      model = new WebFeatureServiceCatalogItem(
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
    model.setTrait(CommonStrata.definition, "typeNames", layer.Name);

    // if user defined following properties on th group level we should pass them to all group members
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

  getLayerId(layer: FeatureType) {
    if (!isDefined(this.catalogGroup.uniqueId)) {
      return;
    }
    return `${this.catalogGroup.uniqueId}/${layer.Name || layer.Title}`;
  }
}

export default class WebFeatureServiceCatalogGroup extends GetCapabilitiesMixin(
  UrlMixin(
    GroupMixin(
      CatalogMemberMixin(CreateModel(WebFeatureServiceCatalogGroupTraits))
    )
  )
) {
  static readonly type = "wfs-group";

  get type() {
    return WebFeatureServiceCatalogGroup.type;
  }

  protected async forceLoadMetadata(): Promise<void> {
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
          service: "WFS",
          version: "1.1.0",
          request: "GetCapabilities"
        })
        .toString();
    } else {
      return undefined;
    }
  }
}
