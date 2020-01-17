import { runInAction } from "mobx";
import Terria from "../../lib/Models/Terria";
import WebMapServiceCatalogItem from "../../lib/Models/WebMapServiceCatalogItem";
import updateModelFromJson from "../../lib/Models/updateModelFromJson";
import { BaseModel } from "../../lib/Models/Model";
import CommonStrata from "../../lib/Models/CommonStrata";

describe("updateModelFromJson", function() {
  let model: BaseModel;

  beforeEach(function() {
    model = new WebMapServiceCatalogItem("Test", new Terria());
    runInAction(() => {
      model.setTrait(CommonStrata.definition, "url", "A");
      model.setTrait(CommonStrata.definition, "name", "B");
      model.setTrait(CommonStrata.user, "name", "C");
    });
  });

  describe("when replaceStratum is", function() {
    it("true then the stratum is replaced", function() {
      updateModelFromJson(model, CommonStrata.definition, { url: "Z" }, true);

      expect(model.getTrait(CommonStrata.definition, "url")).toBe("Z");
      expect(model.getTrait(CommonStrata.definition, "name")).toBeUndefined();
      expect(model.getTrait(CommonStrata.user, "name")).toBe("C");
    });

    it("false then the stratum is not replaced", function() {
      updateModelFromJson(model, CommonStrata.definition, { url: "Z" }, false);

      expect(model.getTrait(CommonStrata.definition, "url")).toBe("Z");
      expect(model.getTrait(CommonStrata.definition, "name")).toBe("B");
      expect(model.getTrait(CommonStrata.user, "name")).toBe("C");
    });

    it("not specified then the stratum is not replaced", function() {
      updateModelFromJson(model, CommonStrata.definition, { url: "Z" });

      expect(model.getTrait(CommonStrata.definition, "url")).toBe("Z");
      expect(model.getTrait(CommonStrata.definition, "name")).toBe("B");
      expect(model.getTrait(CommonStrata.user, "name")).toBe("C");
    });
  });
});
