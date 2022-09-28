import i18next from "i18next";
import { action, computed, runInAction } from "mobx";
import URI from "urijs";
import filterOutUndefined from "../../../Core/filterOutUndefined";
import { isJsonObject } from "../../../Core/Json";
import replaceUnderscores from "../../../Core/replaceUnderscores";
import runLater from "../../../Core/runLater";
import TerriaError from "../../../Core/TerriaError";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import GetCapabilitiesMixin from "../../../ModelMixins/GetCapabilitiesMixin";
import GroupMixin from "../../../ModelMixins/GroupMixin";
import UrlMixin from "../../../ModelMixins/UrlMixin";
import { InfoSectionTraits } from "../../../Traits/TraitsClasses/CatalogMemberTraits";
import ModelReference from "../../../Traits/ModelReference";
import WebProcessingServiceCatalogGroupTraits from "../../../Traits/TraitsClasses/WebProcessingServiceCatalogGroupTraits";
import CommonStrata from "../../Definition/CommonStrata";
import CreateModel from "../../Definition/CreateModel";
import createStratumInstance from "../../Definition/createStratumInstance";
import LoadableStratum from "../../Definition/LoadableStratum";
import { BaseModel } from "../../Definition/Model";
import proxyCatalogItemUrl from "../proxyCatalogItemUrl";
import StratumFromTraits from "../../Definition/StratumFromTraits";
import WebProcessingServiceCapabilities, {
  Process
} from "./WebProcessingServiceCapabilities";
import WebProcessingServiceCatalogFunction from "./WebProcessingServiceCatalogFunction";

class GetCapabilitiesStratum extends LoadableStratum(
  WebProcessingServiceCatalogGroupTraits
) {
  constructor(
    readonly model: WebProcessingServiceCatalogGroup,
    readonly capabilities: WebProcessingServiceCapabilities
  ) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new GetCapabilitiesStratum(
      model as WebProcessingServiceCatalogGroup,
      this.capabilities
    ) as this;
  }

  @action
  static async load(
    model: WebProcessingServiceCatalogGroup
  ): Promise<GetCapabilitiesStratum> {
    if (model.getCapabilitiesUrl === undefined) {
      throw new TerriaError({
        title: i18next.t(
          "models.webProcessingServiceCatalogGroup.missingUrlTitle"
        ),
        message: i18next.t(
          "models.webProcessingServiceCatalogGroup.missingUrlMessage"
        )
      });
    }
    const capabilities = await WebProcessingServiceCapabilities.fromUrl(
      proxyCatalogItemUrl(
        model,
        model.getCapabilitiesUrl,
        model.getCapabilitiesCacheDuration
      )
    );
    const stratum = new GetCapabilitiesStratum(model, capabilities);
    return stratum;
  }

  @computed
  get name(): string | undefined {
    const title = this.capabilities.ServiceIdentification.Title;
    if (title !== undefined) {
      return replaceUnderscores(title);
    }
  }

  @computed
  get info() {
    const result: StratumFromTraits<InfoSectionTraits>[] = [];
    const service = this.capabilities.ServiceIdentification;

    if (service.Abstract) {
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t("models.webProcessingServiceCatalogGroup.abstract"),
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
            "models.webProcessingServiceCatalogGroup.accessConstraints"
          ),
          content: service.AccessConstraints
        })
      );
    }

    // Show the Fees if it isn't "none".
    if (service.Fees && !/^none$/i.test(service.Fees)) {
      result.push(
        createStratumInstance(InfoSectionTraits, {
          name: i18next.t("models.webProcessingServiceCatalogGroup.fees"),
          content: service.Fees
        })
      );
    }

    const serviceProvider = this.capabilities.ServiceProvider;
    if (serviceProvider) {
      if (serviceProvider.ProviderName) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t(
              "models.webProcessingServiceCatalogGroup.providerName"
            ),
            content: serviceProvider.ProviderName
          })
        );
      }

      if (serviceProvider.ProviderSite?.["xlink:href"]) {
        result.push(
          createStratumInstance(InfoSectionTraits, {
            name: i18next.t(
              "models.webProcessingServiceCatalogGroup.providerSite"
            ),
            content: serviceProvider.ProviderSite["xlink:href"]
          })
        );
      }
    }

    return result;
  }

  @computed
  get members(): ModelReference[] {
    return filterOutUndefined(
      this.capabilities.ProcessOfferings?.map((process) =>
        this.getProcessId(process)
      ) ?? []
    );
  }

  getProcessId(process: Process): string | undefined {
    if (this.model.uniqueId !== undefined) {
      return `${this.model.uniqueId}/${process.Identifier}`;
    }
  }

  createMembersForProcesses() {
    this.capabilities.ProcessOfferings?.forEach((process) =>
      this.createMemberForProcess(process)
    );
  }

  @action
  createMemberForProcess(process: Process) {
    const processId = this.getProcessId(process);
    if (processId === undefined) {
      return;
    }

    const memberModel: WebProcessingServiceCatalogFunction =
      this.getOrCreateWPSCatalogFunction(processId);

    // Replace the stratum inherited from the parent group.
    memberModel.strata.delete(CommonStrata.definition);

    memberModel.setTrait(CommonStrata.definition, "name", process.Title);
    memberModel.setTrait(CommonStrata.definition, "url", this.model.url);
    memberModel.setTrait(
      CommonStrata.definition,
      "identifier",
      process.Identifier
    );
    memberModel.setTrait(
      CommonStrata.definition,
      "description",
      process.Abstract
    );
  }

  getOrCreateWPSCatalogFunction(
    id: string
  ): WebProcessingServiceCatalogFunction {
    const terria = this.model.terria;
    const existingModel = terria.getModelById(
      WebProcessingServiceCatalogFunction,
      id
    );
    if (existingModel !== undefined) {
      return existingModel;
    }

    const wpsItem = new WebProcessingServiceCatalogFunction(id, terria);
    terria.addModel(wpsItem);
    return wpsItem;
  }
}

export default class WebProcessingServiceCatalogGroup extends GroupMixin(
  GetCapabilitiesMixin(
    UrlMixin(
      CatalogMemberMixin(CreateModel(WebProcessingServiceCatalogGroupTraits))
    )
  )
) {
  static readonly type = "wps-getCapabilities";

  get type() {
    return WebProcessingServiceCatalogGroup.type;
  }

  get typeName() {
    return i18next.t("models.webProcessingServiceCatalogGroup.typeName");
  }

  async forceLoadMetadata(): Promise<void> {
    const stratum = await GetCapabilitiesStratum.load(this);
    runInAction(() => {
      this.strata.set(GetCapabilitiesMixin.getCapabilitiesStratumName, stratum);
    });
  }

  async forceLoadMembers(): Promise<void> {
    const getCapabilitiesStratum = <GetCapabilitiesStratum | undefined>(
      this.strata.get(GetCapabilitiesMixin.getCapabilitiesStratumName)
    );
    if (getCapabilitiesStratum) {
      await runLater(() => getCapabilitiesStratum.createMembersForProcesses());
    }
  }

  @computed
  get defaultGetCapabilitiesUrl(): string | undefined {
    return this.url === undefined
      ? undefined
      : new URI(this.url)
          .search({
            service: "WPS",
            request: "GetCapabilities",
            version: "1.0.0"
          })
          .toString();
  }
}
