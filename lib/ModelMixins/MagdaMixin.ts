import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import UrlTraits from "../Traits/UrlTraits";
import URI from "urijs";

type MagdaModel = Model<UrlTraits> & {
  readonly uri: uri.URI | undefined;
};

interface RecordOptions {
  aspects?: string[];
  optionalAspects?: string[];
  dereference?: boolean;
}

export default function MagdaMixin<
  T extends Constructor<MagdaModel>
>(Base: T) {
  class MagdaMixin extends Base {
    get registryUri(): uri.URI | undefined {
      const uri = this.uri;
      if (uri === undefined) {
        return undefined;
      }
      return uri.clone().segment("api/v0/registry");
    }

    buildRecordUri(id: string | undefined, options: RecordOptions = {}): uri.URI | undefined {
      const registryUri = this.registryUri;
      if (id === undefined || registryUri === undefined) {
        return undefined;
      }

      const recordUri = registryUri.clone().segment(`records/${encodeURIComponent(id)}`);

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
  }

  return MagdaMixin;
}
