import i18next from "i18next";
import { action, computed, runInAction } from "mobx";
import URI from "urijs";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import runLater from "../../../Core/runLater";
import TerriaError, { networkRequestError } from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ArcGisFeatureServerCatalogGroupTraits from "../../../Traits/TraitsClasses/ArcGisFeatureServerCatalogGroupTraits";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import ModelReference from "../../../Traits/ModelReference";
import ArcGisCatalogGroup from "./ArcGisCatalogGroup";
import ArcGisFeatureServerCatalogItem from "./ArcGisFeatureServerCatalogItem";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumOrder from "../../Definition/StratumOrder";

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
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t(
          "models.arcGisFeatureServerCatalogGroup.serviceDescription"
        ),
        content: this._featureServer.serviceDescription
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t(
          "models.arcGisFeatureServerCatalogGroup.dataDescription"
        ),
        content: this._featureServer.description
      }),
      createStratumInstance(InfoSectionTraits, {
        name: i18next.t("models.arcGisFeatureServerCatalogGroup.copyrightText"),
        content: this._featureServer.copyrightText
      })
    ];
  }

  @computed get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
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

    return loadJson(proxyCatalogItemUrl(catalogGroup, uri.toString()))
      .then((featureServer: FeatureServer) => {
        // Is this really a FeatureServer REST response?
        if (!featureServer || !featureServer.layers) {
          throw networkRequestError({
            title: i18next.t(
              "models.arcGisFeatureServerCatalogGroup.invalidServiceTitle"
            ),
            message: i18next.t(
              "models.arcGisFeatureServerCatalogGroup.invalidServiceMessage"
            )
          });
        }

        const stratum = new FeatureServerStratum(catalogGroup, featureServer);
        return stratum;
      })
      .catch(() => {
        throw networkRequestError({
          sender: catalogGroup,
          title: i18next.t(
            "models.arcGisFeatureServerCatalogGroup.groupNotAvailableTitle"
          ),
          message: i18next.t(
            "models.arcGisFeatureServerCatalogGroup.groupNotAvailableMessage"
          )
        });
      });
  }

  @computed
  get members(): ModelReference[] {
    return filterOutUndefined(
      this.layers.map((layer) => {
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
    this.layers.forEach((layer) => this.createMemberFromLayer(layer));
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
    model.strata.delete(CommonStrata.definition);

    model.setTrait(
      CommonStrata.definition,
      "name",
      replaceUnderscores(layer.name)
    );

    var uri = new URI(this._catalogGroup.url).segment(layer.id + ""); // Convert layer id to string as segment(0) means sthg different.
    model.setTrait(CommonStrata.definition, "url", uri.toString());
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
    return FeatureServerStratum.load(this).then((stratum) => {
      runInAction(() => {
        this.strata.set(FeatureServerStratum.stratumName, stratum);
      });
    });
  }

  protected async forceLoadMembers() {
    const featureServerStratum = <FeatureServerStratum | undefined>(
      this.strata.get(FeatureServerStratum.stratumName)
    );
    if (featureServerStratum) {
      await runLater(() => featureServerStratum.createMembersFromLayers());
    }
  }
}
