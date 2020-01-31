import i18next from "i18next";
import LoadableStratum from "./LoadableStratum";
import ArcGisFeatureServerCatalogGroupTraits from "../Traits/ArcGisFeatureServerCatalogGroupTraits";
import { computed, runInAction, action } from "mobx";
import { BaseModel } from "./Model";
import UrlMixin from "../ModelMixins/UrlMixin";
import GroupMixin from "../ModelMixins/GroupMixin";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";
import CreateModel from "./CreateModel";
import StratumOrder from "./StratumOrder";
import URI from "urijs";
import proxyCatalogItemUrl from "./proxyCatalogItemUrl";
import TerriaError from "../Core/TerriaError";
import loadJson from "../Core/loadJson";
import isDefined from "../Core/isDefined";
import createStratumInstance from "./createStratumInstance";
import { InfoSectionTraits } from "../Traits/CatalogMemberTraits";
import ArcGisFeatureServerCatalogItem from "./ArcGisFeatureServerCatalogItem";
import filterOutUndefined from "../Core/filterOutUndefined";
import ModelReference from "../Traits/ModelReference";
import CommonStrata from "./CommonStrata";

interface FeatureServerLayer {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
}

class FeatureServerStratum extends LoadableStratum(
  ArcGisFeatureServerCatalogGroupTraits
) {
  static stratumName = "featureServer";

  constructor(
    readonly catalogGroup: ArcGisFeatureServerCatalogGroup,
    readonly metadata: any
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new FeatureServerStratum(
      model as ArcGisFeatureServerCatalogGroup,
      this.metadata
    ) as this;
  }

  @computed get name() {
    return isDefined(this.metadata) ? this.metadata.name : undefined;
  }

  @computed get info() {
    const info = [];
    if (isDefined(this.metadata)) {
      if (this.metadata.serviceDescription) {
        info.push(
          createStratumInstance(InfoSectionTraits, {
            name: "Service Description",
            content: this.metadata.serviceDescription
          })
        );
      }
      if (this.metadata.description) {
        info.push(
          createStratumInstance(InfoSectionTraits, {
            name: "Description",
            content: this.metadata.description
          })
        );
      }
    }
    return info.length > 0 ? info : undefined;
  }

  static async load(
    catalogGroup: ArcGisFeatureServerCatalogGroup
  ): Promise<FeatureServerStratum> {
    var terria = catalogGroup.terria;
    var uri = new URI(catalogGroup.url).addQuery("f", "json");

    return loadJson(proxyCatalogItemUrl(catalogGroup, uri.toString(), "1d"))
      .then((metadata: any) => {
        // Is this really a FeatureServer REST response?
        if (!metadata || !metadata.layers) {
          throw new TerriaError({
            title: i18next.t("models.arcGisFeatureServer.invalidServiceTitle"),
            message: i18next.t(
              "models.arcGisFeatureServer.invalidServiceTitle",
              {
                email:
                  '<a href="mailto:' +
                  terria.supportEmail +
                  '">' +
                  terria.supportEmail +
                  "</a>"
              }
            )
          });
        }

        const stratum = new FeatureServerStratum(catalogGroup, metadata);
        return stratum;
      })
      .catch(() => {
        throw new TerriaError({
          sender: catalogGroup,
          title: i18next.t("models.arcGisFeatureServer.groupNotAvailableTitle"),
          message: i18next.t(
            "models.arcGisFeatureServer.groupNotAvailableMessage",
            {
              cors:
                '<a href="http://enable-cors.org/" target="_blank">CORS</a>',
              appName: terria.appName,
              email:
                '<a href="mailto:' +
                terria.supportEmail +
                '">' +
                terria.supportEmail +
                "</a>"
            }
          )
        });
      });
  }

  @computed
  get members(): ModelReference[] {
    return filterOutUndefined(
      this.layers.map(layer => {
        if (!isDefined(layer.id)) {
          return undefined;
        }
        return this.catalogGroup.uniqueId + "/" + layer.id;
      })
    );
  }

  @computed
  get layers(): readonly FeatureServerLayer[] {
    return this.metadata.layers;
  }

  @action
  createMembersFromLayers() {
    this.layers.forEach(layer => this.createMemberFromLayer(layer));
  }

  @action
  createMemberFromLayer(layer: FeatureServerLayer) {
    if (!isDefined(layer.id)) {
      return;
    }

    const id = this.catalogGroup.uniqueId;
    const layerId = id + "/" + layer.id;
    const existingModel = this.catalogGroup.terria.getModelById(
      ArcGisFeatureServerCatalogItem,
      layerId
    );

    let model: ArcGisFeatureServerCatalogItem;
    if (existingModel === undefined) {
      model = new ArcGisFeatureServerCatalogItem(
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

    model.setTrait(stratum, "name", layer.name);

    var uri = new URI(this.catalogGroup.url).segment(layer.id + ""); // Convert layer id to string as segment(0) means sthg different.
    model.setTrait(stratum, "url", uri.toString());
  }
}

StratumOrder.addLoadStratum(FeatureServerStratum.stratumName);

export default class ArcGisFeatureServerCatalogGroup extends UrlMixin(
  GroupMixin(
    CatalogMemberMixin(CreateModel(ArcGisFeatureServerCatalogGroupTraits))
  )
) {
  static readonly type = "esri-featureServer-group";

  get type() {
    return ArcGisFeatureServerCatalogGroup.type;
  }

  get typeName() {
    return i18next.t("models.arcGisFeatureServer.nameGroup");
  }

  protected forceLoadMetadata(): Promise<void> {
    return FeatureServerStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(FeatureServerStratum.stratumName, stratum);
      });
    });
  }

  protected forceLoadMembers(): Promise<void> {
    return this.loadMetadata().then(() => {
      const featureServerStratum = <FeatureServerStratum | undefined>(
        this.strata.get(FeatureServerStratum.stratumName)
      );
      if (featureServerStratum) {
        featureServerStratum.createMembersFromLayers();
      }
    });
  }
}
