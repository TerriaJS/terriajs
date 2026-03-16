import { http, HttpResponse } from "msw";
import CatalogIndexReference from "../../../../lib/Models/Catalog/CatalogReferences/CatalogIndexReference";
import MagdaReference from "../../../../lib/Models/Catalog/CatalogReferences/MagdaReference";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../../lib/Models/Terria";
import { worker } from "../../../mocks/browser";

describe("CatalogIndexReference", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
  });

  describe("loadReference", function () {
    describe("when a parent container is a deeply nested reference", function () {
      it("recursively loads all the references to fully expand the references", async function () {
        // We are setting up the following hierarchy: MagdaReference -> TerriaReference -> Group -> Leaf
        // and asserting that we load the reference containers all the way down to the Leaf node

        // Setup parent magda reference item
        const parent = new MagdaReference("parent", terria);
        parent.setTrait(CommonStrata.definition, "magdaRecord", {
          // the parent points to another reference of type terria-reference
          aspects: {
            terria: {
              definition: {
                name: "Group",
                description: "Group",
                url: "https://example.org/catalog.json"
              },
              id: "some-group",
              type: "terria-reference"
            }
          },
          id: "some-group",
          name: "Group"
        });

        // The terria-reference points to a group containg a 'leaf' node.
        worker.use(
          http.get("https://example.org/catalog.json", () =>
            HttpResponse.json({
              catalog: [
                {
                  type: "group",
                  name: "Group",
                  members: [{ id: "leaf", type: "csv", name: "leaf" }]
                }
              ]
            })
          )
        );

        const leafIndex = new CatalogIndexReference("leaf", terria);
        terria.addModel(parent);
        updateModelFromJson(leafIndex, CommonStrata.defaults, {
          memberKnownContainerUniqueIds: ["parent"]
        });
        await leafIndex.loadReference();
        // Ensure then index reference is correctly resolved to the leaf node
        expect(leafIndex.nestedTarget?.uniqueId).toBe("leaf");
      });
    });
  });
});
