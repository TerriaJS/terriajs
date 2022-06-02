import ReferenceMixin from "../../../lib/ModelMixins/ReferenceMixin";
import TableMixin from "../../../lib/ModelMixins/TableMixin";
import CatalogMemberFactory from "../../../lib/Models/Catalog/CatalogMemberFactory";
import registerCatalogMembers from "../../../lib/Models/Catalog/registerCatalogMembers";
import hasTraits from "../../../lib/Models/Definition/hasTraits";
import {
  BaseModel,
  ModelConstructor
} from "../../../lib/Models/Definition/Model";
import Terria from "../../../lib/Models/Terria";
import LegendOwnerTraits from "../../../lib/Traits/TraitsClasses/LegendOwnerTraits";

describe("All Catalog models", () => {
  // AKA developer shock collar - stop developers from doing undesirable things

  let models: [string, BaseModel][];
  beforeEach(() => {
    const terria = new Terria({
      baseUrl: "./"
    });
    registerCatalogMembers();
    models = CatalogMemberFactory.constructorsArray.map(
      ([modelName, modelConstructor]: [
        string,
        ModelConstructor<BaseModel>
      ]) => [
        modelName,
        new modelConstructor(undefined, terria, undefined, undefined)
      ]
    );
  });

  it("Have LegendOwnerTraits, unless they use ReferenceMixin, or are explicitly excluded", () => {
    // Intended to prevent newly created CatalogItems from accidentally forgetting to include LegendOwnerTraits
    models
      .filter(
        ([modelName, model]) =>
          !ReferenceMixin.isMixedInto(model) &&
          !["stub", "group", "cesium-terrain"].includes(modelName)
      )
      .forEach(([modelName, model]) => {
        return expect(
          hasTraits(model, LegendOwnerTraits, "legends")
        ).toBeTruthy(`\`legends\` missing for ${modelName}`);
      });
  });

  it("Don't have a `legends` or `legend` property unless they have LegendOwnerTraits", () => {
    // The only correct way to provide a legend is through legendOwnerTraits.
    models
      .filter(
        ([modelName, model]) => !hasTraits(model, LegendOwnerTraits, "legends")
      )
      .forEach(([modelName, model]) => {
        expect((model as any).legends).toBeUndefined(
          `\`legends\` present for ${modelName}`
        );
        expect((model as any).legend).toBeUndefined(
          `\`legend\` present for ${modelName}`
        );
      });
  });
});
