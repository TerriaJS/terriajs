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
import ArcGisCatalogGroup from "./ArcGisCatalogGroup";
import filterOutUndefined from "../Core/filterOutUndefined";
import ModelReference from "../Traits/ModelReference";
import CommonStrata from "./CommonStrata";
import replaceUnderscores from "../Core/replaceUnderscores";
import createInfoSection from "./createInfoSection";

interface DocumentInfo {
  Title?: string;
  Author?: string;
}
interface Layer {
  id: number;
  name?: string;
  description?: string;
  copyrightText?: string;
}

interface FeatureServer {
  documentInfo?: DocumentInfo;
  name?: string;
  serviceDescription?: string;
  description?: string;
  copyrightText?: string;
  layers: Layer[];
}

export class FeatureServerStratum extends LoadableStratum(
  ArcGisFeatureServerCatalogGroupTraits
) {
  static stratumName = "featureServer";

  constructor(
    private readonly _catalogGroup:
      | ArcGisFeatureServerCatalogGroup
      | ArcGisCatalogGroup,
    private readonly _featureServer: FeatureServer
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new FeatureServerStratum(
      model as ArcGisFeatureServerCatalogGroup,
      this._featureServer
    ) as this;
  }

  get featureServerData() {
    return this._featureServer;
  }

  @computed get name() {
    if (
      this._featureServer.documentInfo &&
      this._featureServer.documentInfo.Title &&
      this._featureServer.documentInfo.Title.length > 0
    ) {
      return replaceUnderscores(this._featureServer.documentInfo.Title);
    }
  }

  @computed get info() {
    return [
      createInfoSection(
        i18next.t("models.arcGisFeatureServerCatalogGroup.serviceDescription"),
        this._featureServer.serviceDescription
      ),
      createInfoSection(
        i18next.t("models.arcGisFeatureServerCatalogGroup.dataDescription"),
        this._featureServer.description
      ),
      createInfoSection(
        i18next.t("models.arcGisFeatureServerCatalogGroup.copyrightText"),
        this._featureServer.copyrightText
      )
    ];
  }

  @computed get dataCustodian() {
    if (
      this._featureServer.documentInfo &&
      this._featureServer.documentInfo.Author &&
      this._featureServer.documentInfo.Author.length > 0
    ) {
      return this._featureServer.documentInfo.Author;
    }
  }

  static async load(
    catalogGroup: ArcGisFeatureServerCatalogGroup | ArcGisCatalogGroup
  ): Promise<FeatureServerStratum> {
    var terria = catalogGroup.terria;
    var uri = new URI(catalogGroup.url).addQuery("f", "json");

    return loadJson(proxyCatalogItemUrl(catalogGroup, uri.toString(), "1d"))
      .then((featureServer: FeatureServer) => {
        // Is this really a FeatureServer REST response?
        if (!featureServer || !featureServer.layers) {
          throw new TerriaError({
            title: i18next.t(
              "models.arcGisFeatureServerCatalogGroup.invalidServiceTitle"
            ),
            message: i18next.t(
              "models.arcGisFeatureServerCatalogGroup.invalidServiceTitle",
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

        const stratum = new FeatureServerStratum(catalogGroup, featureServer);
        return stratum;
      })
      .catch(() => {
        throw new TerriaError({
          sender: catalogGroup,
          title: i18next.t(
            "models.arcGisFeatureServerCatalogGroup.groupNotAvailableTitle"
          ),
          message: i18next.t(
            "models.arcGisFeatureServerCatalogGroup.groupNotAvailableMessage",
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
        return this._catalogGroup.uniqueId + "/" + layer.id;
      })
    );
  }

  @computed
  get layers(): readonly Layer[] {
    return this._featureServer.layers;
  }

  @action
  createMembersFromLayers() {
    this.layers.forEach(layer => this.createMemberFromLayer(layer));
  }

  @action
  createMemberFromLayer(layer: Layer) {
    if (!isDefined(layer.id)) {
      return;
    }

    const id = this._catalogGroup.uniqueId;
    const layerId = id + "/" + layer.id;
    const existingModel = this._catalogGroup.terria.getModelById(
      ArcGisFeatureServerCatalogItem,
      layerId
    );

    let model: ArcGisFeatureServerCatalogItem;
    if (existingModel === undefined) {
      model = new ArcGisFeatureServerCatalogItem(
        layerId,
        this._catalogGroup.terria
      );
      this._catalogGroup.terria.addModel(model);
    } else {
      model = existingModel;
    }

    // Replace the stratum inherited from the parent group.
    const stratum = CommonStrata.underride;

    model.strata.delete(stratum);

    model.setTrait(stratum, "name", replaceUnderscores(layer.name));

    var uri = new URI(this._catalogGroup.url).segment(layer.id + ""); // Convert layer id to string as segment(0) means sthg different.
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
    return i18next.t("models.arcGisFeatureServerCatalogGroup.name");
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
