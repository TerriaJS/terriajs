import { computed } from "mobx";
import { createTransformer } from "mobx-utils";
import Constructor from "../Core/Constructor";
import { JsonObject } from "../Core/Json";
import loadJson from "../Core/loadJson";
import makeRealPromise from "../Core/makeRealPromise";
import TerriaError from "../Core/TerriaError";
import Model from "../Models/Model";
import ModelPropertiesFromTraits from "../Models/ModelPropertiesFromTraits";
import proxyCatalogItemUrl from "../Models/proxyCatalogItemUrl";
import MagdaDistributionFormatTraits from "../Traits/MagdaDistributionFormatTraits";
import MagdaTraits from "../Traits/MagdaTraits";

type MagdaModel = Model<MagdaTraits> & {
  readonly uri: uri.URI | undefined;
};

interface RecordOptions {
  id: string | undefined;
  aspects?: string[];
  optionalAspects?: string[];
  dereference?: boolean;
}

const prepareDistributionFormat = createTransformer(
  (format: ModelPropertiesFromTraits<MagdaDistributionFormatTraits>) => {
    return {
      formatRegex: format.formatRegex
        ? new RegExp(format.formatRegex, "i")
        : undefined,
      urlRegex: format.urlRegex ? new RegExp(format.urlRegex, "i") : undefined,
      definition: format.definition
    };
  }
);

export default function MagdaMixin<T extends Constructor<MagdaModel>>(Base: T) {
  class MagdaMixin extends Base {
    @computed
    get registryUri(): uri.URI | undefined {
      const uri = this.uri;
      if (uri === undefined) {
        return undefined;
      }
      return uri.clone().segment("api/v0/registry");
    }

    @computed
    get preparedDistributionFormats() {
      return (
        this.distributionFormats &&
        this.distributionFormats.map(prepareDistributionFormat)
      );
    }

    protected buildMagdaRecordUri(options: RecordOptions): uri.URI | undefined {
      const registryUri = this.registryUri;
      if (options.id === undefined || registryUri === undefined) {
        return undefined;
      }

      const recordUri = registryUri
        .clone()
        .segment(`records/${encodeURIComponent(options.id)}`);

      if (options.aspects) {
        recordUri.addQuery("aspect", options.aspects);
      }
      if (options.optionalAspects) {
        recordUri.addQuery("optionalAspect", options.optionalAspects);
      }
      if (options.dereference) {
        recordUri.addQuery("dereference", "true");
      }

      return recordUri;
    }

    protected loadMagdaRecord(options: RecordOptions): Promise<JsonObject> {
      const recordUri = this.buildMagdaRecordUri(options);
      if (recordUri === undefined) {
        return Promise.reject(
          new TerriaError({
            sender: this,
            title: "Cannot load Magda record",
            message: "The Magda URL or the record ID is unknown."
          })
        );
      }
      const proxiedUrl = proxyCatalogItemUrl(this, recordUri.toString(), "0d");
      return loadJson(proxiedUrl);
    }
  }

  return MagdaMixin;
}
