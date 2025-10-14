import i18next from "i18next";
import { action, computed, makeObservable, override, runInAction } from "mobx";
import URI from "urijs";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import isDefined from "../../../Core/isDefined";
import loadJson from "../../../Core/loadJson";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import runLater from "../../../Core/runLater";
import { networkRequestError } from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import ModelReference from "../../../Traits/ModelReference";
import ArcGisCatalogGroupTraits from "../../../Traits/TraitsClasses/ArcGisCatalogGroupTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import LoadableStratum, {
  LockedDownStratum
} from "../../Definition/LoadableStratum";
import { BaseModel, ModelConstructorParameters } from "../../Definition/Model";
import StratumOrder from "../../Definition/StratumOrder";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import ArcGisFeatureServerCatalogGroup, {
  FeatureServerStratum
} from "./ArcGisFeatureServerCatalogGroup";
import ArcGisMapServerCatalogGroup, {
  MapServerStratum
} from "./ArcGisMapServerCatalogGroup";

interface Service {
  name: string;
  type: string;
}

interface ArcGisServer {
  name?: string;
  folders: string[];
  services: Service[];
}

const validServerTypes = ["MapServer", "FeatureServer"];

class ArcGisServerStratum
  extends LoadableStratum(ArcGisCatalogGroupTraits)
  implements LockedDownStratum<ArcGisCatalogGroupTraits, ArcGisServerStratum>
{
  static stratumName = "arcgisServer";

  constructor(
    private readonly _catalogGroup: ArcGisCatalogGroup,
    private readonly _arcgisServer: ArcGisServer
  ) {
    super();
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new ArcGisServerStratum(
      model as ArcGisCatalogGroup,
      this._arcgisServer
    ) as this;
  }

  private get arcgisServerData() {
    return this._arcgisServer;
  }

  static async load(
    catalogGroup: ArcGisCatalogGroup
  ): Promise<ArcGisServerStratum> {
    const uri = new URI(catalogGroup.url).addQuery("f", "json");
    return loadJson(proxyCatalogItemUrl(catalogGroup, uri.toString()))
      .then((arcgisServer: ArcGisServer) => {
        // Is this really a ArcGisServer REST response?
        if (
          !arcgisServer ||
          (!arcgisServer.folders && !arcgisServer.services)
        ) {
          throw networkRequestError({
            title: i18next.t("models.arcGisService.invalidServiceTitle"),
            message: i18next.t("models.arcGisService.invalidServiceMessage")
          });
        }

        const stratum = new ArcGisServerStratum(catalogGroup, arcgisServer);
        return stratum;
      })
      .catch(() => {
        throw networkRequestError({
          sender: catalogGroup,
          title: i18next.t("models.arcGisService.groupNotAvailableTitle"),
          message: i18next.t("models.arcGisService.groupNotAvailableMessage")
        });
      });
  }

  @computed
  get members(): ModelReference[] {
    return filterOutUndefined(
      this.folders
        .map((folder) => {
          return (
            this._catalogGroup.uniqueId +
            "/" +
            removePathFromName(getBasePath(this._catalogGroup), folder)
          );
        })
        .concat(
          this.services
            .filter((service) => {
              return validServerTypes.indexOf(service.type) !== -1;
            })
            .map((service) => {
              return (
                this._catalogGroup.uniqueId +
                "/" +
                removePathFromName(
                  getBasePath(this._catalogGroup),
                  service.name
                ) +
                "/" +
                service.type
              );
            })
        )
    );
  }

  @computed
  private get folders(): readonly string[] {
    return this._arcgisServer.folders ? this._arcgisServer.folders : [];
  }

  @computed
  private get services(): readonly Service[] {
    return this._arcgisServer.services ? this._arcgisServer.services : [];
  }

  @action
  createMembers(): void {
    this.createMembersFromFolders();
    this.createMembersFromServices();
  }

  @action
  private createMembersFromFolders() {
    this.folders.forEach((folder) => this.createMemberFromFolder(folder));
  }

  @action
  private createMemberFromFolder(folder: string) {
    const localName = removePathFromName(
      getBasePath(this._catalogGroup),
      folder
    );

    const id = this._catalogGroup.uniqueId;
    const layerId = id + "/" + localName;
    const existingModel = this._catalogGroup.terria.getModelById(
      ArcGisCatalogGroup,
      layerId
    );

    let model: ArcGisCatalogGroup;
    if (existingModel === undefined) {
      model = new ArcGisCatalogGroup(layerId, this._catalogGroup.terria);
      this._catalogGroup.terria.addModel(model);
    } else {
      model = existingModel;
    }

    // Replace the stratum inherited from the parent group.
    model.strata.delete(CommonStrata.definition);

    model.setTrait(CommonStrata.definition, "name", replaceUnderscores(folder));

    const uri = new URI(this._catalogGroup.url).segment(folder);
    model.setTrait(CommonStrata.definition, "url", uri.toString());
  }

  @action
  private createMembersFromServices() {
    this.services.forEach((service) => this.createMemberFromService(service));
  }

  @action
  private createMemberFromService(service: Service) {
    const localName = removePathFromName(
      getBasePath(this._catalogGroup),
      service.name
    );
    const serverTypeIndex = validServerTypes.indexOf(service.type);
    if (serverTypeIndex < 0) {
      return;
    }
    const id = this._catalogGroup.uniqueId;
    const layerId = id + "/" + localName + "/" + service.type;
    let model: ArcGisMapServerCatalogGroup | ArcGisFeatureServerCatalogGroup;
    if (serverTypeIndex === 0) {
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
        ArcGisFeatureServerCatalogGroup,
        layerId
      );
      if (existingModel === undefined) {
        model = new ArcGisFeatureServerCatalogGroup(
          layerId,
          this._catalogGroup.terria
        );
        this._catalogGroup.terria.addModel(model);
      } else {
        model = existingModel;
      }
    }

    // Replace the stratum inherited from the parent group.
    model.strata.delete(CommonStrata.definition);

    model.setTrait(
      CommonStrata.definition,
      "name",
      replaceUnderscores(localName)
    );

    const uri = new URI(this._catalogGroup.url)
      .segment(localName)
      .segment(service.type);
    model.setTrait(CommonStrata.definition, "url", uri.toString());
  }
}

StratumOrder.addLoadStratum(ArcGisServerStratum.stratumName);

export default class ArcGisCatalogGroup extends UrlMixin(
  GroupMixin(CatalogMemberMixin(CreateModel(ArcGisCatalogGroupTraits)))
) {
  static readonly type = "esri-group";

  constructor(...args: ModelConstructorParameters) {
    super(...args);
    makeObservable(this);
  }

  get type() {
    return ArcGisCatalogGroup.type;
  }

  get typeName() {
    return i18next.t("models.arcGisService.name");
  }

  @override
  get cacheDuration(): string {
    if (isDefined(super.cacheDuration)) {
      return super.cacheDuration;
    }
    return "1d";
  }

  protected forceLoadMetadata(): Promise<void> {
    const url = this.url || "";
    if (/\/MapServer(\/?.*)?$/i.test(url)) {
      return MapServerStratum.load(this).then((stratum) => {
        runInAction(() => {
          this.strata.set(MapServerStratum.stratumName, stratum);
        });
      });
    } else if (/\/FeatureServer(\/.*)?$/i.test(url)) {
      return FeatureServerStratum.load(this).then((stratum) => {
        runInAction(() => {
          this.strata.set(FeatureServerStratum.stratumName, stratum);
        });
      });
    } else {
      return ArcGisServerStratum.load(this).then((stratum) => {
        runInAction(() => {
          this.strata.set(ArcGisServerStratum.stratumName, stratum);
        });
      });
    }
  }

  protected async forceLoadMembers() {
    const arcgisServerStratum =
      this.strata.get(ArcGisServerStratum.stratumName) ||
      this.strata.get(MapServerStratum.stratumName) ||
      (this.strata.get(FeatureServerStratum.stratumName) as
        | ArcGisServerStratum
        | MapServerStratum
        | FeatureServerStratum
        | undefined);

    await runLater(() => {
      if (arcgisServerStratum instanceof ArcGisServerStratum) {
        arcgisServerStratum.createMembers();
      } else if (
        arcgisServerStratum instanceof MapServerStratum ||
        arcgisServerStratum instanceof FeatureServerStratum
      ) {
        arcgisServerStratum.createMembers();
      }
    });
  }
}

function removePathFromName(basePath: string, name: string) {
  if (!basePath && basePath.length === 0) {
    return name;
  }

  const index = name.indexOf(basePath);
  if (index === 0) {
    return name.substring(basePath.length + 1);
  } else {
    return name;
  }
}

function getBasePath(catalogGroup: ArcGisCatalogGroup) {
  const match = /rest\/services\/(.*)/i.exec(catalogGroup.url || "");
  if (match && match.length > 1) {
    return match[1];
  } else {
    return "";
  }
}
