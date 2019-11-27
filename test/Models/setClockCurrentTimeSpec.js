"use strict";

/*global require,beforeEach*/
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var DataSourceClock = require("terriajs-cesium/Source/DataSources/DataSourceClock")
  .default;
var setClockCurrentTime = require("../../lib/Models/setClockCurrentTime");

describe("setClockCurrentTime", function() {
  describe("Time slider initial time as specified by initialTimeSource ", function() {
    var clock;

    beforeEach(function() {
      clock = new DataSourceClock();
    });

    // Future developers take note: some of these tests will stop working in August 3015.
    it("should be present if not provided", function() {
      clock.startTime = JulianDate.fromIso8601("2015-08-07T00:00:00.00Z");
      clock.stopTime = JulianDate.fromIso8601("3015-08-09T00:00:00.00Z");

      setClockCurrentTime(clock);

      var dateNow = new Date().toISOString();
      var currentTime = JulianDate.toIso8601(clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      dateNow = dateNow.substr(0, 10);
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe(dateNow);
    });

    it('should be start if "start" set', function() {
      clock.startTime = JulianDate.fromIso8601("2013-08-07T00:00:00.00Z");
      clock.stopTime = JulianDate.fromIso8601("2015-08-09T00:00:00.00Z");

      setClockCurrentTime(clock, "start");

      var currentTime = JulianDate.toIso8601(clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2013-08-07");
    });

    it("should be start if date specified is before range", function() {
      clock.startTime = JulianDate.fromIso8601("2013-08-07T00:00:00.00Z");
      clock.stopTime = JulianDate.fromIso8601("2015-08-09T00:00:00.00Z");

      setClockCurrentTime(clock, "2000-08-08");

      var currentTime = JulianDate.toIso8601(clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2013-08-07");
    });

    it('should be current time if "present" set', function() {
      clock.startTime = JulianDate.fromIso8601("2013-08-07T00:00:00.00Z");
      clock.stopTime = JulianDate.fromIso8601("3115-08-09T00:00:00.00Z");

      setClockCurrentTime(clock, "present");

      var dateNow = new Date().toISOString();
      var currentTime = JulianDate.toIso8601(clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      dateNow = dateNow.substr(0, 10);
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe(dateNow);
    });

    it('should be last time if "end" set', function() {
      clock.startTime = JulianDate.fromIso8601("2013-08-07T00:00:00.00Z");
      clock.stopTime = JulianDate.fromIso8601("2015-08-09T00:00:00.00Z");

      setClockCurrentTime(clock, "end");

      var currentTime = JulianDate.toIso8601(clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2015-08-09");
    });

    it("should be last time if date specified is after range", function() {
      clock.startTime = JulianDate.fromIso8601("2013-08-07T00:00:00.00Z");
      clock.stopTime = JulianDate.fromIso8601("2015-08-09T00:00:00.00Z");

      setClockCurrentTime(clock, "3015-08-08");

      var currentTime = JulianDate.toIso8601(clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2015-08-09");
    });

    it("should be set to date specified if date is specified", function() {
      clock.startTime = JulianDate.fromIso8601("2013-08-07T00:00:00.00Z");
      clock.stopTime = JulianDate.fromIso8601("2015-08-11T00:00:00.00Z");

      setClockCurrentTime(clock, "2015-08-08T00:00:00.00Z");

      var currentTime = JulianDate.toIso8601(clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2015-08-08");
    });

    it("should be set to start if date specified is before time range", function() {
      clock.startTime = JulianDate.fromIso8601("2015-08-07T00:00:00.00Z");
      clock.stopTime = JulianDate.fromIso8601("2015-08-09T00:00:00.00Z");

      setClockCurrentTime(clock, "2013-01-01");

      var currentTime = JulianDate.toIso8601(clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2015-08-07");
    });

    it("should be set to end if date specified is after time range", function() {
      clock.startTime = JulianDate.fromIso8601("2015-08-07T00:00:00.00Z");
      clock.stopTime = JulianDate.fromIso8601("2015-08-09T00:00:00.00Z");

      setClockCurrentTime(clock, "2222-08-08");

      var currentTime = JulianDate.toIso8601(clock.currentTime, 3);
      // Do not compare time, because on some systems the second could have ticked over between getting the two times.
      currentTime = currentTime.substr(0, 10);
      expect(currentTime).toBe("2015-08-09");
    });

    it("should throw if a rubbish string is specified", function() {
      clock.startTime = JulianDate.fromIso8601("2013-08-07T00:00:00.00Z");
      clock.stopTime = JulianDate.fromIso8601("2115-08-09T00:00:00.00Z");

      expect(function() {
        setClockCurrentTime(clock, "2015z08-08");
      }).toThrow();
    });
  });
});
