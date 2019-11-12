"use strict";

var Clock = require("../../lib/Models/Clock");
var ClockStep = require("terriajs-cesium/Source/Core/ClockStep").default;
var ImageryLayerCatalogItem = require("../../lib/Models/ImageryLayerCatalogItem");
var Terria = require("../../lib/Models/Terria");
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;
var DataSourceClock = require("terriajs-cesium/Source/DataSources/DataSourceClock")
  .default;
var TimeIntervalCollection = require("terriajs-cesium/Source/Core/TimeIntervalCollection")
  .default;

describe("Clock", function() {
  var clock, terria, catalogItem;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    clock = new Clock();
    catalogItem = new ImageryLayerCatalogItem(terria);
    catalogItem.clock = new DataSourceClock();
    catalogItem.clock.startTime = JulianDate.fromIso8601("2016-01-01");
    catalogItem.clock.stopTime = JulianDate.fromIso8601("2016-01-27");
    catalogItem.clock.multiplier = 1;
    clock.setCatalogItem(catalogItem);
  });

  describe("with no intervals", function() {
    it("should allow catalogTime to be get and set as normal", function() {
      var date = JulianDate.fromIso8601("1941-12-05");

      expect(clock.currentTime).not.toBe(date);
      clock.currentTime = date;
      expect(clock.currentTime).toBe(date);
    });
  });

  describe("when set with a catalogItem that has intervals", function() {
    beforeEach(function() {
      catalogItem.intervals = new TimeIntervalCollection([
        new TimeInterval({
          start: JulianDate.fromIso8601("2016-01-03"),
          stop: JulianDate.fromIso8601("2016-01-07")
        }),
        new TimeInterval({
          start: JulianDate.fromIso8601("2016-01-12"),
          stop: JulianDate.fromIso8601("2016-01-15")
        }),
        new TimeInterval({
          start: JulianDate.fromIso8601("2016-01-20"),
          stop: JulianDate.fromIso8601("2016-01-24")
        })
      ]);
    });

    it("should advance across a gap on tick if the tick would put currentTime into a gap", function() {
      clock.clockStep = ClockStep.TICK_DEPENDENT;
      clock.shouldAnimate = true;
      clock.currentTime = JulianDate.fromIso8601("2016-01-07");

      expect(clock.currentTime).not.toEqual(
        JulianDate.fromIso8601("2016-01-12")
      );

      clock.tick();

      expect(clock.currentTime).toEqual(JulianDate.fromIso8601("2016-01-12"));
    });

    describe("determineGap", function() {
      it("should correctly determine a gap between intervals", function() {
        var gap = clock.determineGap(JulianDate.fromIso8601("2016-01-18"));

        expect(gap.start).toEqual(JulianDate.fromIso8601("2016-01-15"));
        expect(gap.stop).toEqual(JulianDate.fromIso8601("2016-01-20"));
      });

      it("should return undefined if called for a date that the clock has an interval for", function() {
        expect(
          clock.determineGap(JulianDate.fromIso8601("2016-01-13"))
        ).toBeUndefined();
      });

      it("should start a gap requested before the first interval at the start of the clock's time", function() {
        var gap = clock.determineGap(JulianDate.fromIso8601("2016-01-02"));

        expect(gap.start).toEqual(JulianDate.fromIso8601("2016-01-01"));
        expect(gap.stop).toEqual(JulianDate.fromIso8601("2016-01-03"));
      });

      it("should end a gap requested after the last interval at the end of the clock's time", function() {
        var gap = clock.determineGap(JulianDate.fromIso8601("2016-01-25"));

        expect(gap.start).toEqual(JulianDate.fromIso8601("2016-01-24"));
        expect(gap.stop).toEqual(JulianDate.fromIso8601("2016-01-27"));
      });
    });

    describe("currentTime", function() {
      it("is set as normal if time is within interval", function() {
        var date = JulianDate.fromIso8601("2016-01-04");

        expect(clock.currentTime).not.toBe(date);
        clock.currentTime = date;
        expect(clock.currentTime).toBe(date);
      });

      it("is shifted to start of next interval if in a gap", function() {
        clock.currentTime = JulianDate.fromIso8601("2016-01-08");
        expect(clock.currentTime).toEqual(JulianDate.fromIso8601("2016-01-12"));
      });

      it("is shifted to start of next interval if before any interval", function() {
        clock.currentTime = JulianDate.fromIso8601("2016-01-02");
        expect(clock.currentTime).toEqual(JulianDate.fromIso8601("2016-01-03"));
      });

      it("is shifted to the end if after all the intervals", function() {
        clock.currentTime = JulianDate.fromIso8601("2016-01-26");
        expect(clock.currentTime).toEqual(JulianDate.fromIso8601("2016-01-27"));
      });
    });
  });
});
