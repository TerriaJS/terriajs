import i18next from "i18next";
import { action, computed, runInAction } from "mobx";
import containsAny from "../Core/containsAny";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import replaceUnderscores from "../Core/replaceUnderscores";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GetCapabilitiesMixin from "../ModelMixins/GetCapabilitiesMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import ModelReference from "../Traits/ModelReference";
import WebFeatureServiceCatalogGroupTraits from "../Traits/WebFeatureServiceCatalogGroupTraits";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import createStratumInstance from "./createStratumInstance";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import StratumFromTraits from "./StratumFromTraits";
import WebFeatureServiceCapabilities, {
  FeatureType
} from "./WebFeatureServiceCapabilities";
import WebFeatureServiceCatalogItem from "./WebFeatureServiceCatalogItem";

class GetCapabilitiesStratum extends LoadableStratum(
  WebFeatureServiceCatalogGroupTraits
) {
  static load(
    catalogItem: WebFeatureServiceCatalogGroup
  ): Promise<GetCapabilitiesStratum> {
    if (catalogItem.getCapabilitiesUrl === undefined) {
      return Promise.reject(
        new TerriaError({
          title: i18next.t(
            "models.webFeatureServiceCatalogGroup.invalidWFSServerTitle"
          ),
          message: i18next.t(
            "models.webFeatureServiceCatalogGroup.invalidWFSServerMessage",
            this
          )
        })
      );
    }

    const proxiedUrl = proxyCatalogItemUrl(
      catalogItem,
      catalogItem.getCapabilitiesUrl,
      catalogItem.getCapabilitiesCacheDuration
    );
    return WebFeatureServiceCapabilities.fromUrl(proxiedUrl).then(
      capabilities => {
        return new GetCapabilitiesStratum(catalogItem, capabilities);
      }
    );
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
      this.capabilities.Service &&
      this.capabilities.Service.Title
    ) {
      return replaceUnderscores(this.capabilities.Service.Title);
    }
  }

  @computed get info() {
    const result: StratumFromTraits<InfoSectionTraits>[] = [];

    const service = this.capabilities && this.capabilities.Service;
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
            content: this.capabilities.Service.Abstract
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
            content: this.capabilities.Service.AccessConstraints
          })
        );
      }

      // Show the Fees if it isn't "none".
      if (service && service.Fees && !/^none$/i.test(service.Fees)) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t("models.webFeatureServiceCatalogGroup.fees"),
            content: this.capabilities.Service.Fees
          })
        );
      }
    }

    return result;
  }

  @computed
  get members(): ModelReference[] {
    return filterOutUndefined(
      this.capabilities.featureTypes.map(layer => this.getLayerId(layer))
    );
  }

  @action
  createMembersFromLayers() {
    this.capabilities.featureTypes.forEach(layer =>
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
    const stratum = CommonStrata.underride;

    model.strata.delete(stratum);

    model.setTrait(stratum, "name", layer.Title);
    model.setTrait(stratum, "url", this.catalogGroup.url);
    model.setTrait(
      stratum,
      "getCapabilitiesUrl",
      this.catalogGroup.getCapabilitiesUrl
    );
    model.setTrait(
      stratum,
      "getCapabilitiesCacheDuration",
      this.catalogGroup.getCapabilitiesCacheDuration
    );
    model.setTrait(stratum, "typeNames", layer.Name);

    // if user defined following properties on th group level we should pass them to all group members
    model.setTrait(stratum, "hideSource", this.catalogGroup.hideSource);
    model.setTrait(
      stratum,
      "isOpenInWorkbench",
      this.catalogGroup.isOpenInWorkbench
    );
    model.setTrait(
      stratum,
      "isExperiencingIssues",
      this.catalogGroup.isExperiencingIssues
    );
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

  protected forceLoadMetadata(): Promise<void> {
    return GetCapabilitiesStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(
          GetCapabilitiesMixin.getCapabilitiesStratumName,
          stratum
        );
      });
    });
  }

  protected forceLoadMembers(): Promise<void> {
    return this.loadMetadata().then(() => {
      const getCapabilitiesStratum = <GetCapabilitiesStratum | undefined>(
        this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName)
      );
      if (getCapabilitiesStratum) {
        getCapabilitiesStratum.createMembersFromLayers();
      }
    });
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
