"use strict";

var combineFilters = require("../../lib/Core/combineFilters");

describe("combineFilters", function () {
  describe("basic tests:", function () {
    it("returns true when all filters true", function () {
      expect(
        combineFilters([
          function () {
            return true;
          },
          function () {
            return true;
          },
          function () {
            return true;
          }
        ])()
      ).toBe(true);
    });

    it("returns false when all functions false", function () {
      expect(
        combineFilters([
          function () {
            return false;
          },
          function () {
            return false;
          },
          function () {
            return false;
          }
        ])()
      ).toBe(false);
    });

    it("returns false when one functions false", function () {
      expect(
        combineFilters([
          function () {
            return false;
          },
          function () {
            return true;
          },
          function () {
            return false;
          }
        ])()
      ).toBe(false);
    });
  });

  it("passes arguments through to all filters", function () {
    var filters = [
      jasmine.createSpy("spy1").and.returnValue(true),
      jasmine.createSpy("spy2").and.returnValue(true),
      jasmine.createSpy("spy3").and.returnValue(true)
    ];

    combineFilters(filters)("I", "am", "an", "elephant");

    filters.forEach(function (filterSpy) {
      expect(filterSpy).toHaveBeenCalledWith("I", "am", "an", "elephant");
    });
  });

  it("stops on first false result", function () {
    var filters = [
      jasmine.createSpy("spy1").and.returnValue(true),
      jasmine.createSpy("spy2").and.returnValue(false),
      jasmine.createSpy("spy3").and.returnValue(true)
    ];

    combineFilters(filters)();

    expect(filters[0]).toHaveBeenCalled();
    expect(filters[1]).toHaveBeenCalled();
    expect(filters[2]).not.toHaveBeenCalled();
  });

  describe("only calls a function once", function () {
    it("if it's specified multiple times", function () {
      var spy1 = jasmine.createSpy("spy1").and.returnValue(true);

      var filters = [
        spy1,
        jasmine.createSpy("spy2").and.returnValue(true),
        spy1
      ];

      combineFilters(filters)();

      expect(spy1.calls.count()).toBe(1);
    });

    it("if combineFilters() is called on the result of another combineFilters() call", function () {
      var spy1 = jasmine.createSpy("spy1").and.returnValue(true);

      var combined = combineFilters([spy1, spy1]);

      combineFilters([combined, spy1])();

      expect(spy1.calls.count()).toBe(1);
    });
  });
});
