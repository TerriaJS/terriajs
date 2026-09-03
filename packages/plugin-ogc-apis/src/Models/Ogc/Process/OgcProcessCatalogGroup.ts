import { computed, makeObservable } from "mobx";
import {
  BaseModel,
  CatalogMemberMixin,
  CreateModel,
  TerriaError
} from "terriajs-plugin-api";
import GroupMixin from "terriajs/lib/ModelMixins/GroupMixin";
import LoadableStratum from "terriajs/lib/Models/Definition/LoadableStratum";
import StratumOrder from "terriajs/lib/Models/Definition/StratumOrder";
import OgcProcessCatalogGroupTraits from "../../../Traits/OgcProcessCatalogGroupTraits";
import { client, OgcProcessSummary } from "./OgcProcess";
import OgcProcessCatalogFunction from "./OgcProcessCatalogFunction";

/**
 * @internal
 */
export default class OgcProcessCatalogGroup extends GroupMixin(
  CatalogMemberMixin(CreateModel(OgcProcessCatalogGroupTraits))
) {
  static readonly type = "ogc-process-group";

  get type() {
    return OgcProcessCatalogGroup.type;
  }

  protected async forceLoadMembers(): Promise<void> {
    if (!this.url) {
      throw new TerriaError({
        message: "Process group not set up properly: `url' is not set"
      });
    }
    const summaries = await client.listProcessSummaries(this, this.url);
    const stratum = new ProcessListStratum(this, this.url, summaries.processes);
    this.strata.set(ProcessListStratum.stratumName, stratum);
  }
}

class ProcessListStratum extends LoadableStratum(OgcProcessCatalogGroupTraits) {
  static readonly stratumName = "ogcProcessListStratum";

  private readonly group: OgcProcessCatalogGroup;
  private readonly processes: OgcProcessSummary[];
  private readonly apiUrl: string;

  constructor(
    group: OgcProcessCatalogGroup,
    apiUrl: string,
    processes: OgcProcessSummary[]
  ) {
    super();
    this.group = group;
    this.apiUrl = apiUrl;
    this.processes = processes;
    makeObservable(this);

    this.createMembers();
  }

  public duplicateLoadableStratum(newModel: BaseModel): this {
    return new ProcessListStratum(
      newModel as OgcProcessCatalogGroup,
      this.apiUrl,
      this.processes
    ) as this;
  }

  private createMembers() {
    this.processes.forEach((process) => {
      return OgcProcessCatalogFunction.getOrCreateModel(
        this.group.terria,
        this.group.uniqueId ?? "",
        process.id,
        this.apiUrl,
        {
          name: process.title,
          description: process.description,
          processId: process.id,
          processGroupId: this.group.uniqueId
        }
      );
    });
  }

  @computed
  get members(): string[] {
    return this.processes.map(
      (process) => `${this.group.uniqueId}/${process.id}`
    );
  }
}

StratumOrder.addLoadStratum(ProcessListStratum.stratumName);
