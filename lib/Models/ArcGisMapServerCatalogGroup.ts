import i18next from "i18next";
import LoadableStratum from "./LoadableStratum";
import ArcGisMapServerCatalogGroupTraits from "../Traits/ArcGisMapServerCatalogGroupTraits";
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
import ArcGisMapServerCatalogItem from "./ArcGisMapServerCatalogItem";
import ArcGisCatalogGroup from "./ArcGisCatalogGroup";
import filterOutUndefined from "../Core/filterOutUndefined";
import ModelReference from "../Traits/ModelReference";
import CommonStrata from "./CommonStrata";
import replaceUnderscores from "../Core/replaceUnderscores";

interface DocumentInfo {
  Title?: string;
  Author?: string;
}

interface Layer {
  id: number;
  name?: string;
  parentLayerId: number;
  description?: string;
  copyrightText?: string;
  type?: string;
}

export interface MapServer {
  documentInfo?: DocumentInfo;
  name?: string;
  serviceDescription?: string;
  description?: string;
  copyrightText?: string;
  layers?: Layer[];
  subLayers?: Layer[];
}

export class MapServerStratum extends LoadableStratum(
  ArcGisMapServerCatalogGroupTraits
) {
  static stratumName = "mapServer";

  constructor(
    private readonly _catalogGroup:
      | ArcGisMapServerCatalogGroup
      | ArcGisCatalogGroup,
    private readonly _mapServer: MapServer
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new MapServerStratum(
      model as ArcGisMapServerCatalogGroup,
      this._mapServer
    ) as this;
  }

  get mapServerData() {
    return this._mapServer;
  }

  @computed get name() {
    if (
      this._mapServer.documentInfo &&
      this._mapServer.documentInfo.Title &&
      this._mapServer.documentInfo.Title.length > 0
    ) {
      return replaceUnderscores(this._mapServer.documentInfo.Title);
    }
  }

  @computed get info() {
    function newInfo(name: string, content?: string) {
      const traits = createStratumInstance(InfoSectionTraits);
      runInAction(() => {
        traits.name = name;
        traits.content = content;
      });
      return traits;
    }

    return [
      newInfo(
        i18next.t("models.arcGisFeatureServerCatalogGroup.serviceDescription"),
        this._mapServer.serviceDescription
      ),
      newInfo(
        i18next.t("models.arcGisFeatureServerCatalogGroup.dataDescription"),
        this._mapServer.description
      ),
      newInfo(
        i18next.t("models.arcGisFeatureServerCatalogGroup.copyrightText"),
        this._mapServer.copyrightText
      )
    ];
  }

  @computed get dataCustodian() {
    if (
      this._mapServer.documentInfo &&
      this._mapServer.documentInfo.Author &&
      this._mapServer.documentInfo.Author.length > 0
    ) {
      return this._mapServer.documentInfo.Author;
    }
  }

  static async load(
    catalogGroup: ArcGisMapServerCatalogGroup | ArcGisCatalogGroup
  ): Promise<MapServerStratum> {
    var terria = catalogGroup.terria;
    var uri = new URI(catalogGroup.url).addQuery("f", "json");

    return loadJson(
      proxyCatalogItemUrl(
        catalogGroup,
        uri.toString(),
        catalogGroup.cacheDuration
      )
    )
      .then((mapServer: MapServer) => {
        // Is this really a MapServer REST response?
        if (!mapServer || (!mapServer.layers && !mapServer.subLayers)) {
          throw new TerriaError({
            title: i18next.t(
              "models.arcGisMapServerCatalogGroup.invalidServiceTitle"
            ),
            message: i18next.t(
              "models.arcGisMapServerCatalogGroup.invalidServiceTitle",
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
        const stratum = new MapServerStratum(catalogGroup, mapServer);
        return stratum;
      })
      .catch(() => {
        throw new TerriaError({
          sender: catalogGroup,
          title: i18next.t(
            "models.arcGisMapServerCatalogGroup.groupNotAvailableTitle"
          ),
          message: i18next.t(
            "models.arcGisMapServerCatalogGroup.groupNotAvailableMessage",
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
      this.layers
        .map(layer => {
          if (!isDefined(layer.id) || layer.parentLayerId !== -1) {
            return undefined;
          }
          return this._catalogGroup.uniqueId + "/" + layer.id;
        })
        .concat(
          this.subLayers.map(subLayer => {
            if (!isDefined(subLayer.id)) {
              return undefined;
            }
            return this._catalogGroup.uniqueId + "/" + subLayer.id;
          })
        )
    );
  }

  @computed
  get layers(): readonly Layer[] {
    return this._mapServer.layers || [];
  }

  @computed
  get subLayers(): readonly Layer[] {
    return this._mapServer.subLayers || [];
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
    //if parent layer is not -1 then this is sublayer so we define its ID like that
    const layerId =
      id +
      "/" +
      (layer.parentLayerId !== -1 ? layer.parentLayerId + "/" : "") +
      layer.id;
    let model: ArcGisMapServerCatalogItem | ArcGisMapServerCatalogGroup;
    if (layer.type === "Group Layer") {
      const existingModel = this._catalogGroup.terria.getModelById(
        ArcGisMapServerCatalogGroup,
        layerId
      );
      if (existingModel === undefined) {
        model = new ArcGisMapServerCatalogGroup(
          layerId,
          this._catalogGroup.terria
        );
        this._catalogGroup.terria.addModel(model);
      } else {
        model = existingModel;
      }
    } else {
      const existingModel = this._catalogGroup.terria.getModelById(
        ArcGisMapServerCatalogItem,
        layerId
      );
      if (existingModel === undefined) {
        model = new ArcGisMapServerCatalogItem(
          layerId,
          this._catalogGroup.terria
        );
        this._catalogGroup.terria.addModel(model);
      } else {
        model = existingModel;
      }
    }

    // Replace the stratum inherited from the parent group.
    const stratum = CommonStrata.underride;

    model.strata.delete(stratum);

    model.setTrait(stratum, "name", replaceUnderscores(layer.name));

    var uri = new URI(this._catalogGroup.url).segment(layer.id + ""); // Convert layer id to string as segment(0) means sthg different.
    model.setTrait(stratum, "url", uri.toString());
  }
}

StratumOrder.addLoadStratum(MapServerStratum.stratumName);

export default class ArcGisMapServerCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(ArcGisMapServerCatalogGroupTraits)))
) {
  static readonly type = "esri-mapServer-group";

  get type() {
    return ArcGisMapServerCatalogGroup.type;
  }

  get typeName() {
    return i18next.t("models.arcGisMapServerCatalogGroup.name");
  }

  @computed get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  protected forceLoadMetadata(): Promise<void> {
    return MapServerStratum.load(this).then(stratum => {
      runInAction(() => {
        this.strata.set(MapServerStratum.stratumName, stratum);
      });
    });
  }

  protected forceLoadMembers(): Promise<void> {
    return this.loadMetadata().then(() => {
      const mapServerStratum = <MapServerStratum | undefined>(
        this.strata.get(MapServerStratum.stratumName)
      );
      if (mapServerStratum) {
        mapServerStratum.createMembersFromLayers();
      }
    });
  }
}
