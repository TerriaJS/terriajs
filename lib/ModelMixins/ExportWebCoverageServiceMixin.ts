import AsyncLoader from "../Core/AsyncLoader";
import Constructor from "../Core/Constructor";
import Model, { BaseModel } from "../Models/Definition/Model";
import ExportWebCoverageServiceTraits from "../Traits/TraitsClasses/ExportWebCoverageServiceTraits";
import ExportableMixin from "./ExportableMixin";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import { computed } from "mobx";
import Result from "../Core/Result";
import TerriaError, { networkRequestError } from "../Core/TerriaError";
import { getName } from "./CatalogMemberMixin";
import loadXML from "../Core/loadXML";
import xml2json from "../ThirdParty/xml2json";
import { defined } from "terriajs-cesium";

class WebCoverageServiceCapabilitiesStratum extends LoadableStratum(
  ExportWebCoverageServiceTraits
) {
  static stratumName = "wcsCapabilitiesStratum";

  // static async load(catalogItem: ExportWebCoverageServiceMixin.Instance) {
  //   if (!catalogItem.linkedWcsUrl) throw "`linkedWcsUrl` is undefined"
  //   const capabilitiesXml = await loadXML(url)
  //   const json = xml2json(capabilitiesXml);
  //   if (!defined(json.Capability)) {
  //     throw networkRequestError({
  //       title: "Invalid GetCapabilities",
  //       message: `The URL ${url} was retrieved successfully but it does not appear to be a valid Web Coverage Service (WCS) GetCapabilities document.` +
  //         `\n\nEither the catalog file has been set up incorrectly, or the server address has changed.`
  //     });
  //   }
  // }

  constructor(readonly catalogItem: ExportWebCoverageServiceMixin.Instance) {
    super();
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new WebCoverageServiceCapabilitiesStratum(
      model as ExportWebCoverageServiceMixin.Instance
    ) as this;
  }
}

function ExportWebCoverageServiceMixin<
  T extends Constructor<Model<ExportWebCoverageServiceTraits>>
>(Base: T) {
  abstract class ExportWebCoverageServiceMixin extends ExportableMixin(Base) {
    private _wcsCapabilitiesLoader = new AsyncLoader(
      this.loadWcsCapabilities.bind(this)
    );

    private _wcsDescribeCoverageLoader = new AsyncLoader(
      this.loadWcsDescribeCoverage.bind(this)
    );

    @computed
    get isLoadingWcsMetadata(): boolean {
      return (
        this._wcsCapabilitiesLoader.isLoading ||
        this._wcsDescribeCoverageLoader.isLoading
      );
    }

    /**
     *
     */
    async loadWcsMetadata(force?: boolean) {
      const results = await Promise.all([
        this._wcsCapabilitiesLoader.load(force),
        this._wcsDescribeCoverageLoader.load(force)
      ]);

      return Result.combine(results, {
        message: `Failed to load \`${getName(
          this
        )}\` WebCoverageService metadata`,
        importance: -1
      });
    }

    private async loadWcsCapabilities() {}
    private async loadWcsDescribeCoverage() {}

    dispose() {
      super.dispose();
      this._wcsCapabilitiesLoader.dispose();
      this._wcsDescribeCoverageLoader.dispose();
    }
  }

  return ExportWebCoverageServiceMixin;
}

namespace ExportWebCoverageServiceMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof ExportWebCoverageServiceMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return (
      model &&
      "loadWcsMetadata" in model &&
      typeof model.loadWcsMetadata === "function"
    );
  }
}

export default ExportWebCoverageServiceMixin;
