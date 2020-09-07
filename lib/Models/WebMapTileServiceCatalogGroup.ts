import LoadableStratum from "./LoadableStratum";
import WebMapTileServiceCatalogGroupTraits from "../Traits/WebMapTileServiceCatalogGroupTraits";
import { BaseModel } from "./Model";
import GetCapabilitiesMixin from "../ModelMixins/GetCapabilitiesMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import { runInAction, computed, action } from "mobx";
import TerriaError from "../Core/TerriaError";
import i18next from "i18next";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import replaceUnderscores from "../Core/replaceUnderscores";
import StratumFromTraits from "./StratumFromTraits";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import ModelReference from "../Traits/ModelReference";
import filterOutUndefined from "../Core/filterOutUndefined";
import isDefined from "../Core/isDefined";
import WebMapTileServiceCapabilities, {
  WmtsLayer
} from "./WebMapTileServiceCapabilities";
import containsAny from "../Core/containsAny";
import createStratumInstance from "./createStratumInstance";
import CommonStrata from "./CommonStrata";
import WebMapTileServiceCatalogItem from "./WebMapTileServiceCatalogItem";

class GetCapabilitiesStratum extends LoadableStratum(
  WebMapTileServiceCatalogGroupTraits
) {
  static load(
    catalogItem: WebMapTileServiceCatalogGroup
  ): Promise<GetCapabilitiesStratum> {
    console.log(catalogItem);
    if (catalogItem.getCapabilitiesUrl === undefined) {
      return Promise.reject(
        new TerriaError({
          title: i18next.t(
            "models.webFeatureServiceCatalogGroup.invalidWMTSServerTitle"
          ),
          message: i18next.t(
            "models.webFeatureServiceCatalogGroup.invalidWMTSServerMessage",
            this
          )
        })
      );
    }
    console.log(catalogItem.getCapabilitiesUrl);

    const proxiedUrl = proxyCatalogItemUrl(
      catalogItem,
      catalogItem.getCapabilitiesUrl,
      catalogItem.getCapabilitiesCacheDuration
    );
    return WebMapTileServiceCapabilities.fromUrl(proxiedUrl).then(
      capabilities => {
        console.log(capabilities);
        return new GetCapabilitiesStratum(catalogItem, capabilities);
      }
    );
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
          name: i18next.t("models.webFeatureServiceCatalogGroup.abstract"),
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
            "models.webFeatureServiceCatalogGroup.accessConstraints"
          ),
          content: service.AccessConstraints
        })
      );
    }

    // Show the Fees if it isn't "none".
    if (service.Fees && !/^none$/i.test(service.Fees)) {
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t("models.webFeatureServiceCatalogGroup.fees"),
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
      this.capabilities.layers.map(layer => this.getLayerId(layer))
    );
  }

  @action
  createMembersFromLayers() {
    this.capabilities.layers.forEach(layer =>
      this.createMemberFromLayer(layer)
    );
  }

  @action
  createMemberFromLayer(layer: WmtsLayer) {
    const layerId = this.getLayerId(layer);
    if (!layerId) {
      return;
    }

    // Create model for WebFeatureServiceCatalogItem
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
    model.setTrait(stratum, "layer", layer.Title);
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
