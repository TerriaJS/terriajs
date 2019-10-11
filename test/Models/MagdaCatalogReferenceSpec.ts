import CommonStrata from "../../lib/Models/CommonStrata";
import MagdaCatalogReference from "../../lib/Models/MagdaCatalogReference";
import Terria from "../../lib/Models/Terria";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import CatalogGroup from "../../lib/Models/CatalogGroupNew";
import GroupMixin from "../../lib/ModelMixins/GroupMixin";

describe("MagdaCatalogReference", function() {
  const recordGroupWithOneCsv = {
    id: "test-group",
    name: "Test Group",
    aspects: {
      group: {
        members: [
          {
            id: "thing-in-group",
            name: "A thing in the group",
            aspects: {
              terria: {
                type: "csv",
                definition: {
                  url: "some.csv"
                }
              }
            }
          }
        ]
      }
    }
  };

  it("can dereference to a group", function(done) {
    const terria = new Terria();
    CatalogMemberFactory.register(CsvCatalogItem.type, CsvCatalogItem);

    const model = new MagdaCatalogReference(undefined, terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(CommonStrata.definition, "magdaRecord", recordGroupWithOneCsv);

    model.loadReference().then(() => {
      expect(model.dereferenced instanceof CatalogGroup).toBe(true);
      const group = model.dereferenced as CatalogGroup;
      expect(group.isOpen).toBe(false);
    }).then(done).catch(done.fail);
  });

  it("dereferenced group contains expected item", function(done) {
    const terria = new Terria();
    CatalogMemberFactory.register(CsvCatalogItem.type, CsvCatalogItem);

    const model = new MagdaCatalogReference(undefined, terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(CommonStrata.definition, "magdaRecord", recordGroupWithOneCsv);

    model.loadReference().then(() => {
      const group = model.dereferenced as CatalogGroup;
      expect(group.members.length).toBe(1);
      expect(group.members[0]).toBe(recordGroupWithOneCsv.aspects.group.members[0].id);
      expect(group.memberModels.length).toBe(1);
      expect(group.memberModels[0] instanceof CsvCatalogItem).toBe(true);
    }).then(done).catch(done.fail);
  });

  it("definition trait can override traits of dereferenced member", function(done) {
    const terria = new Terria();
    CatalogMemberFactory.register(CsvCatalogItem.type, CsvCatalogItem);

    const model = new MagdaCatalogReference(undefined, terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(CommonStrata.definition, "magdaRecord", recordGroupWithOneCsv);
    model.setTrait(CommonStrata.definition, "override", {
      isOpen: true
    });

    model.loadReference().then(() => {
      const group = model.dereferenced as CatalogGroup;
      expect(group.isOpen).toBe(true);
    }).then(done).catch(done.fail);
  });

  it("override trait can override traits of the members of a dereferenced group", function(done) {
    const terria = new Terria();
    CatalogMemberFactory.register(CsvCatalogItem.type, CsvCatalogItem);

    const model = new MagdaCatalogReference(undefined, terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(CommonStrata.definition, "magdaRecord", recordGroupWithOneCsv);
    model.setTrait(CommonStrata.definition, "override", {
      members: [
        {
          id: "thing-in-group",
          type: "csv",
          url: "somethingelse.csv"
        }
      ]
    });

    model.loadReference().then(() => {
      const group = model.dereferenced as CatalogGroup;
      const csv = group.memberModels[0] as CsvCatalogItem;
      expect(csv.url).toBe("somethingelse.csv");
    }).then(done).catch(done.fail);
  });
});
