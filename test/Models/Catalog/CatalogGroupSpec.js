"use strict";

var CatalogGroup = require("../../lib/Models/CatalogGroup");
var CatalogItem = require("../../lib/Models/CatalogItem");
var createCatalogMemberFromType = require("../../lib/Models/createCatalogMemberFromType");
var Terria = require("../../../lib/Models/Terria");

describe("CatalogGroup", function () {
  var terria;
  var group;
  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    group = terria.catalog.group;
    group.preserveOrder = false;
    createCatalogMemberFromType.register("group", CatalogGroup);
    createCatalogMemberFromType.register("item", CatalogItem);
  });

  it("sorts on load by default", function (done) {
    group
      .updateFromJson({
        type: "group",
        items: [
          {
            name: "B",
            type: "group",
            url: "http://not.valid"
          },
          {
            name: "A",
            type: "group",
            url: "http://not.valid.either"
          }
        ]
      })
      .then(function () {
        expect(group.items.length).toBe(2);
        expect(group.items[0].name).toBe("A");
        expect(group.items[1].name).toBe("B");
        done();
      });
  });

  it("sorts correctly when there is a number at the beginning", function (done) {
    group
      .updateFromJson({
        type: "group",
        items: [
          {
            name: "10 Thing",
            type: "group",
            url: "http://not.valid"
          },
          {
            name: "2 Thing",
            type: "group",
            url: "http://not.valid.either"
          },
          {
            name: "1 Thing",
            type: "group",
            url: "http://not.valid.either"
          }
        ]
      })
      .then(function () {
        expect(group.items.length).toBe(3);
        expect(group.items[0].name).toBe("1 Thing");
        expect(group.items[1].name).toBe("2 Thing");
        expect(group.items[2].name).toBe("10 Thing");
      })
      .then(done)
      .catch(done.fail);
  });

  it("sorts correctly when there is a number at the end", function (done) {
    group
      .updateFromJson({
        type: "group",
        items: [
          {
            name: "Thing 10",
            type: "group",
            url: "http://not.valid"
          },
          {
            name: "Thing 2",
            type: "group",
            url: "http://not.valid.either"
          },
          {
            name: "Thing 1",
            type: "group",
            url: "http://not.valid.either"
          }
        ]
      })
      .then(function () {
        expect(group.items.length).toBe(3);
        expect(group.items[0].name).toBe("Thing 1");
        expect(group.items[1].name).toBe("Thing 2");
        expect(group.items[2].name).toBe("Thing 10");
      })
      .then(done)
      .catch(done.fail);
  });

  it("sorts correctly when nameInCatalog is provided", function (done) {
    group
      .updateFromJson({
        type: "group",
        items: [
          {
            name: "1",
            type: "group",
            url: "http://not.valid"
          },
          {
            name: "2",
            type: "group",
            nameInCatalog: "4",
            url: "http://not.valid.either"
          },
          {
            name: "3",
            type: "group",
            url: "http://not.valid.either"
          }
        ]
      })
      .then(function () {
        expect(group.items.length).toBe(3);
        expect(group.items[0].name).toBe("1");
        expect(group.items[1].name).toBe("3");
        expect(group.items[2].name).toBe("2");
      })
      .then(done)
      .catch(done.fail);
  });

  it("sorts items correctly when there is a number in the middle", function (done) {
    group
      .updateFromJson({
        type: "group",
        items: [
          {
            name: "Thing 10 Yay",
            type: "group",
            url: "http://not.valid"
          },
          {
            name: "Thing 2 Yay",
            type: "group",
            url: "http://not.valid.either"
          },
          {
            name: "Thing 1 Yay",
            type: "group",
            url: "http://not.valid.either"
          }
        ]
      })
      .then(function () {
        expect(group.items.length).toBe(3);
        expect(group.items[0].name).toBe("Thing 1 Yay");
        expect(group.items[1].name).toBe("Thing 2 Yay");
        expect(group.items[2].name).toBe("Thing 10 Yay");
      })
      .then(done)
      .catch(done.fail);
  });

  it("sorts numbered items after unnumbered items", function (done) {
    group
      .updateFromJson({
        type: "group",
        items: [
          {
            name: "Thing 1",
            type: "group",
            url: "http://not.valid"
          },
          {
            name: "Thing",
            type: "group",
            url: "http://not.valid.either"
          }
        ]
      })
      .then(function () {
        expect(group.items.length).toBe(2);
        expect(group.items[0].name).toBe("Thing");
        expect(group.items[1].name).toBe("Thing 1");
      })
      .then(done)
      .catch(done.fail);
  });

  it("sorts numbers before letters", function (done) {
    group
      .updateFromJson({
        type: "group",
        items: [
          {
            name: "A",
            type: "group",
            url: "http://not.valid"
          },
          {
            name: "10",
            type: "group",
            url: "http://not.valid.either"
          },
          {
            name: "2",
            type: "group",
            url: "http://not.valid.either"
          },
          {
            name: "1",
            type: "group",
            url: "http://not.valid.either"
          }
        ]
      })
      .then(function () {
        expect(group.items.length).toBe(4);
        expect(group.items[0].name).toBe("1");
        expect(group.items[1].name).toBe("2");
        expect(group.items[2].name).toBe("10");
        expect(group.items[3].name).toBe("A");
      })
      .then(done)
      .catch(done.fail);
  });

  it("does not sort on load if preserveOrder is true", function (done) {
    group
      .updateFromJson({
        type: "group",
        preserveOrder: true,
        items: [
          {
            name: "B",
            type: "group",
            url: "http://not.valid"
          },
          {
            name: "A",
            type: "group",
            url: "http://not.valid.either"
          }
        ]
      })
      .then(function () {
        expect(group.items.length).toBe(2);
        expect(group.items[0].name).toBe("B");
        expect(group.items[1].name).toBe("A");
        done();
      });
  });

  it("puts isPromoted items at the top when sorting", function (done) {
    group
      .updateFromJson({
        type: "group",
        items: [
          {
            name: "B",
            type: "group",
            url: "http://not.valid"
          },
          {
            name: "A",
            type: "group",
            url: "http://not.valid.either"
          },
          {
            name: "C",
            isPromoted: true,
            type: "group",
            url: "http://not.valid.either"
          }
        ]
      })
      .then(function () {
        expect(group.items.length).toBe(3);
        expect(group.items[0].name).toBe("C");
        expect(group.items[1].name).toBe("A");
        expect(group.items[2].name).toBe("B");
        done();
      });
  });

  it("puts isPromoted items at the top when preserving order", function (done) {
    group
      .updateFromJson({
        type: "group",
        preserveOrder: true,
        items: [
          {
            name: "B",
            type: "group",
            url: "http://not.valid"
          },
          {
            name: "A",
            type: "group",
            url: "http://not.valid.either"
          },
          {
            name: "C",
            isPromoted: true,
            type: "group",
            url: "http://not.valid.either"
          }
        ]
      })
      .then(function () {
        expect(group.items.length).toBe(3);
        expect(group.items[0].name).toBe("C");
        expect(group.items[1].name).toBe("B");
        expect(group.items[2].name).toBe("A");
        done();
      });
  });

  it("returns the names of its parents separated by / when uniqueId is called if no id present", function (done) {
    group
      .updateFromJson({
        type: "group",
        name: "A",
        items: [
          {
            name: "B",
            type: "group",
            items: [
              {
                name: "C",
                type: "group"
              }
            ]
          }
        ]
      })
      .then(function () {
        expect(group.items[0].items[0].uniqueId).toBe("A/B/C");
        expect(group.items[0].uniqueId).toBe("A/B");
        expect(group.uniqueId).toBe("A");
        done();
      });
  });

  describe("when updating items", function () {
    it("adds new items when onlyUpdateExistingItems isn't specified", function (done) {
      group
        .updateFromJson({
          type: "group",
          items: [
            {
              name: "A",
              type: "item"
            },
            {
              name: "B",
              type: "item"
            },
            {
              name: "C",
              type: "item"
            }
          ]
        })
        .then(function () {
          expect(group.items[0].name).toBe("A");
          expect(group.items[1].name).toBe("B");
          expect(group.items[2].name).toBe("C");
          done();
        });
    });

    it("updates existing items by id ahead of name", function (done) {
      group
        .updateFromJson({
          type: "group",
          items: [
            {
              name: "A",
              type: "item"
            },
            {
              name: "B",
              id: "BUniqueId",
              type: "item"
            }
          ]
        })
        .then(
          group.updateFromJson.bind(group, {
            items: [
              {
                name: "C",
                id: "BUniqueId"
              },
              {
                name: "A"
              }
            ]
          })
        )
        .then(function () {
          expect(group.items[0].name).toBe("A");
          expect(group.items[1].uniqueId).toBe("BUniqueId");
          expect(group.items[1].name).toBe("C");
          expect(group.items.length).toBe(2);
          done();
        });
    });

    it("updates existing items by name", function (done) {
      group
        .updateFromJson({
          type: "group",
          items: [
            {
              name: "A",
              type: "item",
              url: "http://example.com/A"
            },
            {
              name: "B",
              type: "item",
              url: "http://example.com/B"
            }
          ]
        })
        .then(
          group.updateFromJson.bind(group, {
            items: [
              {
                name: "A",
                url: "http://test.com/A"
              },
              {
                name: "B",
                url: "http://test.com/B"
              }
            ]
          })
        )
        .then(function () {
          expect(group.items[0].url).toBe("http://test.com/A");
          expect(group.items[1].url).toBe("http://test.com/B");
          done();
        });
    });

    it("only updates existing items when onlyUpdateExistingItems === true", function (done) {
      group
        .updateFromJson({
          type: "group",
          items: [
            {
              name: "A",
              type: "item",
              url: "http://example.com/A"
            }
          ]
        })
        .then(
          group.updateFromJson.bind(
            group,
            {
              items: [
                {
                  name: "A",
                  url: "http://test.com/A"
                },
                {
                  name: "B",
                  url: "http://test.com/B"
                }
              ]
            },
            {
              onlyUpdateExistingItems: true
            }
          )
        )
        .then(function () {
          expect(group.items[0].url).toBe("http://test.com/A");
          expect(group.items.length).toBe(1);
          done();
        });
    });
  });

  it("adds new children to the catalog index", function () {
    var item1 = new CatalogItem(terria);
    item1.id = "blah";

    group.add(item1);

    expect(terria.catalog.shareKeyIndex["blah"]).toBe(item1);
  });

  describe("removes removed children from the catalog index", function () {
    it("when child has a specific id", function () {
      var item1 = new CatalogItem(terria);
      item1.id = "blah";

      group.add(item1);
      group.remove(item1);

      expect(terria.catalog.shareKeyIndex["blah"]).toBeUndefined();
    });

    it("when child has no id", function () {
      var item1 = new CatalogItem(terria);
      item1.name = "blah";
      group.name = "foo";

      group.add(item1);

      expect(terria.catalog.shareKeyIndex["foo/blah"]).toBe(item1);

      group.remove(item1);

      expect(terria.catalog.shareKeyIndex["foo/blah"]).toBeUndefined();
    });
  });

  describe("for key clashes", function () {
    it("inserts items under an altered key if their shareKeys clash with existing keys", function (done) {
      group
        .updateFromJson({
          type: "group",
          items: [
            {
              name: "A",
              type: "item"
            },
            {
              name: "B",
              id: "uniqueId",
              type: "item"
            }
          ]
        })
        .then(function () {
          var noIdCatalogItem = new CatalogItem(terria);
          noIdCatalogItem.name = "A";

          var idCatalogItem = new CatalogItem(terria);
          idCatalogItem.id = "uniqueId";

          // When a call is specifically made to .add(), there is no effort to update existing items with the same id.
          group.add(noIdCatalogItem);
          group.add(idCatalogItem);

          expect(terria.catalog.shareKeyIndex["Root Group/A"]).not.toBe(
            noIdCatalogItem
          );
          expect(terria.catalog.shareKeyIndex["Root Group/A"]).toBeDefined();
          expect(terria.catalog.shareKeyIndex["Root Group/A (1)"]).toBe(
            noIdCatalogItem
          );

          expect(terria.catalog.shareKeyIndex["uniqueId"]).not.toBe(
            idCatalogItem
          );
          expect(terria.catalog.shareKeyIndex["uniqueId"]).toBeDefined();
          expect(terria.catalog.shareKeyIndex["uniqueId (1)"]).toBe(
            idCatalogItem
          );

          // Add again, this time the keys will clash again but should be added under the key + '(2)'
          var noIdCatalogItem2 = new CatalogItem(terria);
          noIdCatalogItem2.name = "A";

          var idCatalogItem2 = new CatalogItem(terria);
          idCatalogItem2.id = "uniqueId";

          group.add(noIdCatalogItem2);
          group.add(idCatalogItem2);

          expect(terria.catalog.shareKeyIndex["Root Group/A"]).not.toBe(
            noIdCatalogItem2
          );
          expect(terria.catalog.shareKeyIndex["uniqueId"]).not.toBe(
            idCatalogItem2
          );

          expect(terria.catalog.shareKeyIndex["uniqueId (1)"]).toBe(
            idCatalogItem
          );
          expect(terria.catalog.shareKeyIndex["Root Group/A (1)"]).toBe(
            noIdCatalogItem
          );

          expect(terria.catalog.shareKeyIndex["Root Group/A (2)"]).toBe(
            noIdCatalogItem2
          );
          expect(terria.catalog.shareKeyIndex["uniqueId (2)"]).toBe(
            idCatalogItem2
          );
        })
        .catch(fail)
        .then(done);
    });

    it("alters the id of clashing items", function (done) {
      group
        .updateFromJson({
          type: "group",
          items: [
            {
              name: "A",
              type: "item"
            },
            {
              name: "B",
              id: "uniqueId",
              type: "item"
            }
          ]
        })
        .then(function () {
          var noIdCatalogItem = new CatalogItem(terria);
          noIdCatalogItem.name = "A";

          var idCatalogItem = new CatalogItem(terria);
          idCatalogItem.id = "uniqueId";

          group.add(noIdCatalogItem);
          group.add(idCatalogItem);

          expect(noIdCatalogItem.uniqueId).toBe("Root Group/A (1)");
          expect(idCatalogItem.uniqueId).toBe("uniqueId (1)");
        })
        .catch(fail)
        .then(done);
    });
  });

  describe("setting isOpen", function () {
    beforeEach(function () {
      spyOn(terria, "disclaimerListener");
    });

    describe("to true when group has a disclaimer", function () {
      beforeEach(function () {
        group.initialMessage = {};
        group.isOpen = true;
      });

      it("triggers a disclaimerEvent", function () {
        expect(terria.disclaimerListener.calls.argsFor(0)[0]).toBe(group);
      });
    });

    describe("to true when group has no disclaimer", function () {
      beforeEach(function () {
        group.isOpen = true;
      });

      it("triggers no disclaimerEvent", function () {
        expect(terria.disclaimerListener).not.toHaveBeenCalled();
      });
    });
  });
});
