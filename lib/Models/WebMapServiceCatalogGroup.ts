import i18next from "i18next";
import { action, computed, runInAction } from "mobx";
import containsAny from "../Core/containsAny";
import filterOutUndefined from "../Core/filterOutUndefined";
import isReadOnlyArray from "../Core/isReadOnlyArray";
import replaceUnderscores from "../Core/replaceUnderscores";
import TerriaError from "../Core/TerriaError";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import GetCapabilitiesMixin from "../ModelMixins/GetCapabilitiesMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import UrlMixin from "../ModelMixins/UrlMixin";
import ModelReference from "../Traits/ModelReference";
import WebMapServiceCatalogGroupTraits from "../Traits/WebMapServiceCatalogGroupTraits";
import CommonStrata from "./CommonStrata";
import CreateModel from "./CreateModel";
import LoadableStratum from "./LoadableStratum";
import { BaseModel } from "./Model";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import WebMapServiceCapabilities, {
  CapabilitiesLayer
} from "./WebMapServiceCapabilities";
import WebMapServiceCatalogItem from "./WebMapServiceCatalogItem";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import createStratumInstance from "./createStratumInstance";
import StratumFromTraits from "./StratumFromTraits";

class GetCapabilitiesStratum extends LoadableStratum(
  WebMapServiceCatalogGroupTraits
) {
  static load(
    catalogItem: WebMapServiceCatalogGroup
  ): Promise<GetCapabilitiesStratum> {
    if (catalogItem.getCapabilitiesUrl === undefined) {
      return Promise.reject(
        new TerriaError({
          title: i18next.t("models.webMapServiceCatalogGroup.missingUrlTitle"),
          message: i18next.t(
            "models.webMapServiceCatalogGroup.missingUrlMessage"
          )
        })
      );
    }

    const proxiedUrl = proxyCatalogItemUrl(
      catalogItem,
      catalogItem.getCapabilitiesUrl,
      catalogItem.getCapabilitiesCacheDuration
    );
    return WebMapServiceCapabilities.fromUrl(proxiedUrl).then(capabilities => {
      return new GetCapabilitiesStratum(catalogItem, capabilities);
    });
  }

  constructor(
    readonly catalogGroup: WebMapServiceCatalogGroup,
    readonly capabilities: WebMapServiceCapabilities
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new GetCapabilitiesStratum(
      model as WebMapServiceCatalogGroup,
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
    function newInfo(name: string, content?: string) {
      const traits = createStratumInstance(InfoSectionTraits);
      runInAction(() => {
        traits.name = name;
        traits.content = content;
      });
      return traits;
    }

    const service = this.capabilities && this.capabilities.Service;
    if (service) {
      // Show the service abstract if there is one and if it isn't the Geoserver default "A compliant implementation..."
      if (
        service &&
        service.Abstract &&
        !containsAny(
          service.Abstract,
          WebMapServiceCatalogItem.abstractsToIgnore
        )
      ) {
        result.push(
          newInfo(
            i18next.t("models.webMapServiceCatalogGroup.abstract"),
            this.capabilities.Service.Abstract
          )
        );
      }

      // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
      if (
        service &&
        service.AccessConstraints &&
        !/^none$/i.test(service.AccessConstraints)
      ) {
        result.push(
          newInfo(
            i18next.t("models.webMapServiceCatalogGroup.accessConstraints"),
            this.capabilities.Service.AccessConstraints
          )
        );
      }

      // Show the Fees if it isn't "none".
      if (service && service.Fees && !/^none$/i.test(service.Fees)) {
        result.push(
          newInfo(
            i18next.t("models.webMapServiceCatalogGroup.fees"),
            this.capabilities.Service.Fees
          )
        );
      }
    }

    return result;
  }

  @computed
  get members(): ModelReference[] {
    return filterOutUndefined(
      this.topLevelLayers.map(layer => {
        if (!layer.Name) {
          return undefined;
        }
        return this.catalogGroup.uniqueId + "/" + layer.Name;
      })
    );
  }

  get topLevelLayers(): readonly CapabilitiesLayer[] {
    if (this.catalogGroup.flatten) {
      return this.capabilities.allLayers;
    } else {
      let rootLayers: readonly CapabilitiesLayer[] = this.capabilities
        .rootLayers;
      while (
        rootLayers &&
        rootLayers.length === 1 &&
        rootLayers[0].Name === undefined
      ) {
        const subLayer:
          | CapabilitiesLayer
          | readonly CapabilitiesLayer[]
          | undefined = rootLayers[0].Layer;
        if (subLayer && isReadOnlyArray(subLayer)) {
          rootLayers = subLayer;
        } else if (subLayer) {
          rootLayers = [subLayer];
        } else {
          break;
        }
      }
      return rootLayers;
    }
  }

  @action
  createMembersFromLayers() {
    this.topLevelLayers.forEach(layer => this.createMemberFromLayer(layer));
  }

  @action
  createMemberFromLayer(layer: CapabilitiesLayer) {
    if (!layer.Name) {
      return;
    }

    const id = this.catalogGroup.uniqueId;
    const layerId = id + "/" + layer.Name;
    const existingModel = this.catalogGroup.terria.getModelById(
      WebMapServiceCatalogItem,
      layerId
    );

    let model: WebMapServiceCatalogItem;
    if (existingModel === undefined) {
      model = new WebMapServiceCatalogItem(layerId, this.catalogGroup.terria);
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
    model.setTrait(stratum, "layers", layer.Name);

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
    model.setTrait(
      stratum,
      "hideLegendInWorkbench",
      this.catalogGroup.hideLegendInWorkbench
    );
  }
}

export default class WebMapServiceCatalogGroup extends GetCapabilitiesMixin(
  UrlMixin(
    GroupMixin(CatalogMemberMixin(CreateModel(WebMapServiceCatalogGroupTraits)))
  )
) {
  static readonly type = "wms-group";

  get type() {
    return WebMapServiceCatalogGroup.type;
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
          service: "WMS",
          version: "1.3.0",
          request: "GetCapabilities"
        })
        .toString();
    } else {
      return undefined;
    }
  }
}
