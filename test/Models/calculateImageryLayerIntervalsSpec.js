"use strict";

/*global require,describe,it,expect,beforeEach,fail*/

var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var calculateImageryLayerIntervals = require("../../lib/Models/calculateImageryLayerIntervals");
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;

describe("calculateImageryLayerIntervals", function() {
  beforeEach(function() {});

  // Syntax shortner, build a TimeInterval from the 4 key values we are using.
  function TI(start, startIncluded, stop, stopIncluded) {
    return new TimeInterval({
      start: JulianDate.fromIso8601(start),
      isStartIncluded: startIncluded,
      stop: JulianDate.fromIso8601(stop),
      isStopIncluded: stopIncluded
    });
  }

  // Syntax shortner, build a TimeCollection from a TimeInterval array.
  function TC(intervals) {
    return { timeIntervals: intervals };
  }

  // Syntax shortner, build the interval structure from two values.
  function intervals(current, next) {
    return { currentInterval: current, nextInterval: next };
  }

  it("works correctly", function() {
    // We use the math notation () and [] to denote time intervals exclusive of the value and inclusive of the value respectively.
    // Note: This code in this section could be further simplified, but we have left if more verbose for readability and clarity.

    // Test 1: Test [), [)
    // [2018-01-01, 2018-01-08), [2018-01-08, 2018-01-15)
    const tc1 = TC([
      TI("2018-01-01", true, "2018-01-08", false),
      TI("2018-01-08", true, "2018-01-15", false)
    ]);
    // Test 2: Test (], (]
    // (2018-01-01, 2018-01-08], (2018-01-08, 2018-01-15]
    const tc2 = TC([
      TI("2018-01-01", false, "2018-01-08", true),
      TI("2018-01-08", false, "2018-01-15", true)
    ]);
    // Test 3: Test grossly overlapping intervals: [:1 [:2 ]:1 ]:2
    // [2018-01-01, 2018-01-12], [2018-01-05, 2018-01-15]
    const tc3 = TC([
      TI("2018-01-01", true, "2018-01-12", true),
      TI("2018-01-05", true, "2018-01-15", true)
    ]);
    // Test 4: Test overall starts and ends with inclusive interval ends: [), []
    // [2018-01-01, 2018-01-08), [2018-01-08, 2018-01-15]
    const tc4 = TC([
      TI("2018-01-01", true, "2018-01-08", false),
      TI("2018-01-08", true, "2018-01-15", true)
    ]);
    // Test 5: Test overall starts and ends with inclusive interval ends: (), [)
    // (2018-01-01, 2018-01-08), [2018-01-08, 2018-01-15)
    const tc5 = TC([
      TI("2018-01-01", false, "2018-01-08", false),
      TI("2018-01-08", true, "2018-01-15", false)
    ]);
    // Test 6: Test just non touching intervals: [), (]
    // [2018-01-01, 2018-01-08), (2018-01-08, 2018-01-15]
    const tc6 = TC([
      TI("2018-01-01", true, "2018-01-08", false),
      TI("2018-01-08", false, "2018-01-15", true)
    ]);
    // Test 7: Test just overlapping intervals: [], []
    // [2018-01-01, 2018-01-08], [2018-01-08, 2018-01-15]
    const tc7 = TC([
      TI("2018-01-01", true, "2018-01-08", true),
      TI("2018-01-08", true, "2018-01-15", true)
    ]);

    // Define some critical time points for our tests.
    const fistIntervalTime = JulianDate.fromIso8601("2018-01-02");
    const secondIntervalTime = JulianDate.fromIso8601("2018-01-14");
    const criticalValue = JulianDate.fromIso8601("2018-01-08");
    const criticalValue1Overlapping = JulianDate.fromIso8601("2018-01-05");
    const criticalValue2Overlapping = JulianDate.fromIso8601("2018-01-12");

    const firstOpenOpen = TI("2018-01-01", false, "2018-01-08", false);
    const firstOpenClose = TI("2018-01-01", false, "2018-01-08", true);
    const firstCloseOpen = TI("2018-01-01", true, "2018-01-08", false);
    //const firstCloseClose = TI('2018-01-01', true,  '2018-01-08', true);
    //const lastOpenOpen    = TI('2018-01-08', false, '2018-01-15', false);
    const lastOpenClose = TI("2018-01-08", false, "2018-01-15", true);
    const lastCloseOpen = TI("2018-01-08", true, "2018-01-15", false);
    const lastCloseClose = TI("2018-01-08", true, "2018-01-15", true);

    const criticalClosed = TI("2018-01-08", true, "2018-01-08", true);

    // Test 1.
    const t1ForwardBegin = intervals(firstCloseOpen, lastCloseOpen);
    const t1ForwardEnd = intervals(lastCloseOpen, firstCloseOpen);
    const t1ReverseBegin = intervals(firstCloseOpen, lastCloseOpen);
    const t1ReverseEnd = intervals(lastCloseOpen, firstCloseOpen);
    expect(calculateImageryLayerIntervals(tc1, fistIntervalTime, true)).toEqual(
      t1ForwardBegin
    );
    expect(
      calculateImageryLayerIntervals(tc1, secondIntervalTime, true)
    ).toEqual(t1ForwardEnd);
    expect(calculateImageryLayerIntervals(tc1, criticalValue, true)).toEqual(
      t1ForwardEnd
    );
    expect(
      calculateImageryLayerIntervals(tc1, fistIntervalTime, false)
    ).toEqual(t1ReverseBegin);
    expect(
      calculateImageryLayerIntervals(tc1, secondIntervalTime, false)
    ).toEqual(t1ReverseEnd);
    expect(calculateImageryLayerIntervals(tc1, criticalValue, false)).toEqual(
      t1ReverseEnd
    );
    // Test some non cyclic edge cases.
    const t1ForwardEndNonCyclic = intervals(lastCloseOpen, null);
    const t1ReverseBeginNonCyclic = intervals(firstCloseOpen, null);
    expect(
      calculateImageryLayerIntervals(tc1, secondIntervalTime, true, false)
    ).toEqual(t1ForwardEndNonCyclic);
    expect(
      calculateImageryLayerIntervals(tc1, criticalValue, true, false)
    ).toEqual(t1ForwardEndNonCyclic);
    expect(
      calculateImageryLayerIntervals(tc1, fistIntervalTime, false, false)
    ).toEqual(t1ReverseBeginNonCyclic);

    // Test 2.
    const t2ForwardBegin = intervals(firstOpenClose, lastOpenClose);
    const t2ForwardEnd = intervals(lastOpenClose, firstOpenClose);
    const t2ReverseBegin = intervals(firstOpenClose, lastOpenClose);
    const t2ReverseEnd = intervals(lastOpenClose, firstOpenClose);
    expect(calculateImageryLayerIntervals(tc2, fistIntervalTime, true)).toEqual(
      t2ForwardBegin
    );
    expect(
      calculateImageryLayerIntervals(tc2, secondIntervalTime, true)
    ).toEqual(t2ForwardEnd);
    expect(calculateImageryLayerIntervals(tc2, criticalValue, true)).toEqual(
      t2ForwardBegin
    );
    expect(
      calculateImageryLayerIntervals(tc2, fistIntervalTime, false)
    ).toEqual(t2ReverseBegin);
    expect(
      calculateImageryLayerIntervals(tc2, secondIntervalTime, false)
    ).toEqual(t2ReverseEnd);
    expect(calculateImageryLayerIntervals(tc2, criticalValue, false)).toEqual(
      t2ReverseBegin
    );
    // Test some non cyclic edge cases.
    const t2ForwardEndNonCyclic = intervals(lastOpenClose, null);
    const t2ReverseBeginNonCyclic = intervals(firstOpenClose, null);
    expect(
      calculateImageryLayerIntervals(tc2, secondIntervalTime, true, false)
    ).toEqual(t2ForwardEndNonCyclic);
    expect(
      calculateImageryLayerIntervals(tc2, fistIntervalTime, false, false)
    ).toEqual(t2ReverseBeginNonCyclic);
    expect(
      calculateImageryLayerIntervals(tc2, criticalValue, false, false)
    ).toEqual(t2ReverseBeginNonCyclic);

    // Test 3.
    const t3Begin = TI("2018-01-01", true, "2018-01-05", false);
    const t3Middle = TI("2018-01-05", true, "2018-01-12", true);
    const t3End = TI("2018-01-12", false, "2018-01-15", true);
    const t3ForwardBegin = intervals(t3Begin, t3Middle);
    const t3ForwardMiddle = intervals(t3Middle, t3End);
    const t3ForwardEnd = intervals(t3End, t3Begin);
    const t3ReverseBegin = intervals(t3Begin, t3End);
    const t3ReverseMiddle = intervals(t3Middle, t3Begin);
    const t3ReverseEnd = intervals(t3End, t3Middle);
    expect(calculateImageryLayerIntervals(tc3, fistIntervalTime, true)).toEqual(
      t3ForwardBegin
    );
    expect(
      calculateImageryLayerIntervals(tc3, secondIntervalTime, true)
    ).toEqual(t3ForwardEnd);
    expect(calculateImageryLayerIntervals(tc3, criticalValue, true)).toEqual(
      t3ForwardMiddle
    ); // Note: In this instance the criticalValue is actually not the critical value, but just a middle value.
    expect(
      calculateImageryLayerIntervals(tc3, criticalValue1Overlapping, true)
    ).toEqual(t3ForwardMiddle);
    expect(
      calculateImageryLayerIntervals(tc3, criticalValue2Overlapping, true)
    ).toEqual(t3ForwardMiddle);
    expect(
      calculateImageryLayerIntervals(tc3, fistIntervalTime, false)
    ).toEqual(t3ReverseBegin);
    expect(
      calculateImageryLayerIntervals(tc3, secondIntervalTime, false)
    ).toEqual(t3ReverseEnd);
    expect(calculateImageryLayerIntervals(tc3, criticalValue, false)).toEqual(
      t3ReverseMiddle
    ); // Note: In this instance the criticalValue is actually not the critical value, but just a middle value.
    expect(
      calculateImageryLayerIntervals(tc3, criticalValue1Overlapping, false)
    ).toEqual(t3ReverseMiddle);
    expect(
      calculateImageryLayerIntervals(tc3, criticalValue2Overlapping, false)
    ).toEqual(t3ReverseMiddle);

    // Test 4.
    const t4ForwardBegin = intervals(firstCloseOpen, lastCloseClose);
    const t4ForwardEnd = intervals(lastCloseClose, firstCloseOpen);
    const t4ReverseBegin = intervals(firstCloseOpen, lastCloseClose);
    const t4ReverseEnd = intervals(lastCloseClose, firstCloseOpen);
    expect(calculateImageryLayerIntervals(tc4, fistIntervalTime, true)).toEqual(
      t4ForwardBegin
    );
    expect(
      calculateImageryLayerIntervals(tc4, secondIntervalTime, true)
    ).toEqual(t4ForwardEnd);
    expect(calculateImageryLayerIntervals(tc4, criticalValue, true)).toEqual(
      t4ForwardEnd
    );
    expect(
      calculateImageryLayerIntervals(tc4, fistIntervalTime, false)
    ).toEqual(t4ReverseBegin);
    expect(
      calculateImageryLayerIntervals(tc4, secondIntervalTime, false)
    ).toEqual(t4ReverseEnd);
    expect(calculateImageryLayerIntervals(tc4, criticalValue, false)).toEqual(
      t4ReverseEnd
    );

    // Test 5.
    const t5ForwardBegin = intervals(firstOpenOpen, lastCloseOpen);
    const t5ForwardEnd = intervals(lastCloseOpen, firstOpenOpen);
    const t5ReverseBegin = intervals(firstOpenOpen, lastCloseOpen);
    const t5ReverseEnd = intervals(lastCloseOpen, firstOpenOpen);
    expect(calculateImageryLayerIntervals(tc5, fistIntervalTime, true)).toEqual(
      t5ForwardBegin
    );
    expect(
      calculateImageryLayerIntervals(tc5, secondIntervalTime, true)
    ).toEqual(t5ForwardEnd);
    expect(calculateImageryLayerIntervals(tc5, criticalValue, true)).toEqual(
      t5ForwardEnd
    );
    expect(
      calculateImageryLayerIntervals(tc5, fistIntervalTime, false)
    ).toEqual(t5ReverseBegin);
    expect(
      calculateImageryLayerIntervals(tc5, secondIntervalTime, false)
    ).toEqual(t5ReverseEnd);
    expect(calculateImageryLayerIntervals(tc5, criticalValue, false)).toEqual(
      t5ReverseEnd
    );

    // Test 6.
    const t6ForwardBegin = intervals(firstCloseOpen, criticalClosed);
    const t6ForwardCritical = intervals(criticalClosed, lastOpenClose);
    const t6ForwardEnd = intervals(lastOpenClose, firstCloseOpen);
    const t6ReverseBegin = intervals(firstCloseOpen, lastOpenClose);
    const t6ReverseCritical = intervals(criticalClosed, firstCloseOpen);
    const t6ReverseEnd = intervals(lastOpenClose, criticalClosed);
    expect(calculateImageryLayerIntervals(tc6, fistIntervalTime, true)).toEqual(
      t6ForwardBegin
    );
    expect(
      calculateImageryLayerIntervals(tc6, secondIntervalTime, true)
    ).toEqual(t6ForwardEnd);
    expect(calculateImageryLayerIntervals(tc6, criticalValue, true)).toEqual(
      t6ForwardCritical
    );
    expect(
      calculateImageryLayerIntervals(tc6, fistIntervalTime, false)
    ).toEqual(t6ReverseBegin);
    expect(
      calculateImageryLayerIntervals(tc6, secondIntervalTime, false)
    ).toEqual(t6ReverseEnd);
    expect(calculateImageryLayerIntervals(tc6, criticalValue, false)).toEqual(
      t6ReverseCritical
    );

    // Test 7.
    // NOTE: This may be confusing, but the different inputs should lead to the same results as the test case 6 (that they use the same expectations is not a bug).
    expect(calculateImageryLayerIntervals(tc7, fistIntervalTime, true)).toEqual(
      t6ForwardBegin
    );
    expect(
      calculateImageryLayerIntervals(tc7, secondIntervalTime, true)
    ).toEqual(t6ForwardEnd);
    expect(calculateImageryLayerIntervals(tc7, criticalValue, true)).toEqual(
      t6ForwardCritical
    );
    expect(
      calculateImageryLayerIntervals(tc7, fistIntervalTime, false)
    ).toEqual(t6ReverseBegin);
    expect(
      calculateImageryLayerIntervals(tc7, secondIntervalTime, false)
    ).toEqual(t6ReverseEnd);
    expect(calculateImageryLayerIntervals(tc7, criticalValue, false)).toEqual(
      t6ReverseCritical
    );
  });
});
