import { runInAction } from "mobx";
import CatalogGroup from "../../lib/Models/CatalogGroupNew";
import CatalogMemberFactory from "../../lib/Models/CatalogMemberFactory";
import CommonStrata from "../../lib/Models/CommonStrata";
import CsvCatalogItem from "../../lib/Models/CsvCatalogItem";
import MagdaReference from "../../lib/Models/MagdaReference";
import Terria from "../../lib/Models/Terria";

describe("MagdaReference", function() {
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

  beforeEach(function() {
    CatalogMemberFactory.register(CatalogGroup.type, CatalogGroup);
    CatalogMemberFactory.register(CsvCatalogItem.type, CsvCatalogItem);
  });

  it("can dereference to a group", function(done) {
    const terria = new Terria();

    const model = new MagdaReference(undefined, terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(
      CommonStrata.definition,
      "magdaRecord",
      recordGroupWithOneCsv
    );

    model
      .loadReference()
      .then(() => {
        expect(model.target instanceof CatalogGroup).toBe(true);
        const group = model.target as CatalogGroup;
        expect(group.isOpen).toBe(false);
      })
      .then(done)
      .catch(done.fail);
  });

  it("dereferenced group contains expected item", function(done) {
    const terria = new Terria();

    const model = new MagdaReference(undefined, terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(
      CommonStrata.definition,
      "magdaRecord",
      recordGroupWithOneCsv
    );

    model
      .loadReference()
      .then(() => {
        const group = model.target as CatalogGroup;
        expect(group.members.length).toBe(1);
        expect(group.members[0]).toBe(
          recordGroupWithOneCsv.aspects.group.members[0].id
        );
        expect(group.memberModels.length).toBe(1);
        expect(group.memberModels[0] instanceof CsvCatalogItem).toBe(true);
      })
      .then(done)
      .catch(done.fail);
  });

  it("definition trait can override traits of dereferenced member", function(done) {
    const terria = new Terria();

    const model = new MagdaReference(undefined, terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(
      CommonStrata.definition,
      "magdaRecord",
      recordGroupWithOneCsv
    );
    model.setTrait(CommonStrata.definition, "override", {
      isOpen: true
    });

    model
      .loadReference()
      .then(() => {
        const group = model.target as CatalogGroup;
        expect(group.isOpen).toBe(true);
      })
      .then(done)
      .catch(done.fail);
  });

  it("override trait can override traits of the members of a dereferenced group", function(done) {
    const terria = new Terria();

    const model = new MagdaReference(undefined, terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(
      CommonStrata.definition,
      "magdaRecord",
      recordGroupWithOneCsv
    );
    model.setTrait(CommonStrata.definition, "override", {
      members: [
        {
          id: "thing-in-group",
          type: "csv",
          url: "somethingelse.csv"
        }
      ]
    });

    model
      .loadReference()
      .then(() => {
        const group = model.target as CatalogGroup;
        const csv = group.memberModels[0] as CsvCatalogItem;
        expect(csv.url).toBe("somethingelse.csv");
      })
      .then(done)
      .catch(done.fail);
  });

  it("changes to override trait affect members of a dereferenced group", async function(done) {
    const terria = new Terria();

    const model = new MagdaReference(undefined, terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(
      CommonStrata.definition,
      "magdaRecord",
      recordGroupWithOneCsv
    );
    model.setTrait(CommonStrata.definition, "override", {
      members: [
        {
          id: "thing-in-group",
          type: "csv",
          url: "first.csv"
        }
      ]
    });

    Promise.resolve()
      .then(async () => {
        await model.loadReference();

        const group = model.target as CatalogGroup;
        const csv = group.memberModels[0] as CsvCatalogItem;
        expect(csv.url).toBe("first.csv");

        runInAction(() => {
          const override: any = model.getTrait(
            CommonStrata.definition,
            "override"
          );
          override.members[0].url = "second.csv";
        });

        await model.loadReference();

        const group2 = model.target as CatalogGroup;
        const csv2 = group2.memberModels[0] as CsvCatalogItem;
        expect(csv2.url).toBe("second.csv");
      })
      .then(done)
      .catch(done.fail);
  });

  it("changes to Magda record affect members of a dereferenced group", async function(done) {
    const terria = new Terria();

    const model = new MagdaReference(undefined, terria);
    model.setTrait(CommonStrata.definition, "recordId", "test-group");
    model.setTrait(
      CommonStrata.definition,
      "magdaRecord",
      recordGroupWithOneCsv
    );
    model.setTrait(CommonStrata.definition, "override", {
      members: [
        {
          id: "thing-in-group",
          type: "csv",
          url: "first.csv"
        }
      ]
    });

    Promise.resolve()
      .then(async () => {
        await model.loadReference();

        const group = model.target as CatalogGroup;
        const csv = group.memberModels[0] as CsvCatalogItem;
        expect(csv.name).toContain("A thing");

        runInAction(() => {
          const magdaRecord: any = model.getTrait(
            CommonStrata.definition,
            "magdaRecord"
          );
          magdaRecord.aspects.group.members[0].name = "!!!";
        });

        await model.loadReference();

        const group2 = model.target as CatalogGroup;
        const csv2 = group2.memberModels[0] as CsvCatalogItem;
        expect(csv2.name).toBe("!!!");
      })
      .then(done)
      .catch(done.fail);
  });
});
