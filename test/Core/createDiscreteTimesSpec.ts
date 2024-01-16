import { Complete } from "../../lib/Core/TypeModifiers";
import createDiscreteTimesFromIsoSegments from "../../lib/Core/createDiscreteTimes";

describe("createDiscreteTimesFromIsoSegments", () => {
  it("should not duplicate stop date", () => {
    const result: Complete<{
      time?: string;
      tag?: string;
    }>[] = [];
    const value = "2018-02-07T00:00:00.000Z/2018-03-09T00:00:00.000Z/P15D";
    const isoSegments = value.split("/");
    const maxRefreshIntervals = 10;
    createDiscreteTimesFromIsoSegments(
      result,
      isoSegments[0],
      isoSegments[1],
      isoSegments[2],
      maxRefreshIntervals
    );
    expect(result.length).toBe(3);
    expect(result[0].time).toBe("2018-02-07T00:00:00Z");
    expect(result[1].time).toBe("2018-02-22T00:00:00Z");
    expect(result[2].time).toBe("2018-03-09T00:00:00Z");
  });

  it("should include a stop date", () => {
    const result: Complete<{
      time?: string;
      tag?: string;
    }>[] = [];
    const value = "2018-02-07T00:00:00.000Z/2018-03-10T00:00:00.000Z/P15D";
    const isoSegments = value.split("/");
    const maxRefreshIntervals = 10;
    createDiscreteTimesFromIsoSegments(
      result,
      isoSegments[0],
      isoSegments[1],
      isoSegments[2],
      maxRefreshIntervals
    );
    expect(result.length).toBe(4);
    expect(result[0].time).toBe("2018-02-07T00:00:00Z");
    expect(result[1].time).toBe("2018-02-22T00:00:00Z");
    expect(result[2].time).toBe("2018-03-09T00:00:00Z");
    expect(result[3].time).toBe("2018-03-10T00:00:00Z");
  });

  it("should limit time number to maxRefreshInterval", () => {
    const result: Complete<{
      time?: string;
      tag?: string;
    }>[] = [];
    const value = "2018-02-07T00:00:00.000Z/2018-03-09T00:00:00.000Z/P15D";
    const isoSegments = value.split("/");
    const maxRefreshIntervals = 2;
    createDiscreteTimesFromIsoSegments(
      result,
      isoSegments[0],
      isoSegments[1],
      isoSegments[2],
      maxRefreshIntervals
    );
    expect(result.length).toBe(maxRefreshIntervals);
    expect(result[0].time).toBe("2018-02-07T00:00:00Z");
    expect(result[1].time).toBe("2018-02-22T00:00:00Z");
  });
});
