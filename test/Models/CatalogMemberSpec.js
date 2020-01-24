"use strict";

/*global require*/
var CatalogMember = require("../../lib/Models/CatalogMember");
var Terria = require("../../lib/Models/Terria");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

describe("CatalogMember", function() {
  var terria;
  var member;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    member = new CatalogMember(terria);
  });

  describe("triggering load()", function() {
    beforeEach(function() {
      spyOn(terria, "disclaimerListener");
      member._load = function() {
        return when.resolve(); // make the implementation-specific _load method return instantly, it's not on trial here.
      };
    });

    it("alters isLoading", function(done) {
      member
        .load()
        .then(function() {
          expect(member.isLoading).toBe(false);
          done();
        })
        .otherwise(done.fail);
    });

    it("returns a promise that allows otherwise to be chained", function(done) {
      member._load = function() {
        return when.reject();
      };
      expect(true).toBe(true); // stop it whinging about no expectations.

      member
        .load()
        .then(done.fail)
        .otherwise(done);
    });

    it("returns the same promise for subsequent calls", function() {
      var promise1 = member.load();
      var promise2 = member.load();

      expect(promise1).toBe(promise2);
    });
  });

  describe("infoWithoutSources", function() {
    var info;

    beforeEach(function() {
      info = [
        {
          name: "Info1"
        },
        {
          name: "Info2"
        }
      ];

      member.info = info.slice();
    });

    it("filters out info items that have been marked as having source info in them", function() {
      member._sourceInfoItemNames = ["Info1"];
      expect(member.infoWithoutSources).toEqual([info[1]]);
    });

    it("returns the same as member.info if no source info items exist", function() {
      expect(member.infoWithoutSources).toEqual(info);
    });
  });

  describe("using path()", function() {
    describe("without a parent", function() {
      it("shows default unnamed name", function() {
        expect(member.path).toBe("Unnamed Item");
      });
      it("shows its own name", function() {
        member
          .updateFromJson({
            name: "cybertruck"
          })
          .then(function() {
            expect(member.path).toBe("cybertruck");
          });
      });
    });
    describe("with a parent", function() {
      it("shows its own name appended to unnamed parent", function() {
        const parent = new CatalogMember(terria);
        member.parent = parent;
        member
          .updateFromJson({
            name: "cybertruck"
          })
          .then(function() {
            expect(member.path).toBe("Unnamed Item/cybertruck");
          });
      });
      it("shows its own name appended to parent", function() {
        const parent = new CatalogMember(terria);
        parent.name = "Parent";
        member.parent = parent;
        member
          .updateFromJson({
            name: "cybertruck"
          })
          .then(function() {
            expect(member.path).toBe("Parent/cybertruck");
          });
      });
    });
  });

  describe("updateFromJson", function() {
    it("merges the info property", function(done) {
      member
        .updateFromJson({
          info: [
            {
              name: "Test",
              content: "test!!"
            },
            {
              name: "Another Field",
              content: "Another value"
            }
          ]
        })
        .then(function() {
          expect(member.info[0].name).toBe("Test");
          expect(member.info[0].content).toBe("test!!");
          expect(member.info[1].name).toBe("Another Field");
          expect(member.info[1].content).toBe("Another value");

          return member.updateFromJson({
            info: [
              {
                name: "Test",
                content: "New Value!"
              }
            ]
          });
        })
        .then(function() {
          expect(member.info[0].name).toBe("Test");
          expect(member.info[0].content).toBe("New Value!");
          expect(member.info[1].name).toBe("Another Field");
          expect(member.info[1].content).toBe("Another value");
        })
        .then(done)
        .otherwise(done.fail);
    });
  });
});
